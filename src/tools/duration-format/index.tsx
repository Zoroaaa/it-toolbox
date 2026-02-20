import { useState } from 'react'
import { ToolLayout } from '@/components/tool/ToolLayout'
import { meta } from './meta'
import { formatDuration, parseDuration, humanizeDuration } from '@it-toolbox/core'

export default function DurationFormatTool() {
  const [input, setInput] = useState('3661')
  const [inputFormat, setInputFormat] = useState<'seconds' | 'hhmmss'>('seconds')
  const [error, setError] = useState('')

  const seconds = (() => {
    if (!input.trim()) return 0
    if (inputFormat === 'seconds') {
      const num = parseInt(input, 10)
      return isNaN(num) ? 0 : num
    }
    const result = parseDuration(input)
    return result.ok ? result.value : 0
  })()

  const handleParse = () => {
    setError('')
    if (!input.trim()) return

    if (inputFormat === 'hhmmss') {
      const result = parseDuration(input)
      if (!result.ok) {
        setError(result.error)
      }
    }
  }

  return (
    <ToolLayout meta={meta}>
      <div className="space-y-4">
        <div className="flex gap-4 flex-wrap">
          <div className="flex-1 min-w-48">
            <label className="block text-sm text-text-secondary mb-1">输入</label>
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={inputFormat === 'seconds' ? '输入秒数...' : '输入时长 (如 1:30:45)...'}
              className="w-full px-3 py-2 bg-bg-secondary border border-border-primary rounded-lg text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-accent-primary"
            />
          </div>

          <div className="w-40">
            <label className="block text-sm text-text-secondary mb-1">输入格式</label>
            <select
              value={inputFormat}
              onChange={(e) => setInputFormat(e.target.value as 'seconds' | 'hhmmss')}
              className="w-full px-3 py-2 bg-bg-secondary border border-border-primary rounded-lg text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-accent-primary"
            >
              <option value="seconds">秒数</option>
              <option value="hhmmss">时:分:秒</option>
            </select>
          </div>

          {inputFormat === 'hhmmss' && (
            <div className="flex items-end">
              <button
                onClick={handleParse}
                className="px-4 py-2 bg-accent-primary text-white rounded-lg text-sm font-medium hover:bg-accent-secondary transition-colors"
              >
                解析
              </button>
            </div>
          )}
        </div>

        {error && (
          <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
            {error}
          </div>
        )}

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 bg-bg-secondary border border-border-primary rounded-lg">
            <div className="text-sm text-text-secondary mb-1">秒</div>
            <div className="text-2xl font-bold text-text-primary">{seconds}</div>
          </div>
          <div className="p-4 bg-bg-secondary border border-border-primary rounded-lg">
            <div className="text-sm text-text-secondary mb-1">分钟</div>
            <div className="text-2xl font-bold text-text-primary">{(seconds / 60).toFixed(2)}</div>
          </div>
          <div className="p-4 bg-bg-secondary border border-border-primary rounded-lg">
            <div className="text-sm text-text-secondary mb-1">小时</div>
            <div className="text-2xl font-bold text-text-primary">{(seconds / 3600).toFixed(4)}</div>
          </div>
          <div className="p-4 bg-bg-secondary border border-border-primary rounded-lg">
            <div className="text-sm text-text-secondary mb-1">天</div>
            <div className="text-2xl font-bold text-text-primary">{(seconds / 86400).toFixed(4)}</div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 bg-bg-secondary border border-border-primary rounded-lg">
            <div className="text-sm text-text-secondary mb-1">格式化 (HH:MM:SS)</div>
            <div className="text-xl font-mono text-text-primary">{formatDuration(seconds)}</div>
          </div>
          <div className="p-4 bg-bg-secondary border border-border-primary rounded-lg">
            <div className="text-sm text-text-secondary mb-1">人性化</div>
            <div className="text-xl text-text-primary">{humanizeDuration(seconds)}</div>
          </div>
        </div>

        <div className="p-4 bg-bg-secondary border border-border-primary rounded-lg">
          <div className="text-sm font-medium text-text-primary mb-2">常用时长参考</div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
            <div className="flex justify-between">
              <span className="text-text-tertiary">1 分钟</span>
              <span className="text-text-primary font-mono">60 秒</span>
            </div>
            <div className="flex justify-between">
              <span className="text-text-tertiary">1 小时</span>
              <span className="text-text-primary font-mono">3600 秒</span>
            </div>
            <div className="flex justify-between">
              <span className="text-text-tertiary">1 天</span>
              <span className="text-text-primary font-mono">86400 秒</span>
            </div>
            <div className="flex justify-between">
              <span className="text-text-tertiary">1 周</span>
              <span className="text-text-primary font-mono">604800 秒</span>
            </div>
          </div>
        </div>
      </div>
    </ToolLayout>
  )
}
