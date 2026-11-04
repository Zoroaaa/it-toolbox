import { Hono } from 'hono'
import type { Env } from '../../types'
import { safeFetch, validatePublicUrl } from '../../lib/ssrf'

export const proxyRoute = new Hono<{ Bindings: Env }>()

proxyRoute.post('/', async (c) => {
  const { url, method, headers, body } = await c.req.json<{
    url: string
    method: string
    headers: Record<string, string>
    body?: string
  }>()

  if (!url) {
    return c.json({ success: false, error: 'URL is required' }, 400)
  }

  const check = validatePublicUrl(url)
  if (!check.ok) {
    return c.json({ success: false, error: check.error }, 400)
  }

  try {
    const fetchHeaders = new Headers()
    Object.entries(headers || {}).forEach(([key, value]) => {
      const lowerKey = key.toLowerCase()
      if (!['host', 'content-length', 'transfer-encoding', 'connection'].includes(lowerKey)) {
        fetchHeaders.set(key, value)
      }
    })

    const safe = await safeFetch(url, {
      method: method || 'GET',
      headers: fetchHeaders,
      body: body && !['GET', 'HEAD'].includes(method?.toUpperCase() || '') ? body : undefined,
    })

    if (!safe.ok) {
      return c.json({ success: false, error: safe.error }, 400)
    }

    const { response: res, body: responseBody, truncated } = safe.result
    const responseHeaders: Record<string, string> = {}
    res.headers.forEach((value, key) => {
      responseHeaders[key] = value
    })

    return c.json({
      success: true,
      status: res.status,
      statusText: res.statusText,
      headers: responseHeaders,
      body: responseBody,
      truncated,
    })
  } catch (e) {
    return c.json({ success: false, error: (e as Error).message }, 500)
  }
})
