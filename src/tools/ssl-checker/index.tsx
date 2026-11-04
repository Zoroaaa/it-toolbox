import { useState, useCallback } from 'react'
import { Shield, Search, AlertCircle, CheckCircle, XCircle, Clock, Building, Loader2 } from 'lucide-react'
import { ToolLayout } from '@/components/tool/ToolLayout'
import { useAppStore } from '@/store/app'
import { meta } from './meta'

interface SslResult {
  domain: string
  valid: boolean
  issuer: string
  subject: string
  validFrom: string
  validTo: string
  daysRemaining: number
  serialNumber: string
  signatureAlgorithm: string
  sans: string[]
  error?: string
  source?: string
}

export default function SslChecker() {
  const [domain, setDomain] = useState('')
  const [result, setResult] = useState<SslResult | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const addRecentTool = useAppStore((s) => s.addRecentTool)

  const check = useCallback(async () => {
    if (!domain.trim()) return

    addRecentTool(meta.id)
    setIsLoading(true)
    setError('')
    setResult(null)

    try {
      const cleanDomain = domain.trim().toLowerCase().replace(/^https?:\/\//, '').split('/')[0]
      
      const response = await fetch(`/api/ssl-check?domain=${encodeURIComponent(cleanDomain)}`)
      const data = await response.json()
      
      if (data.error) {
        setError(data.error)
      } else {
        setResult(data)
      }
    } catch {
      setError('检测失败，请检查网络连接或稍后重试')
    }

    setIsLoading(false)
  }, [domain, addRecentTool])

  const reset = () => {
    setDomain('')
    setResult(null)
    setError('')
  }

  const getStatusColor = (days: number) => {
    if (days < 0) return 'text-rose-500'
    if (days < 7) return 'text-orange-500'
    if (days < 30) return 'text-yellow-500'
    return 'text-green-500'
  }

  return (
    <ToolLayout meta={meta} onReset={reset}>
      <div className="flex items-center gap-2 mb-4">
        <div className="relative flex-1">
          <Shield className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
          <input
            type="text"
            value={domain}
            onChange={e => setDomain(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && check()}
            placeholder="输入域名，如 example.com"
            className="w-full pl-10 pr-4 py-3 rounded-xl bg-bg-surface border border-border-base text-text-primary focus:outline-none focus:border-accent"
          />
        </div>
        <button onClick={check} disabled={isLoading || !domain.trim()} className="btn-primary">
          {isLoading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Search className="w-4 h-4" />
          )}
          检测
        </button>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center gap-2 mb-4">
          <AlertCircle className="w-4 h-4 text-rose-500" />
          <span className="text-sm text-rose-400">{error}</span>
        </div>
      )}

      {result && !error && (
        <div className="space-y-4">
          <div className={`p-4 rounded-xl border ${
            result.valid
              ? 'bg-green-500/10 border-green-500/20'
              : 'bg-rose-500/10 border-rose-500/20'
          }`}>
            <div className="flex items-center gap-2">
              {result.valid ? (
                <CheckCircle className="w-5 h-5 text-green-500" />
              ) : (
                <XCircle className="w-5 h-5 text-rose-500" />
              )}
              <span className={`text-lg font-bold ${result.valid ? 'text-green-500' : 'text-rose-500'}`}>
                {result.valid ? 'SSL证书有效' : 'SSL证书无效'}
              </span>
            </div>
            <p className="text-sm text-text-secondary mt-1">{result.domain}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-bg-surface border border-border-base">
              <div className="flex items-center gap-2 mb-2">
                <Building className="w-4 h-4 text-text-muted" />
                <span className="text-xs text-text-muted uppercase">颁发机构</span>
              </div>
              <p className="text-sm text-text-primary">{result.issuer}</p>
            </div>

            <div className="p-4 rounded-xl bg-bg-surface border border-border-base">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="w-4 h-4 text-text-muted" />
                <span className="text-xs text-text-muted uppercase">剩余天数</span>
              </div>
              <p className={`text-sm font-bold ${getStatusColor(result.daysRemaining)}`}>
                {result.daysRemaining < 0 
                  ? `已过期 ${Math.abs(result.daysRemaining)} 天` 
                  : `${result.daysRemaining} 天`}
              </p>
            </div>

            <div className="p-4 rounded-xl bg-bg-surface border border-border-base">
              <span className="text-xs text-text-muted uppercase block mb-1">生效日期</span>
              <p className="text-sm font-mono text-text-primary">{result.validFrom}</p>
            </div>

            <div className="p-4 rounded-xl bg-bg-surface border border-border-base">
              <span className="text-xs text-text-muted uppercase block mb-1">过期日期</span>
              <p className="text-sm font-mono text-text-primary">{result.validTo}</p>
            </div>

            <div className="p-4 rounded-xl bg-bg-surface border border-border-base">
              <span className="text-xs text-text-muted uppercase block mb-1">签名算法</span>
              <p className="text-sm font-mono text-text-primary">{result.signatureAlgorithm}</p>
            </div>

            <div className="p-4 rounded-xl bg-bg-surface border border-border-base">
              <span className="text-xs text-text-muted uppercase block mb-1">序列号</span>
              <p className="text-xs font-mono text-text-secondary break-all">{result.serialNumber}</p>
            </div>
          </div>

          {result.sans && result.sans.length > 0 && (
            <div className="p-4 rounded-xl bg-bg-surface border border-border-base">
              <h3 className="text-xs text-text-muted uppercase mb-2">主题备用名称 (SANs)</h3>
              <div className="flex flex-wrap gap-2">
                {result.sans.map((san, i) => (
                  <span key={i} className="px-2 py-1 rounded bg-bg-raised text-xs font-mono text-text-primary">
                    {san}
                  </span>
                ))}
              </div>
            </div>
          )}

          {result.source && (
            <div className="p-3 rounded-xl bg-bg-surface border border-border-base">
              <p className="text-xs text-text-muted">
                数据来源: <span className="text-text-secondary">{result.source}</span>
              </p>
            </div>
          )}
        </div>
      )}

      {!result && !error && !isLoading && (
        <div className="h-48 rounded-xl bg-bg-raised border border-border-base flex items-center justify-center">
          <p className="text-text-muted text-sm">输入域名检测SSL证书</p>
        </div>
      )}
    </ToolLayout>
  )
}
