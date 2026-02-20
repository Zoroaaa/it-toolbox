import { useState, useCallback } from 'react'
import { AlertCircle, Clock, CheckCircle, XCircle } from 'lucide-react'
import { ToolLayout } from '@/components/tool/ToolLayout'
import { parseJwt, type JwtPayload } from '@core/index'
import { useAppStore } from '@/store/app'
import { meta } from './meta'

export default function JwtDecoder() {
  const [input, setInput] = useState('')
  const [result, setResult] = useState<JwtPayload | null>(null)
  const [error, setError] = useState('')
  const { addHistory, addRecentTool } = useAppStore()

  const runParse = useCallback(() => {
    if (!input.trim()) return
    addRecentTool(meta.id)

    const parseResult = parseJwt(input)
    if (parseResult.ok) {
      setResult(parseResult.value)
      setError('')
      addHistory(meta.id, input)
    } else {
      setError(parseResult.error)
      setResult(null)
    }
  }, [input, addHistory, addRecentTool])

  const reset = () => {
    setInput('')
    setResult(null)
    setError('')
  }

  const outputValue = result ? JSON.stringify(result, null, 2) : ''

  return (
    <ToolLayout meta={meta} onReset={reset} outputValue={outputValue}>
      <div className="flex items-center gap-2 mb-4">
        <button onClick={runParse} className="btn-primary">
          解析 JWT
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 h-[calc(100vh-16rem)]">
        <div className="flex flex-col gap-2">
          <label className="text-xs font-medium text-text-muted uppercase tracking-wider">JWT Token</label>
          <textarea
            className="tool-input flex-1 font-mono text-xs leading-relaxed"
            value={input}
            onChange={e => { setInput(e.target.value); setError(''); setResult(null) }}
            placeholder="粘贴 JWT Token..."
            spellCheck={false}
          />
          <div className="text-xs text-text-muted">{input.length} 字符</div>
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-xs font-medium text-text-muted uppercase tracking-wider">解析结果</label>
          {error ? (
            <div className="flex-1 rounded-lg bg-rose-500/10 border border-rose-500/30 p-4 flex items-start gap-3">
              <AlertCircle className="w-4 h-4 text-rose-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-rose-500 mb-1">解析错误</p>
                <p className="text-xs text-rose-400/80">{error}</p>
              </div>
            </div>
          ) : result ? (
            <div className="flex-1 overflow-y-auto space-y-4">
              {result.isExpired && (
                <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-rose-500/10 border border-rose-500/30">
                  <XCircle className="w-4 h-4 text-rose-500" />
                  <span className="text-sm text-rose-500">此 Token 已过期</span>
                </div>
              )}
              {!result.isExpired && result.expiresAt && (
                <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-accent/10 border border-accent/20">
                  <CheckCircle className="w-4 h-4 text-accent" />
                  <span className="text-sm text-accent">Token 有效</span>
                </div>
              )}

              <div>
                <h3 className="text-xs font-medium text-text-muted uppercase tracking-wider mb-2">Header</h3>
                <pre className="tool-input p-3 text-xs font-mono">{JSON.stringify(result.header, null, 2)}</pre>
              </div>

              <div>
                <h3 className="text-xs font-medium text-text-muted uppercase tracking-wider mb-2">Payload</h3>
                <pre className="tool-input p-3 text-xs font-mono">{JSON.stringify(result.payload, null, 2)}</pre>
              </div>

              {(result.expiresAt || result.issuedAt) && (
                <div className="grid grid-cols-2 gap-3">
                  {result.issuedAt && (
                    <div className="p-3 rounded-lg bg-bg-raised border border-border-base">
                      <div className="flex items-center gap-2 text-xs text-text-muted mb-1">
                        <Clock className="w-3 h-3" />
                        签发时间
                      </div>
                      <p className="text-sm text-text-primary">{result.issuedAt.toLocaleString()}</p>
                    </div>
                  )}
                  {result.expiresAt && (
                    <div className="p-3 rounded-lg bg-bg-raised border border-border-base">
                      <div className="flex items-center gap-2 text-xs text-text-muted mb-1">
                        <Clock className="w-3 h-3" />
                        过期时间
                      </div>
                      <p className="text-sm text-text-primary">{result.expiresAt.toLocaleString()}</p>
                    </div>
                  )}
                </div>
              )}

              <div>
                <h3 className="text-xs font-medium text-text-muted uppercase tracking-wider mb-2">Signature</h3>
                <pre className="tool-input p-3 text-xs font-mono break-all">{result.signature}</pre>
              </div>
            </div>
          ) : (
            <div className="flex-1 rounded-lg bg-bg-raised border border-border-base flex items-center justify-center">
              <p className="text-text-muted text-sm">输入 JWT Token 后点击解析</p>
            </div>
          )}
        </div>
      </div>
    </ToolLayout>
  )
}
