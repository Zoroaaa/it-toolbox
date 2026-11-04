import { Hono } from 'hono'
import type { Env } from '../[[route]]'

export const whoisRoute = new Hono<{ Bindings: Env }>()

interface WhoisResult {
  domain: string
  registrar?: string
  createdDate?: string
  updatedDate?: string
  expiryDate?: string
  status?: string[]
  nameservers?: string[]
  registrant?: {
    name?: string
    organization?: string
    country?: string
    email?: string
  }
  raw?: string
  error?: string
}

whoisRoute.get('/', async (c) => {
  const domain = c.req.query('domain')

  if (!domain) {
    return c.json({ error: 'domain is required' }, 400)
  }

  const cleanDomain = domain.trim().toLowerCase().replace(/^https?:\/\//, '').split('/')[0]

  const cacheKey = `cache:whois:${cleanDomain}`
  try {
    const cached = await c.env.CACHE.get(cacheKey)
    if (cached) {
      return c.json({ ...JSON.parse(cached), cached: true })
    }
  } catch { /* 缓存不可用不影响查询 */ }

  try {
    // 使用 ip-api.com 进行域名查询（免费，无API密钥，45次/分钟限制）
    const ipApiRes = await fetch(`http://ip-api.com/json/${encodeURIComponent(cleanDomain)}?fields=status,message,country,regionName,city,timezone,as,org,lat,lon,query,isp`)
    if (ipApiRes.ok) {
      const ipApiData = await ipApiRes.json() as Record<string, unknown>
      
      if (ipApiData.status !== 'success') {
        return c.json({ error: String(ipApiData.message ?? 'Lookup failed') }, 400)
      }
      
      const result: WhoisResult = {
        domain: cleanDomain,
        raw: JSON.stringify(ipApiData, null, 2),
        registrar: String(ipApiData.isp ?? 'Unknown'),
        registrant: {
          country: String(ipApiData.country ?? 'Unknown'),
          organization: String(ipApiData.org ?? 'Unknown')
        }
      }

      // 添加服务器信息作为nameservers
      if (ipApiData.query) {
        result.nameservers = [String(ipApiData.query)]
      }

      try {
        await c.env.CACHE.put(cacheKey, JSON.stringify(result), { expirationTtl: 3600 })
      } catch { /* 缓存不可用不影响查询 */ }

      return c.json(result)
    }
    
    return c.json({ error: 'WHOIS query failed', details: `HTTP ${ipApiRes.status}` }, 502)
  } catch (e) {
    return c.json({ error: (e as Error).message }, 500)
  }
})
