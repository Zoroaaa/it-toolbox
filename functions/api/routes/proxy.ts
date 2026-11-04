import { Hono } from 'hono'
import type { Env } from '../../types'

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

  try {
    const urlObj = new URL(url)
    if (!['http:', 'https:'].includes(urlObj.protocol)) {
      return c.json({ success: false, error: 'Only HTTP/HTTPS URLs are allowed' }, 400)
    }
  } catch {
    return c.json({ success: false, error: 'Invalid URL' }, 400)
  }

  try {
    const fetchHeaders = new Headers()
    Object.entries(headers || {}).forEach(([key, value]) => {
      const lowerKey = key.toLowerCase()
      if (!['host', 'content-length', 'transfer-encoding', 'connection'].includes(lowerKey)) {
        fetchHeaders.set(key, value)
      }
    })

    const res = await fetch(url, {
      method: method || 'GET',
      headers: fetchHeaders,
      body: body && !['GET', 'HEAD'].includes(method?.toUpperCase() || '') ? body : undefined,
    })

    const responseHeaders: Record<string, string> = {}
    res.headers.forEach((value, key) => {
      responseHeaders[key] = value
    })

    const responseBody = await res.text()

    return c.json({
      success: true,
      status: res.status,
      statusText: res.statusText,
      headers: responseHeaders,
      body: responseBody,
    })
  } catch (e) {
    return c.json({ success: false, error: (e as Error).message }, 500)
  }
})
