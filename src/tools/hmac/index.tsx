import { useState, useCallback } from 'react'
import { Shield, Copy, Check } from 'lucide-react'
import { ToolLayout } from '@/components/tool/ToolLayout'
import { hmacSha256, hmacSha512 } from '@core/index'
import { useAppStore } from '@/store/app'
import { useClipboard } from '@/hooks/useClipboard'
import { meta } from './meta'

type Algorithm = 'SHA-256' | 'SHA-512'

export default function HmacTool() {
  const [message, setMessage] = useState('')
  const [secret, setSecret] = useState('')
  const [result, setResult] = useState('')
  const [error, setError] = useState('')
  const [algorithm, setAlgorithm] = useState<Algorithm>('SHA-256')
  const [isProcessing, setIsProcessing] = useState(false)
  const { addHistory, addRecentTool } = useAppStore()
  const { copy, copied } = useClipboard()

  const runCalculate = useCallback(async () => {
    if (!message.trim() || !secret) return
    addRecentTool(meta.id)
    setIsProcessing(true)

    const result = algorithm === 'SHA-256' 
      ? await hmacSha256(message, secret) 
      : await hmacSha512(message, secret)

    if (result.ok) {
      setResult(result.value)
      setError('')
      addHistory(meta.id, message)
    } else {
      setError(result.error)
      setResult('')
    }
    setIsProcessing(false)
  }, [message, secret, algorithm, addHistory, addRecentTool])

  const reset = () => {
    setMessage('')
    setSecret('')
    setResult('')
    setError('')
  }

  return (
    <ToolLayout meta={meta} onReset={reset} outputValue={result}>
      <div className="flex items-center gap-2 mb-4 flex-wrap">
        <button onClick={runCalculate} disabled={isProcessing || !secret} className="btn-primary">
          <Shield className="w-4 h-4" />
          {isProcessing ? '计算中...' : '计算 HMAC'}
        </button>

        <div className="flex items-center gap-1 bg-bg-raised rounded-lg p-1">
          {(['SHA-256', 'SHA-512'] as Algorithm[]).map(algo => (
            <button
              key={algo}
              onClick={() => { setAlgorithm(algo); setResult('') }}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors
                ${algorithm === algo ? 'bg-accent text-bg-base' : 'text-text-muted hover:text-text-primary'}`}
            >
              {algo}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 h-[calc(100vh-16rem)]">
        <div className="flex flex-col gap-2">
          <label className="text-xs font-medium text-text-muted uppercase tracking-wider">消息</label>
          <textarea
            className="tool-input flex-1 font-mono text-xs leading-relaxed min-h-[100px]"
            value={message}
            onChange={e => { setMessage(e.target.value); setError('') }}
            placeholder="输入要计算 HMAC 的消息..."
            spellCheck={false}
          />
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-xs font-medium text-text-muted uppercase tracking-wider">密钥</label>
          <input
            type="password"
            value={secret}
            onChange={e => setSecret(e.target.value)}
            placeholder="输入密钥..."
            className="px-3 py-2 rounded-lg bg-bg-raised border border-border-base text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent"
          />
        </div>

        <div className="flex flex-col gap-2 flex-1">
          <div className="flex items-center justify-between">
            <label className="text-xs font-medium text-text-muted uppercase tracking-wider">HMAC 结果</label>
            {result && (
              <button onClick={() => copy(result)} className="btn-ghost text-xs">
                {copied ? <Check className="w-3.5 h-3.5 text-accent" /> : <Copy className="w-3.5 h-3.5" />}
                复制
              </button>
            )}
          </div>
          {error ? (
            <div className="flex-1 rounded-lg bg-rose-500/10 border border-rose-500/30 p-4">
              <p className="text-xs text-rose-400/80">{error}</p>
            </div>
          ) : (
            <div className="flex-1 rounded-lg bg-bg-surface border border-border-base p-3">
              <p className="font-mono text-xs text-text-primary break-all">{result || '结果将在这里显示...'}</p>
            </div>
          )}
        </div>
      </div>
    </ToolLayout>
  )
}
