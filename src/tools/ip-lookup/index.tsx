import { useState, useEffect } from 'react'
import { MapPin, Globe, Clock, Building2, Loader2, Search } from 'lucide-react'
import { ToolLayout } from '@/components/tool/ToolLayout'
import { meta } from './meta'
import type { IpInfo } from '@toolbox/types/api'

interface IpApiResponse {
  success: boolean
  data?: IpInfo
  error?: string
  cached?: boolean
}

export default function IpLookup() {
  const [inputIp, setInputIp] = useState('')
  const [ipInfo, setIpInfo] = useState<IpInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [isCached, setIsCached] = useState(false)

  useEffect(() => {
    fetchIpInfo()
  }, [])

  const fetchIpInfo = async (ip?: string) => {
    setLoading(true)
    setError('')
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 8000)
      const url = ip ? `/api/ip?ip=${encodeURIComponent(ip)}` : '/api/ip'
      const res = await fetch(url, { signal: controller.signal })
      clearTimeout(timeoutId)
      const json: IpApiResponse = await res.json()
      if (json.success && json.data) {
        setIpInfo(json.data)
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

  const handleSearch = () => {
    fetchIpInfo(inputIp.trim() || undefined)
  }

  const reset = () => {
    setInputIp('')
    setIpInfo(null)
    setError('')
    fetchIpInfo()
  }

  return (
    <ToolLayout meta={meta} onReset={reset}>
      <div className="space-y-4">
        <div className="flex gap-2">
          <input
            type="text"
            value={inputIp}
            onChange={(e) => setInputIp(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            placeholder="输入 IP 地址查询（留空查询本机 IP）"
            className="flex-1 px-4 py-2 bg-bg-raised border border-border-base rounded-lg text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent"
          />
          <button
            onClick={handleSearch}
            disabled={loading}
            className="btn-primary flex items-center gap-2"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
            查询
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-48">
            <Loader2 className="w-8 h-8 animate-spin text-accent" />
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center h-48 gap-3">
            <p className="text-red-400">{error}</p>
            <button onClick={() => fetchIpInfo(inputIp.trim() || undefined)} className="btn-primary">
              重试
            </button>
          </div>
        ) : ipInfo ? (
          <>
            {isCached && (
              <p className="text-xs text-text-muted text-right">来自缓存</p>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <InfoCard icon={<Globe className="w-5 h-5" />} label="IP 地址" value={ipInfo.ip} />
              <InfoCard icon={<MapPin className="w-5 h-5" />} label="城市" value={ipInfo.city} />
              <InfoCard icon={<MapPin className="w-5 h-5" />} label="国家" value={ipInfo.country} />
              <InfoCard icon={<MapPin className="w-5 h-5" />} label="地区" value={ipInfo.region} />
              <InfoCard icon={<Clock className="w-5 h-5" />} label="时区" value={ipInfo.timezone} />
              <InfoCard icon={<Building2 className="w-5 h-5" />} label="ASN" value={ipInfo.asn} />
              <InfoCard icon={<Building2 className="w-5 h-5" />} label="组织" value={ipInfo.asOrganization} />
              <InfoCard icon={<MapPin className="w-5 h-5" />} label="纬度" value={String(ipInfo.latitude)} />
              <InfoCard icon={<MapPin className="w-5 h-5" />} label="经度" value={String(ipInfo.longitude)} />
            </div>
          </>
        ) : null}
      </div>
    </ToolLayout>
  )
}

function InfoCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="bg-bg-raised border border-border-base rounded-lg p-4">
      <div className="flex items-center gap-2 text-text-muted mb-2">
        {icon}
        <span className="text-xs uppercase tracking-wider">{label}</span>
      </div>
      <p className="text-text-primary font-mono text-sm break-all">{value || '-'}</p>
    </div>
  )
}
