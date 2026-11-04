import { Hono } from 'hono'
import type { Env } from '../../types'

export const whoisRoute = new Hono<{ Bindings: Env }>()

interface WhoisResult {
  mode: 'domain' | 'ip'
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
  // IP 模式
  ip?: string
  country?: string
  region?: string
  city?: string
  isp?: string
  asn?: string
  raw?: string
  source: 'RDAP' | 'ip-api'
  error?: string
}

const IPV4_RE = /^(\d{1,3}\.){3}\d{1,3}$/
const IPV6_RE = /^[0-9a-fA-F:]+$/
const DOMAIN_RE = /^(?=.{1,253}$)(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$/i

interface RdapEntity {
  roles?: string[]
  vcardArray?: [string, Array<[string, unknown, string, unknown]>]
  entities?: RdapEntity[]
}

interface RdapResponse {
  ldhName?: string
  unicodeName?: string
  status?: string[]
  events?: Array<{ eventAction?: string; eventDate?: string }>
  nameservers?: Array<{ ldhName?: string }>
  entities?: RdapEntity[]
}

function vcardValue(entity: RdapEntity, key: string): string | undefined {
  const vcard = entity.vcardArray?.[1]
  if (!Array.isArray(vcard)) return undefined
  const entry = vcard.find((item) => item[0] === key)
  const value = entry?.[3]
  if (typeof value === 'string') return value
  if (Array.isArray(value)) {
    const parts = value.filter((v): v is string => typeof v === 'string').filter(Boolean)
    return parts.length ? parts.join(', ') : undefined
  }
  return undefined
}

function findEntity(entities: RdapEntity[] | undefined, role: string): RdapEntity | undefined {
  for (const entity of entities ?? []) {
    if (entity.roles?.includes(role)) return entity
    const nested = findEntity(entity.entities, role)
    if (nested) return nested
  }
  return undefined
}

function eventDate(events: RdapResponse['events'], action: string): string | undefined {
  const date = events?.find((e) => e.eventAction === action)?.eventDate
  return date ? new Date(date).toISOString().slice(0, 10) : undefined
}

async function lookupDomain(domain: string): Promise<WhoisResult | { error: string; status: number }> {
  const res = await fetch(`https://rdap.org/domain/${encodeURIComponent(domain)}`, {
    headers: { Accept: 'application/rdap+json' },
    signal: AbortSignal.timeout(15000),
  })

  if (res.status === 404) {
    return { error: `未找到 ${domain} 的 RDAP 记录（域名可能未注册或不支持 RDAP）`, status: 404 }
  }
  if (!res.ok) {
    return { error: `RDAP 查询失败（HTTP ${res.status}）`, status: 502 }
  }

  const data = (await res.json()) as RdapResponse
  const registrar = findEntity(data.entities, 'registrar')
  const registrant = findEntity(data.entities, 'registrant')

  return {
    mode: 'domain',
    domain: data.unicodeName ?? data.ldhName ?? domain,
    registrar: registrar ? vcardValue(registrar, 'fn') ?? vcardValue(registrar, 'org') : undefined,
    createdDate: eventDate(data.events, 'registration'),
    updatedDate: eventDate(data.events, 'last changed'),
    expiryDate: eventDate(data.events, 'expiration'),
    status: data.status,
    nameservers: data.nameservers?.map((ns) => ns.ldhName).filter((ns): ns is string => Boolean(ns)),
    registrant: registrant
      ? {
          name: vcardValue(registrant, 'fn'),
          organization: vcardValue(registrant, 'org'),
          country: vcardValue(registrant, 'adr'),
          email: vcardValue(registrant, 'email'),
        }
      : undefined,
    raw: JSON.stringify(data, null, 2),
    source: 'RDAP',
  }
}

async function lookupIp(ip: string): Promise<WhoisResult | { error: string; status: number }> {
  const res = await fetch(
    `http://ip-api.com/json/${encodeURIComponent(ip)}?fields=status,message,country,regionName,city,timezone,as,org,isp,lat,lon,query`,
    { signal: AbortSignal.timeout(10000) },
  )
  if (!res.ok) return { error: `IP 归属地查询失败（HTTP ${res.status}）`, status: 502 }

  const json = (await res.json()) as Record<string, unknown>
  if (json.status !== 'success') {
    return { error: String(json.message ?? 'IP 归属地查询失败'), status: 400 }
  }

  return {
    mode: 'ip',
    domain: ip,
    ip: String(json.query ?? ip),
    country: String(json.country ?? '未知'),
    region: String(json.regionName ?? '未知'),
    city: String(json.city ?? '未知'),
    isp: String(json.isp ?? '未知'),
    asn: String(json.as ?? '未知'),
    raw: JSON.stringify(json, null, 2),
    source: 'ip-api',
  }
}

whoisRoute.get('/', async (c) => {
  const query = c.req.query('domain') ?? c.req.query('q')

  if (!query?.trim()) {
    return c.json({ error: 'domain 或 IP 不能为空' }, 400)
  }

  const target = query
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, '')
    .split('/')[0]
    .replace(/:\d+$/, '')

  const isIp = IPV4_RE.test(target) || (target.includes(':') && IPV6_RE.test(target))
  if (!isIp && !DOMAIN_RE.test(target)) {
    return c.json({ error: '请输入合法的域名或 IP 地址' }, 400)
  }

  const cacheKey = `cache:whois:${target}`
  try {
    const cached = await c.env.CACHE.get(cacheKey)
    if (cached) return c.json({ ...JSON.parse(cached), cached: true })
  } catch { /* 缓存不可用不影响查询 */ }

  try {
    const result = isIp ? await lookupIp(target) : await lookupDomain(target)

    if ('error' in result) {
      return c.json({ error: result.error }, result.status as 400 | 404 | 502)
    }

    try {
      await c.env.CACHE.put(cacheKey, JSON.stringify(result), { expirationTtl: 3600 })
    } catch { /* 缓存不可用不影响查询 */ }

    return c.json(result)
  } catch (e) {
    const message = (e as Error).name === 'TimeoutError' ? '查询超时，请稍后重试' : (e as Error).message
    return c.json({ error: message }, 502)
  }
})
