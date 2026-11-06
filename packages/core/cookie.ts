import { Result } from './common'

/**
 * Cookie 头解析。
 *
 * 支持两类输入：
 * - 请求头 `Cookie: a=1; b=2`
 * - 响应头 `Set-Cookie: a=1; Path=/; HttpOnly`（可多行）
 *
 * 判定规则：单行中除第一个键值对外，若还出现 Domain/Path/Expires/Max-Age/SameSite/
 * HttpOnly/Secure/Partitioned/Priority 之一，则按 Set-Cookie 解析，否则按请求 Cookie 解析。
 */

export const COOKIE_ATTRIBUTE_NAMES = [
  'domain',
  'path',
  'expires',
  'max-age',
  'samesite',
  'httponly',
  'secure',
  'partitioned',
  'priority',
] as const

const ATTRIBUTE_SET = new Set<string>(COOKIE_ATTRIBUTE_NAMES)

export interface CookieAttribute {
  name: string
  /** 无值属性（HttpOnly/Secure/Partitioned）为空字符串 */
  value: string
  /** 是否为标准属性；非标准属性交由 UI 标红，不静默丢弃 */
  known: boolean
}

export interface ParsedCookie {
  name: string
  value: string
  attributes: CookieAttribute[]
  source: 'set-cookie' | 'request'
  raw: string
}

export function isKnownCookieAttribute(name: string): boolean {
  return ATTRIBUTE_SET.has(name.trim().toLowerCase())
}

/** 按 `;` 切分，忽略引号内的分号 */
function splitSegments(line: string): string[] {
  const segments: string[] = []
  let buffer = ''
  let quote: string | null = null

  for (const char of line) {
    if (quote) {
      if (char === quote) quote = null
      buffer += char
      continue
    }
    if (char === '"' || char === "'") {
      quote = char
      buffer += char
      continue
    }
    if (char === ';') {
      segments.push(buffer)
      buffer = ''
      continue
    }
    buffer += char
  }
  segments.push(buffer)

  return segments.map((s) => s.trim()).filter(Boolean)
}

function splitPair(segment: string): { name: string; value: string } {
  const index = segment.indexOf('=')
  if (index === -1) return { name: segment.trim(), value: '' }
  return {
    name: segment.slice(0, index).trim(),
    value: segment.slice(index + 1).trim(),
  }
}

function unquote(value: string): string {
  if (value.length >= 2 && value.startsWith('"') && value.endsWith('"')) return value.slice(1, -1)
  return value
}

function isValidCookieName(name: string): boolean {
  return name.length > 0 && !/[\s=;,]/.test(name)
}

export function parseCookies(input: string): Result<ParsedCookie[]> {
  const lines = input
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0 && !line.startsWith('#'))

  if (!lines.length) return { ok: false, error: '请输入 Cookie 或 Set-Cookie 内容' }

  const cookies: ParsedCookie[] = []
  const invalid: string[] = []

  for (const line of lines) {
    const body = line.replace(/^(set-cookie|cookie)\s*:\s*/i, '')
    const segments = splitSegments(body)
    if (!segments.length) continue

    const [first, ...rest] = segments
    const looksLikeSetCookie = rest.some((segment) =>
      isKnownCookieAttribute(splitPair(segment).name),
    )

    if (looksLikeSetCookie) {
      const pair = splitPair(first)
      if (!isValidCookieName(pair.name)) {
        invalid.push(line)
        continue
      }
      cookies.push({
        name: pair.name,
        value: unquote(pair.value),
        attributes: rest.map((segment) => {
          const attr = splitPair(segment)
          return {
            name: attr.name,
            value: unquote(attr.value),
            known: isKnownCookieAttribute(attr.name),
          }
        }),
        source: 'set-cookie',
        raw: line,
      })
      continue
    }

    // 请求头：一行可含多个 name=value
    for (const segment of segments) {
      const pair = splitPair(segment)
      if (!isValidCookieName(pair.name)) {
        invalid.push(segment)
        continue
      }
      cookies.push({
        name: pair.name,
        value: unquote(pair.value),
        attributes: [],
        source: 'request',
        raw: segment,
      })
    }
  }

  if (!cookies.length) {
    const detail = invalid.length ? `：${invalid[0]}` : ''
    return { ok: false, error: `未解析到合法 Cookie${detail}` }
  }

  return { ok: true, value: cookies }
}

/** 生成请求头值，不含 `Cookie:` 前缀 */
export function buildCookieHeader(cookies: { name: string; value: string }[]): string {
  return cookies
    .filter((cookie) => cookie.name.trim())
    .map((cookie) => `${cookie.name.trim()}=${cookie.value}`)
    .join('; ')
}
