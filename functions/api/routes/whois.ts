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

/**
 * RDAP 取数策略：
 * 1. 用 IANA 引导文件解析出该 TLD 的权威 RDAP 服务，直连注册局
 * 2. 注册局不可用时回退公共聚合器（rdap.net / rdap.org）
 * rdap.org 会对 Cloudflare 出口 IP 直接返回 403，因此不能作为唯一数据源。
 */
const RDAP_TIMEOUT_MS = 8000
const RDAP_TOTAL_BUDGET_MS = 12000
const RDAP_BOOTSTRAP_URL = 'https://data.iana.org/rdap/dns.json'
const RDAP_BOOTSTRAP_CACHE_KEY = 'cache:rdap:bootstrap'
const RDAP_BOOTSTRAP_TTL = 86400
const RDAP_AGGREGATORS = [
  (domain: string) => `https://rdap.net/domain/${encodeURIComponent(domain)}`,
  (domain: string) => `https://rdap.org/domain/${encodeURIComponent(domain)}`,
]
const RDAP_HEADERS = {
  Accept: 'application/rdap+json, application/json;q=0.9',
  'User-Agent': 'it-toolbox/1.6 (+https://ittool.wort.uk)',
}

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

interface RdapBootstrap {
  services?: Array<[string[], string[]]>
}

type RdapOutcome =
  | { kind: 'ok'; data: RdapResponse }
  | { kind: 'notFound' }
  | { kind: 'error'; reason: string }

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

/** 单次 RDAP 请求：任何异常都收敛成结构化结果，绝不向上抛 */
async function requestRdap(url: string, timeoutMs: number = RDAP_TIMEOUT_MS): Promise<RdapOutcome> {
  try {
    const res = await fetch(url, {
      headers: RDAP_HEADERS,
      signal: AbortSignal.timeout(timeoutMs),
    })

    if (res.status === 404) return { kind: 'notFound' }
    if (res.status === 429) return { kind: 'error', reason: 'HTTP 429 上游限流' }
    if (!res.ok) return { kind: 'error', reason: `HTTP ${res.status}` }

    // 上游被 WAF 拦截时返回 HTML，先取文本再解析，避免 res.json() 直接抛错
    const text = await res.text()
    try {
      return { kind: 'ok', data: JSON.parse(text) as RdapResponse }
    } catch {
      return { kind: 'error', reason: `HTTP ${res.status} 返回非 JSON（疑似被上游拦截）` }
    }
  } catch (e) {
    const err = e as Error
    return { kind: 'error', reason: err.name === 'TimeoutError' ? '请求超时' : err.message }
  }
}

/** 读取 IANA RDAP 引导文件（KV 缓存 24h），失败返回 null 不影响主流程 */
async function loadBootstrap(env: Env): Promise<RdapBootstrap | null> {
  try {
    const cached = await env.CACHE.get(RDAP_BOOTSTRAP_CACHE_KEY)
    if (cached) return JSON.parse(cached) as RdapBootstrap
  } catch {
    /* 缓存不可用则回源 */
  }

  try {
    const res = await fetch(RDAP_BOOTSTRAP_URL, {
      headers: { Accept: 'application/json' },
      signal: AbortSignal.timeout(RDAP_TIMEOUT_MS),
    })
    if (!res.ok) return null
    const data = (await res.json()) as RdapBootstrap
    // 只缓存结构合法的引导文件，避免把异常响应写进 KV
    if (Array.isArray(data.services)) {
      try {
        await env.CACHE.put(RDAP_BOOTSTRAP_CACHE_KEY, JSON.stringify(data), {
          expirationTtl: RDAP_BOOTSTRAP_TTL,
        })
      } catch {
        /* 缓存写入失败不影响查询 */
      }
    }
    return data
  } catch {
    return null
  }
}

/** 按最长后缀匹配 TLD，返回权威 RDAP 基址 */
function pickRdapBase(bootstrap: RdapBootstrap | null, domain: string): string | null {
  const labels = domain.toLowerCase().split('.')
  for (let i = 1; i < labels.length; i++) {
    const suffix = labels.slice(i).join('.')
    const service = bootstrap?.services?.find(([tlds]) =>
      tlds.some((tld) => tld.toLowerCase() === suffix),
    )
    const urls = service?.[1]
    if (!urls?.length) continue
    const base = urls.find((u) => u.startsWith('https://')) ?? urls[0]
    return base.endsWith('/') ? base : `${base}/`
  }
  return null
}

function mapRdap(data: RdapResponse, domain: string): WhoisResult {
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

async function lookupDomain(
  domain: string,
  env: Env,
): Promise<WhoisResult | { error: string; status: number }> {
  const deadline = Date.now() + RDAP_TOTAL_BUDGET_MS
  const base = pickRdapBase(await loadBootstrap(env), domain)
  const candidates = [
    ...(base ? [`${base}domain/${encodeURIComponent(domain)}`] : []),
    ...RDAP_AGGREGATORS.map((build) => build(domain)),
  ]

  const reasons: string[] = []
  for (const url of candidates) {
    const remaining = deadline - Date.now()
    if (remaining < 1500) break
    const outcome = await requestRdap(url, Math.min(RDAP_TIMEOUT_MS, remaining))
    if (outcome.kind === 'notFound') {
      return {
        error: `未找到 ${domain} 的 RDAP 记录（域名可能未注册或不支持 RDAP）`,
        status: 404,
      }
    }
    if (outcome.kind === 'ok') return mapRdap(outcome.data, domain)
    reasons.push(`${new URL(url).host} ${outcome.reason}`)
  }

  return { error: `RDAP 查询失败（${reasons.join('；')}）`, status: 502 }
}

async function lookupIp(ip: string): Promise<WhoisResult | { error: string; status: number }> {
  const res = await fetch(
    `http://ip-api.com/json/${encodeURIComponent(ip)}?fields=status,message,country,regionName,city,timezone,as,org,isp,lat,lon,query`,
    { signal: AbortSignal.timeout(8000) },
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
    const result = isIp ? await lookupIp(target) : await lookupDomain(target, c.env)

    if ('error' in result) {
      return c.json({ error: result.error }, result.status as 400 | 404 | 502)
    }

    try {
      await c.env.CACHE.put(cacheKey, JSON.stringify(result), { expirationTtl: 3600 })
    } catch { /* 缓存不可用不影响查询 */ }

    return c.json(result)
  } catch (e) {
    // 兜底：任何未预期异常都返回 JSON，而不是让 Worker 抛出 502 错误页
    const message = (e as Error).name === 'TimeoutError' ? '查询超时，请稍后重试' : (e as Error).message
    return c.json({ error: message }, 502)
  }
})
