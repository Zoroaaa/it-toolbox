import { useState, useCallback, useEffect } from 'react'
import { ArrowRightLeft, RefreshCw } from 'lucide-react'
import { ToolLayout } from '@/components/tool/ToolLayout'
import { parseTimestamp, nowTimestamp, type TimestampResult } from '@core/index'
import { useAppStore } from '@/store/app'
import { meta } from './meta'

export default function TimestampConverter() {
  const [input, setInput] = useState('')
  const [result, setResult] = useState<TimestampResult | null>(null)
  const [error, setError] = useState('')
  const [unit, setUnit] = useState<'s' | 'ms'>('s')
  const { addHistory, addRecentTool } = useAppStore()

  const convert = useCallback(() => {
    if (!input.trim()) return
    addRecentTool(meta.id)

    const parseResult = parseTimestamp(input)
    if (parseResult.ok) {
      setResult(parseResult.value)
      setError('')
      addHistory(meta.id, input)
    } else {
      setError(parseResult.error)
      setResult(null)
    }
  }, [input, addHistory, addRecentTool])

  const setNow = () => {
    const now = nowTimestamp()
    setInput(unit === 's' ? now.unix.toString() : now.unixMs.toString())
    setResult(now)
    setError('')
    addRecentTool(meta.id)
  }

  const reset = () => {
    setInput('')
    setResult(null)
    setError('')
  }

  useEffect(() => {
    const interval = setInterval(() => {
      if (!input && !result) {
        const now = nowTimestamp()
        setResult(now)
      }
    }, 1000)
    return () => clearInterval(interval)
  }, [input, result])

  const outputValue = result ? `Unix: ${result.unix}\nISO: ${result.iso}\nUTC: ${result.utc}\nLocal: ${result.local}` : ''

  return (
    <ToolLayout meta={meta} onReset={reset} outputValue={outputValue}>
      <div className="flex items-center gap-2 mb-4 flex-wrap">
        <button onClick={convert} className="btn-primary">
          <ArrowRightLeft className="w-4 h-4" />
          转换
        </button>

        <button onClick={setNow} className="btn-ghost">
          <RefreshCw className="w-4 h-4" />
          当前时间
        </button>

        <div className="flex items-center gap-1 bg-bg-raised rounded-lg p-1">
          {(['s', 'ms'] as const).map(u => (
            <button
              key={u}
              onClick={() => setUnit(u)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors
                ${unit === u ? 'bg-accent text-bg-base' : 'text-text-muted hover:text-text-primary'}`}
            >
              {u === 's' ? '秒' : '毫秒'}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 h-[calc(100vh-16rem)]">
        <div className="flex flex-col gap-2">
          <label className="text-xs font-medium text-text-muted uppercase tracking-wider">输入时间戳或日期</label>
          <textarea
            className="tool-input flex-1 font-mono text-xs leading-relaxed"
            value={input}
            onChange={e => { setInput(e.target.value); setError('') }}
            placeholder="输入 Unix 时间戳或日期字符串...&#10;例如: 1700000000 或 2024-01-01"
            spellCheck={false}
          />
          <div className="text-xs text-text-muted">支持 Unix 时间戳或 ISO 日期格式</div>
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-xs font-medium text-text-muted uppercase tracking-wider">转换结果</label>
          {error ? (
            <div className="flex-1 rounded-lg bg-rose-500/10 border border-rose-500/30 p-4 flex items-center justify-center">
              <p className="text-sm text-rose-500">{error}</p>
            </div>
          ) : result ? (
            <div className="flex-1 overflow-y-auto space-y-3">
              <div className="p-3 rounded-lg bg-bg-surface border border-border-base">
                <div className="text-xs text-text-muted mb-1">Unix 时间戳 (秒)</div>
                <p className="font-mono text-sm text-text-primary">{result.unix}</p>
              </div>

              <div className="p-3 rounded-lg bg-bg-surface border border-border-base">
                <div className="text-xs text-text-muted mb-1">Unix 时间戳 (毫秒)</div>
                <p className="font-mono text-sm text-text-primary">{result.unixMs}</p>
              </div>

              <div className="p-3 rounded-lg bg-bg-surface border border-border-base">
                <div className="text-xs text-text-muted mb-1">ISO 8601</div>
                <p className="font-mono text-sm text-text-primary">{result.iso}</p>
              </div>

              <div className="p-3 rounded-lg bg-bg-surface border border-border-base">
                <div className="text-xs text-text-muted mb-1">UTC</div>
                <p className="font-mono text-sm text-text-primary">{result.utc}</p>
              </div>

              <div className="p-3 rounded-lg bg-bg-surface border border-border-base">
                <div className="text-xs text-text-muted mb-1">本地时间</div>
                <p className="font-mono text-sm text-text-primary">{result.local}</p>
              </div>
            </div>
          ) : (
            <div className="flex-1 rounded-lg bg-bg-raised border border-border-base flex items-center justify-center">
              <p className="text-text-muted text-sm">输入时间戳或日期后点击转换</p>
            </div>
          )}
        </div>
      </div>
    </ToolLayout>
  )
}
