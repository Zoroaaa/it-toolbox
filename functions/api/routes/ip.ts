import { Hono } from 'hono'
import type { Env } from '../[[route]]'
import type { IpInfo } from '@toolbox/types/api'

export const ipRoute = new Hono<{ Bindings: Env }>()

ipRoute.get('/', async (c) => {
  const cf = c.req.raw.cf as Record<string, unknown> | undefined

  // Try KV cache first
  const ip = c.req.header('CF-Connecting-IP') ?? 'unknown'
  const cacheKey = `cache:ip:${ip}`

  try {
    const cached = await c.env.CACHE.get(cacheKey)
    if (cached) {
      return c.json({ success: true, data: JSON.parse(cached) })
    }
  } catch {}

  const data: IpInfo = {
    ip,
    city:           String(cf?.city ?? 'Unknown'),
    country:        String(cf?.country ?? 'Unknown'),
    region:         String(cf?.region ?? 'Unknown'),
    timezone:       String(cf?.timezone ?? 'Unknown'),
    asn:            String(cf?.asn ?? 'Unknown'),
    asOrganization: String(cf?.asOrganization ?? 'Unknown'),
    latitude:       Number(cf?.latitude ?? 0),
    longitude:      Number(cf?.longitude ?? 0),
  }

  // Cache for 1 hour
  try {
    await c.env.CACHE.put(cacheKey, JSON.stringify(data), { expirationTtl: 3600 })
  } catch {}

  return c.json({ success: true, data })
})
