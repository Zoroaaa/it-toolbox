import { Hono } from 'hono'
import type { Env } from '../route'

export const dnsRoute = new Hono<{ Bindings: Env }>()

dnsRoute.get('/', async (c) => {
  const domain = c.req.query('domain')
  const type   = c.req.query('type') ?? 'A'

  if (!domain) return c.json({ success: false, error: 'domain is required' }, 400)

  const cacheKey = `cache:dns:${domain}:${type}`
  try {
    const cached = await c.env.CACHE.get(cacheKey)
    if (cached) return c.json({ success: true, data: JSON.parse(cached), cached: true })
  } catch {}

  const res = await fetch(
    `https://1.1.1.1/dns-query?name=${encodeURIComponent(domain)}&type=${type}`,
    { headers: { Accept: 'application/dns-json' } }
  )

  if (!res.ok) return c.json({ success: false, error: 'DNS query failed' }, 502)

  const json = await res.json() as { Answer?: unknown[] }
  const data = { domain, type, records: json.Answer ?? [] }

  try {
    await c.env.CACHE.put(cacheKey, JSON.stringify(data), { expirationTtl: 300 })
  } catch {}

  return c.json({ success: true, data })
})
