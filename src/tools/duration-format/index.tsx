import { useState, useMemo, useCallback } from 'react'
import { ToolLayout } from '@/components/tool/ToolLayout'
import { meta } from './meta'
import { formatDuration, parseDuration, humanizeDuration } from '@it-toolbox/core'
import { useAppStore } from '@/store/app'

type InputFormat = 'seconds' | 'hhmmss'

export default function DurationFormatTool() {
  const [input, setInput] = useState('3661')
  const [inputFormat, setInputFormat] = useState<InputFormat>('seconds')
  const [error, setError] = useState('')
  const { addRecentTool } = useAppStore()

  const seconds = useMemo(() => {
    if (!input.trim()) return 0
    if (inputFormat === 'seconds') {
      const num = parseInt(input, 10)
      return isNaN(num) ? 0 : num
    }
    const result = parseDuration(input)
    return result.ok ? result.value : 0
  }, [input, inputFormat])

  const handleParse = useCallback(() => {
    setError('')
    if (!input.trim()) return
    addRecentTool(meta.id)

    if (inputFormat === 'hhmmss') {
      const result = parseDuration(input)
      if (!result.ok) {
        setError(result.error)
      }
    }
  }, [input, inputFormat, addRecentTool])

  const reset = () => {
    setInput('3661')
    setInputFormat('seconds')
    setError('')
  }

  return (
    <ToolLayout meta={meta} onReset={reset}>
      <div className="flex items-center gap-2 mb-4 flex-wrap">
        {inputFormat === 'hhmmss' && (
          <button onClick={handleParse} className="btn-primary">
            解析
          </button>
        )}

        <div className="flex items-center gap-1 bg-bg-raised rounded-lg p-1">
          {(['seconds', 'hhmmss'] as InputFormat[]).map(f => (
            <button
              key={f}
              onClick={() => { setInputFormat(f); setError('') }}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors
                ${inputFormat === f ? 'bg-accent text-bg-base' : 'text-text-muted hover:text-text-primary'}`}
            >
              {f === 'seconds' ? '秒数' : '时:分:秒'}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex gap-4 flex-wrap">
          <div className="flex-1 min-w-48">
            <label className="text-xs font-medium text-text-muted uppercase tracking-wider block mb-1">输入</label>
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={inputFormat === 'seconds' ? '输入秒数...' : '输入时长 (如 1:30:45)...'}
              className="tool-input"
            />
          </div>
        </div>

        {error && (
          <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-lg text-rose-400 text-sm">
            {error}
          </div>
        )}

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 bg-bg-surface border border-border-base rounded-lg">
            <div className="text-xs font-medium text-text-muted uppercase tracking-wider mb-1">秒</div>
            <div className="text-2xl font-bold text-text-primary">{seconds}</div>
          </div>
          <div className="p-4 bg-bg-surface border border-border-base rounded-lg">
            <div className="text-xs font-medium text-text-muted uppercase tracking-wider mb-1">分钟</div>
            <div className="text-2xl font-bold text-text-primary">{(seconds / 60).toFixed(2)}</div>
          </div>
          <div className="p-4 bg-bg-surface border border-border-base rounded-lg">
            <div className="text-xs font-medium text-text-muted uppercase tracking-wider mb-1">小时</div>
            <div className="text-2xl font-bold text-text-primary">{(seconds / 3600).toFixed(4)}</div>
          </div>
          <div className="p-4 bg-bg-surface border border-border-base rounded-lg">
            <div className="text-xs font-medium text-text-muted uppercase tracking-wider mb-1">天</div>
            <div className="text-2xl font-bold text-text-primary">{(seconds / 86400).toFixed(4)}</div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 bg-bg-surface border border-border-base rounded-lg">
            <div className="text-xs font-medium text-text-muted uppercase tracking-wider mb-1">格式化 (HH:MM:SS)</div>
            <div className="text-xl font-mono text-text-primary">{formatDuration(seconds)}</div>
          </div>
          <div className="p-4 bg-bg-surface border border-border-base rounded-lg">
            <div className="text-xs font-medium text-text-muted uppercase tracking-wider mb-1">人性化</div>
            <div className="text-xl text-text-primary">{humanizeDuration(seconds)}</div>
          </div>
        </div>

        <div className="p-4 bg-bg-surface border border-border-base rounded-lg">
          <div className="text-xs font-medium text-text-muted uppercase tracking-wider mb-2">常用时长参考</div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
            <div className="flex justify-between">
              <span className="text-text-muted">1 分钟</span>
              <span className="text-text-primary font-mono">60 秒</span>
            </div>
            <div className="flex justify-between">
              <span className="text-text-muted">1 小时</span>
              <span className="text-text-primary font-mono">3600 秒</span>
            </div>
            <div className="flex justify-between">
              <span className="text-text-muted">1 天</span>
              <span className="text-text-primary font-mono">86400 秒</span>
            </div>
            <div className="flex justify-between">
              <span className="text-text-muted">1 周</span>
              <span className="text-text-primary font-mono">604800 秒</span>
            </div>
          </div>
        </div>
      </div>
    </ToolLayout>
  )
}
