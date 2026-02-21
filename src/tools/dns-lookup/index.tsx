import { useState } from 'react'
import { Search, Loader2, Table } from 'lucide-react'
import { ToolLayout } from '@/components/tool/ToolLayout'
import { meta } from './meta'

interface DnsRecord {
  name: string
  type: number
  TTL: number
  data: string
}

interface DnsResponse {
  domain: string
  type: string
  records: DnsRecord[]
}

interface ApiResponse {
  success: boolean
  data?: DnsResponse
  error?: string
  cached?: boolean
}

const DNS_TYPES = ['A', 'AAAA', 'MX', 'TXT', 'CNAME', 'NS', 'SOA']

export default function DnsLookup() {
  const [domain, setDomain] = useState('')
  const [type, setType] = useState('A')
  const [result, setResult] = useState<DnsResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [isCached, setIsCached] = useState(false)

  const handleLookup = async () => {
    if (!domain.trim()) return
    setLoading(true)
    setError('')
    setResult(null)

    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 8000)
      const res = await fetch(`/api/dns?domain=${encodeURIComponent(domain)}&type=${type}`, { signal: controller.signal })
      clearTimeout(timeoutId)
      const json: ApiResponse = await res.json()
      if (json.success && json.data) {
        setResult(json.data)
        setIsCached(json.cached === true)
      } else {
        setError(json.error || '查询失败')
      }
    } catch (e) {
      const err = e as Error
      if (err.name === 'AbortError') setError('请求超时，请检查网络连接')
      else setError('网络请求失败：' + err.message)
    }
    setLoading(false)
  }

  const reset = () => {
    setDomain('')
    setResult(null)
    setError('')
  }

  return (
    <ToolLayout meta={meta} onReset={reset}>
      <div className="flex gap-2 mb-4 flex-wrap">
        <input
          type="text"
          value={domain}
          onChange={(e) => setDomain(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleLookup()}
          placeholder="输入域名，如 example.com"
          className="flex-1 min-w-[200px] px-4 py-2 bg-bg-raised border border-border-base rounded-lg text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent"
        />
        <select
          value={type}
          onChange={(e) => setType(e.target.value)}
          className="px-4 py-2 bg-bg-raised border border-border-base rounded-lg text-text-primary focus:outline-none focus:border-accent"
        >
          {DNS_TYPES.map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
        <button
          onClick={handleLookup}
          disabled={loading || !domain.trim()}
          className="btn-primary flex items-center gap-2"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
          查询
        </button>
      </div>

      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400">
          {error}
        </div>
      )}

      {result && (
        <div className="bg-bg-raised border border-border-base rounded-lg overflow-hidden">
          <div className="px-4 py-3 border-b border-border-base flex items-center gap-2">
            <Table className="w-4 h-4 text-text-muted" />
            <span className="text-sm text-text-secondary">
              {result.domain} - {result.type} 记录 ({result.records.length} 条)
            </span>
            {isCached && (
              <span className="ml-auto text-xs text-text-muted bg-bg-overlay px-2 py-0.5 rounded">缓存</span>
            )}
          </div>
          {result.records.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-bg-base text-text-muted text-left">
                  <tr>
                    <th className="px-4 py-2 font-medium">名称</th>
                    <th className="px-4 py-2 font-medium">类型</th>
                    <th className="px-4 py-2 font-medium">TTL</th>
                    <th className="px-4 py-2 font-medium">数据</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-base">
                  {result.records.map((record, i) => (
                    <tr key={i} className="text-text-primary">
                      <td className="px-4 py-2 font-mono text-xs">{record.name}</td>
                      <td className="px-4 py-2">{record.type}</td>
                      <td className="px-4 py-2">{record.TTL}</td>
                      <td className="px-4 py-2 font-mono text-xs break-all">{record.data}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-8 text-center text-text-muted">
              暂无记录
            </div>
          )}
        </div>
      )}
    </ToolLayout>
  )
}
