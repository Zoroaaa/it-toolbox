import { Hono } from 'hono'
import type { Env } from '../[[route]]'
import type { IpInfo } from '@toolbox/types/api'

export const ipRoute = new Hono<{ Bindings: Env }>()

ipRoute.get('/', async (c) => {
  const cf = c.req.raw.cf as IncomingRequestCfProperties | undefined

  // Support optional ?ip= param for querying arbitrary IPs
  const queryIp = c.req.query('ip')
  const callerIp = c.req.header('CF-Connecting-IP') ?? 'unknown'
  const ip = queryIp?.trim() || callerIp

  const cacheKey = `cache:ip:${ip}`

  try {
    const cached = await c.env.CACHE.get(cacheKey)
    if (cached) {
      return c.json({ success: true, data: JSON.parse(cached), cached: true })
    }
  } catch {}

  // For the caller's own IP, use Cloudflare's request metadata directly
  if (!queryIp || ip === callerIp) {
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
    try { await c.env.CACHE.put(cacheKey, JSON.stringify(data), { expirationTtl: 3600 }) } catch {}
    return c.json({ success: true, data })
  }

  // For arbitrary IPs, use ip-api.com (free, no key needed, 45 req/min)
  try {
    const res = await fetch(`http://ip-api.com/json/${encodeURIComponent(ip)}?fields=status,message,country,regionName,city,timezone,as,org,lat,lon,query`)
    if (!res.ok) return c.json({ success: false, error: 'IP lookup failed' }, 502)
    const json = await res.json() as Record<string, unknown>
    if (json.status !== 'success') {
      return c.json({ success: false, error: String(json.message ?? 'Lookup failed') }, 400)
    }
    const data: IpInfo = {
      ip: String(json.query ?? ip),
      city: String(json.city ?? 'Unknown'),
      country: String(json.country ?? 'Unknown'),
      region: String(json.regionName ?? 'Unknown'),
      timezone: String(json.timezone ?? 'Unknown'),
      asn: String(json.as ?? 'Unknown'),
      asOrganization: String(json.org ?? 'Unknown'),
      latitude: Number(json.lat ?? 0),
      longitude: Number(json.lon ?? 0),
    }
    try { await c.env.CACHE.put(cacheKey, JSON.stringify(data), { expirationTtl: 3600 }) } catch {}
    return c.json({ success: true, data })
  } catch (e) {
    return c.json({ success: false, error: (e as Error).message }, 500)
  }
})
