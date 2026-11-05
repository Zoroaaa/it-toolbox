/**
 * 外发请求安全校验：仅允许公网 http/https，拦截内网/回环/云元数据地址，限制重定向与响应体积。
 */

const BLOCKED_HOSTNAMES = new Set([
  'localhost',
  'localhost.localdomain',
  'metadata.google.internal',
  'metadata',
])

const BLOCKED_SUFFIXES = ['.localhost', '.local', '.internal', '.home.arpa']

const MAX_REDIRECTS = 2
export const MAX_RESPONSE_BYTES = 2 * 1024 * 1024

function isPrivateIpv4(host: string): boolean {
  const parts = host.split('.').map(Number)
  if (parts.length !== 4 || parts.some((n) => Number.isNaN(n) || n < 0 || n > 255)) return false
  const [a, b] = parts

  if (a === 0 || a === 10 || a === 127) return true
  if (a === 169 && b === 254) return true
  if (a === 172 && b >= 16 && b <= 31) return true
  if (a === 192 && b === 168) return true
  if (a === 100 && b >= 64 && b <= 127) return true
  if (a === 192 && b === 0) return true
  if (a === 198 && (b === 18 || b === 19)) return true
  if (a >= 224) return true
  return false
}

function isPrivateIpv6(host: string): boolean {
  const h = host.replace(/^\[|\]$/g, '').toLowerCase()
  if (h === '::1' || h === '::') return true
  if (h.startsWith('fc') || h.startsWith('fd')) return true
  if (h.startsWith('fe8') || h.startsWith('fe9') || h.startsWith('fea') || h.startsWith('feb')) return true
  // IPv4 映射地址 ::ffff:127.0.0.1
  const mapped = h.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/)
  if (mapped) return isPrivateIpv4(mapped[1])
  return false
}

export type UrlCheck = { ok: true; url: URL } | { ok: false; error: string }

export function validatePublicUrl(input: string): UrlCheck {
  let url: URL
  try {
    url = new URL(input)
  } catch {
    return { ok: false, error: 'Invalid URL' }
  }

  if (!['http:', 'https:'].includes(url.protocol)) {
    return { ok: false, error: 'Only HTTP/HTTPS URLs are allowed' }
  }

  const host = url.hostname.toLowerCase()
  if (!host) return { ok: false, error: 'URL host is required' }
  if (BLOCKED_HOSTNAMES.has(host) || BLOCKED_SUFFIXES.some((suffix) => host.endsWith(suffix))) {
    return { ok: false, error: 'Private or local addresses are not allowed' }
  }
  if (isPrivateIpv4(host) || isPrivateIpv6(host)) {
    return { ok: false, error: 'Private or local addresses are not allowed' }
  }

  return { ok: true, url }
}

export interface SafeFetchResult {
  response: Response
  body: string
  truncated: boolean
}

/**
 * 手动跟随最多 2 次重定向，每一跳都重新做公网校验，并限制响应体大小。
 */
export async function safeFetch(
  input: string,
  init: RequestInit = {},
): Promise<{ ok: true; result: SafeFetchResult } | { ok: false; error: string }> {
  let current = input
  // 整个转发（含重定向）共用一个总预算，避免多次跳转累加超时拖到边缘 502
  const totalTimeout = AbortSignal.timeout(12000)

  for (let hop = 0; hop <= MAX_REDIRECTS; hop++) {
    const check = validatePublicUrl(current)
    if (!check.ok) return { ok: false, error: check.error }

    const response = await fetch(check.url.toString(), {
      ...init,
      redirect: 'manual',
      signal: init.signal ?? totalTimeout,
    })

    if (response.status >= 300 && response.status < 400) {
      const location = response.headers.get('location')
      if (!location) return { ok: true, result: { response, body: '', truncated: false } }
      current = new URL(location, check.url).toString()
      continue
    }

    const contentLength = Number(response.headers.get('content-length') ?? 0)
    if (contentLength > MAX_RESPONSE_BYTES) {
      return { ok: false, error: 'Response too large (max 2MB)' }
    }

    const body = await response.text()
    if (body.length > MAX_RESPONSE_BYTES) {
      return { ok: true, result: { response, body: body.slice(0, MAX_RESPONSE_BYTES), truncated: true } }
    }

    return { ok: true, result: { response, body, truncated: false } }
  }

  return { ok: false, error: 'Too many redirects (max 2)' }
}
