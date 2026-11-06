import { Result } from './common'

/**
 * HAR（HTTP Archive）分析。
 *
 * 只取分析需要的字段，避免把原始 entry 整个搬到主线程：
 * 一个 10MB 的 HAR 往往有数千个请求，原样回传会让结构化克隆本身成为新瓶颈。
 */

export interface HarEntrySummary {
  index: number
  method: string
  url: string
  host: string
  path: string
  status: number
  mimeType: string
  timeMs: number
  sizeBytes: number
  startedAt: string
}

export interface HarStatusGroups {
  '2xx': number
  '3xx': number
  '4xx': number
  '5xx': number
  failed: number
}

export interface HarDomainStat {
  host: string
  count: number
  sizeBytes: number
  timeMs: number
}

export interface HarMimeStat {
  mimeType: string
  count: number
  sizeBytes: number
}

export interface HarReport {
  entryCount: number
  totalSizeBytes: number
  totalTimeMs: number
  /** 首个请求开始到最后一个请求结束的墙钟跨度 */
  wallTimeMs: number
  statusGroups: HarStatusGroups
  domains: HarDomainStat[]
  mimeTypes: HarMimeStat[]
  methods: { method: string; count: number }[]
  slowest: HarEntrySummary[]
  largest: HarEntrySummary[]
  failures: HarEntrySummary[]
  entries: HarEntrySummary[]
  startedAt: string
}

type Json = Record<string, unknown>

const asObject = (value: unknown): Json | null =>
  value && typeof value === 'object' && !Array.isArray(value) ? (value as Json) : null

const num = (value: unknown, fallback = 0): number =>
  typeof value === 'number' && Number.isFinite(value) ? value : fallback

const str = (value: unknown, fallback = ''): string => (typeof value === 'string' ? value : fallback)

/** bodySize 为 -1 表示未知，统一按 0 计 */
const sizeOf = (response: Json | null): number => {
  if (!response) return 0
  const content = asObject(response.content)
  const fromContent = num(content?.size, -1)
  if (fromContent >= 0) return fromContent
  const bodySize = num(response.bodySize, -1)
  return bodySize >= 0 ? bodySize : 0
}

const timeOf = (entry: Json): number => {
  const time = num(entry.time, -1)
  if (time >= 0) return time
  const timings = asObject(entry.timings)
  if (!timings) return 0
  return ['blocked', 'dns', 'connect', 'ssl', 'send', 'wait', 'receive']
    .map((key) => num(timings[key], 0))
    .filter((value) => value > 0)
    .reduce((sum, value) => sum + value, 0)
}

const splitUrl = (url: string): { host: string; path: string } => {
  try {
    const parsed = new URL(url)
    return { host: parsed.host, path: `${parsed.pathname}${parsed.search}` }
  } catch {
    return { host: '', path: url }
  }
}

export function analyzeHar(text: string): Result<HarReport> {
  if (!text.trim()) return { ok: false, error: '请提供 HAR 内容' }

  let parsed: unknown
  try {
    parsed = JSON.parse(text)
  } catch {
    return { ok: false, error: '不是合法 JSON，请确认导出的是 HAR 文件' }
  }

  const log = asObject(asObject(parsed)?.log)
  const rawEntries = log?.entries
  if (!Array.isArray(rawEntries)) {
    return { ok: false, error: '不是有效的 HAR：缺少 log.entries' }
  }

  const entries: HarEntrySummary[] = []
  const domains = new Map<string, HarDomainStat>()
  const mimeTypes = new Map<string, HarMimeStat>()
  const methods = new Map<string, number>()
  const statusGroups: HarStatusGroups = { '2xx': 0, '3xx': 0, '4xx': 0, '5xx': 0, failed: 0 }

  let totalSizeBytes = 0
  let totalTimeMs = 0
  let earliest = Number.POSITIVE_INFINITY
  let latest = Number.NEGATIVE_INFINITY

  rawEntries.forEach((raw, index) => {
    const entry = asObject(raw)
    if (!entry) return

    const request = asObject(entry.request)
    const response = asObject(entry.response)
    const url = str(request?.url)
    const method = str(request?.method, 'GET').toUpperCase()
    const status = num(response?.status)
    const timeMs = timeOf(entry)
    const sizeBytes = sizeOf(response)
    const startedAt = str(entry.startedDateTime)
    const { host, path } = splitUrl(url)
    const mimeType = str(asObject(response?.content)?.mimeType).split(';')[0].trim() || 'unknown'

    const summary: HarEntrySummary = {
      index,
      method,
      url,
      host,
      path,
      status,
      mimeType,
      timeMs,
      sizeBytes,
      startedAt,
    }
    entries.push(summary)

    totalSizeBytes += sizeBytes
    totalTimeMs += timeMs

    if (status >= 200 && status < 300) statusGroups['2xx']++
    else if (status >= 300 && status < 400) statusGroups['3xx']++
    else if (status >= 400 && status < 500) statusGroups['4xx']++
    else if (status >= 500 && status < 600) statusGroups['5xx']++
    else statusGroups.failed++

    const domain = domains.get(host) ?? { host, count: 0, sizeBytes: 0, timeMs: 0 }
    domain.count++
    domain.sizeBytes += sizeBytes
    domain.timeMs += timeMs
    domains.set(host, domain)

    const mime = mimeTypes.get(mimeType) ?? { mimeType, count: 0, sizeBytes: 0 }
    mime.count++
    mime.sizeBytes += sizeBytes
    mimeTypes.set(mimeType, mime)

    methods.set(method, (methods.get(method) ?? 0) + 1)

    const startedMs = Date.parse(startedAt)
    if (Number.isFinite(startedMs)) {
      earliest = Math.min(earliest, startedMs)
      latest = Math.max(latest, startedMs + timeMs)
    }
  })

  if (!entries.length) return { ok: false, error: 'HAR 中没有可分析的请求' }

  const byTime = [...entries].sort((a, b) => b.timeMs - a.timeMs)
  const bySize = [...entries].sort((a, b) => b.sizeBytes - a.sizeBytes)
  const failures = entries.filter((entry) => entry.status === 0 || entry.status >= 400)

  return {
    ok: true,
    value: {
      entryCount: entries.length,
      totalSizeBytes,
      totalTimeMs,
      wallTimeMs: Number.isFinite(earliest) && Number.isFinite(latest) ? Math.max(0, latest - earliest) : 0,
      statusGroups,
      domains: [...domains.values()].sort((a, b) => b.sizeBytes - a.sizeBytes || b.count - a.count),
      mimeTypes: [...mimeTypes.values()].sort((a, b) => b.count - a.count || b.sizeBytes - a.sizeBytes),
      methods: [...methods.entries()]
        .map(([method, count]) => ({ method, count }))
        .sort((a, b) => b.count - a.count),
      slowest: byTime.slice(0, 10),
      largest: bySize.slice(0, 10),
      failures,
      entries,
      startedAt: str(log?.startedDateTime),
    },
  }
}

const CSV_HEADER = ['序号', '方法', '状态', '域名', '路径', '大小(B)', '耗时(ms)', '类型', 'URL']

const escapeCsv = (value: string | number): string => {
  const text = String(value)
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text
}

/** 导出为 CSV，交给调用方触发下载 */
export function harEntriesToCsv(entries: HarEntrySummary[]): string {
  const rows = entries.map((entry) => [
    entry.index,
    entry.method,
    entry.status,
    entry.host,
    entry.path,
    entry.sizeBytes,
    Math.round(entry.timeMs),
    entry.mimeType,
    entry.url,
  ])
  return [CSV_HEADER, ...rows].map((row) => row.map(escapeCsv).join(',')).join('\n')
}
