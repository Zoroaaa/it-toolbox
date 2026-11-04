import { useState, useCallback } from 'react'
import { ShieldCheck, Search, AlertCircle, CheckCircle, XCircle, AlertTriangle, Loader2, Info } from 'lucide-react'
import { ToolLayout } from '@/components/tool/ToolLayout'
import { useAppStore } from '@/store/app'
import { meta } from './meta'

interface HeaderCheck {
  name: string
  present: boolean
  value?: string
  recommendation: string
  severity: 'high' | 'medium' | 'low'
  pass: boolean
  scoreModifier: number
  result: string
}

interface HeadersResult {
  url: string
  headers: HeaderCheck[]
  score: number
  grade: string
  warnings: string[]
  source: string
  testsFailed: number
  testsPassed: number
  testsQuantity: number
}

export default function HeadersCheck() {
  const [url, setUrl] = useState('')
  const [result, setResult] = useState<HeadersResult | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const addRecentTool = useAppStore((s) => s.addRecentTool)

  const check = useCallback(async () => {
    if (!url.trim()) return

    addRecentTool(meta.id)
    setIsLoading(true)
    setError('')
    setResult(null)

    try {
      const raw = url.trim()
      const parsed = new URL(/^https?:\/\//i.test(raw) ? raw : `https://${raw}`)
      parsed.protocol = parsed.protocol.toLowerCase()
      parsed.hostname = parsed.hostname.toLowerCase()
      const cleanUrl = parsed.toString()

      const response = await fetch(`/api/headers-check?url=${encodeURIComponent(cleanUrl)}`)
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
  }, [url, addRecentTool])

  const reset = () => {
    setUrl('')
    setResult(null)
    setError('')
  }

  const getGradeColor = (grade: string) => {
    if (grade === 'A' || grade === 'A+') return 'text-green-500 bg-green-500/10'
    if (grade === 'B' || grade === 'B-') return 'text-blue-500 bg-blue-500/10'
    if (grade === 'C' || grade === 'C-') return 'text-yellow-500 bg-yellow-500/10'
    if (grade === 'D' || grade === 'D-') return 'text-orange-500 bg-orange-500/10'
    return 'text-rose-500 bg-rose-500/10'
  }

  const getResultIcon = (header: HeaderCheck) => {
    if (header.pass) {
      return <CheckCircle className="w-4 h-4 text-green-500" />
    }
    if (header.severity === 'high') {
      return <XCircle className="w-4 h-4 text-rose-500" />
    }
    if (header.severity === 'medium') {
      return <AlertTriangle className="w-4 h-4 text-orange-500" />
    }
    return <AlertCircle className="w-4 h-4 text-yellow-500" />
  }

  return (
    <ToolLayout meta={meta} onReset={reset}>
      <div className="flex items-center gap-2 mb-4">
        <div className="relative flex-1">
          <ShieldCheck className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
          <input
            type="text"
            value={url}
            onChange={e => setUrl(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && check()}
            placeholder="输入URL，如 https://example.com"
            className="w-full pl-10 pr-4 py-3 rounded-xl bg-bg-surface border border-border-base text-text-primary focus:outline-none focus:border-accent"
          />
        </div>
        <button onClick={check} disabled={isLoading || !url.trim()} className="btn-primary">
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
          <div className="flex items-center justify-between p-4 rounded-xl bg-bg-surface border border-border-base">
            <div>
              <span className="text-xs text-text-muted">检测目标</span>
              <p className="text-sm font-mono text-text-primary">{result.url}</p>
              <p className="text-xs text-text-muted mt-1">
                来源: {result.source}
                {result.testsQuantity > 0 && (
                  <span className="ml-2">
                    | 测试: {result.testsPassed}/{result.testsQuantity} 通过
                  </span>
                )}
              </p>
            </div>
            <div className={`px-4 py-2 rounded-xl ${getGradeColor(result.grade)}`}>
              <div className="text-2xl font-bold">{result.grade}</div>
              <div className="text-xs">{result.score}/100</div>
            </div>
          </div>

          {result.warnings && result.warnings.length > 0 && (
            <div className="p-4 rounded-xl bg-yellow-500/10 border border-yellow-500/20">
              <div className="flex items-center gap-2 mb-2">
                <Info className="w-4 h-4 text-yellow-500" />
                <span className="text-sm font-medium text-yellow-400">安全建议</span>
              </div>
              <ul className="space-y-1">
                {result.warnings.map((warning, i) => (
                  <li key={i} className="text-xs text-yellow-300/80 flex items-start gap-2">
                    <span className="text-yellow-500 mt-0.5">•</span>
                    <span>{warning}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="space-y-2">
            {result.headers.map((header, i) => (
              <div
                key={i}
                className={`p-4 rounded-xl border ${
                  header.pass
                    ? 'bg-green-500/5 border-green-500/20'
                    : header.severity === 'high'
                    ? 'bg-rose-500/5 border-rose-500/20'
                    : 'bg-bg-surface border-border-base'
                }`}
              >
                <div className="flex items-start gap-3">
                  {getResultIcon(header)}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-mono font-medium text-text-primary">
                        {header.name}
                      </span>
                      <span className={`text-xs px-1.5 py-0.5 rounded ${
                        header.severity === 'high' ? 'bg-rose-500/10 text-rose-400' :
                        header.severity === 'medium' ? 'bg-orange-500/10 text-orange-400' :
                        'bg-yellow-500/10 text-yellow-400'
                      }`}>
                        {header.severity === 'high' ? '重要' : header.severity === 'medium' ? '中等' : '建议'}
                      </span>
                      {header.scoreModifier !== 0 && (
                        <span className={`text-xs ${header.scoreModifier > 0 ? 'text-green-400' : 'text-rose-400'}`}>
                          {header.scoreModifier > 0 ? '+' : ''}{header.scoreModifier}分
                        </span>
                      )}
                    </div>
                    {header.present && header.value && (
                      <p className="text-xs font-mono text-text-secondary mb-2 break-all">
                        {header.value.substring(0, 100)}{header.value.length > 100 ? '...' : ''}
                      </p>
                    )}
                    <p className="text-xs text-text-muted">{header.recommendation}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="p-3 rounded-xl bg-bg-surface border border-border-base flex items-center justify-between">
            <span className="text-xs text-text-muted">
              数据来源: {result.source}
            </span>
          </div>
        </div>
      )}

      {!result && !error && !isLoading && (
        <div className="h-48 rounded-xl bg-bg-raised border border-border-base flex items-center justify-center">
          <p className="text-text-muted text-sm">输入URL检测HTTP安全头</p>
        </div>
      )}
    </ToolLayout>
  )
}
