import { useState, useCallback, useEffect } from 'react'
import { RefreshCw, Download, Shield, Copy, Check } from 'lucide-react'
import zxcvbn from 'zxcvbn'
import { ToolLayout } from '@/components/tool/ToolLayout'
import { generatePasswords, type PasswordOptions } from '@core/index'
import { useAppStore } from '@/store/app'
import { useClipboard } from '@/hooks/useClipboard'
import { meta } from './meta'

const STRENGTH_LEVELS = [
  { label: '非常弱',  color: '#ef4444', bg: 'bg-red-500' },
  { label: '弱',      color: '#f97316', bg: 'bg-orange-500' },
  { label: '一般',    color: '#eab308', bg: 'bg-yellow-500' },
  { label: '强',      color: '#22c55e', bg: 'bg-green-500' },
  { label: '非常强',  color: '#10b981', bg: 'bg-emerald-500' },
]

function formatCrackTime(seconds: number | string): string {
  if (typeof seconds === 'string') return seconds
  if (seconds < 1) return '瞬间'
  if (seconds < 60) return `${Math.round(seconds)} 秒`
  if (seconds < 3600) return `${Math.round(seconds / 60)} 分钟`
  if (seconds < 86400) return `${Math.round(seconds / 3600)} 小时`
  if (seconds < 2592000) return `${Math.round(seconds / 86400)} 天`
  if (seconds < 31536000) return `${Math.round(seconds / 2592000)} 个月`
  if (seconds < 3.15e10) return `${Math.round(seconds / 31536000)} 年`
  return '数百年+'
}

export default function PasswordGenerator() {
  const [passwords, setPasswords] = useState<string[]>([])
  const [options, setOptions] = useState<PasswordOptions>({
    length: 16,
    uppercase: true,
    lowercase: true,
    numbers: true,
    symbols: true,
    excludeSimilar: false,
  })
  const [count, setCount] = useState(5)
  const [zxcvbnResult, setZxcvbnResult] = useState<ReturnType<typeof zxcvbn> | null>(null)
  const { addRecentTool } = useAppStore()
  const { copy } = useClipboard()
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null)

  const generate = useCallback(() => {
    addRecentTool(meta.id)
    const result = generatePasswords(count, options)
    if (result.ok) setPasswords(result.value)
  }, [count, options, addRecentTool])

  useEffect(() => {
    if (passwords.length > 0) {
      // zxcvbn is CPU-bound; use first password as representative sample
      setZxcvbnResult(zxcvbn(passwords[0]))
    }
  }, [passwords])

  const handleCopy = (pwd: string, idx: number) => {
    copy(pwd)
    setCopiedIdx(idx)
    setTimeout(() => setCopiedIdx(null), 2000)
  }

  const downloadAsText = () => {
    const blob = new Blob([passwords.join('\n')], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = 'passwords.txt'; a.click()
    URL.revokeObjectURL(url)
  }

  const updateOption = <K extends keyof PasswordOptions>(key: K, value: PasswordOptions[K]) => {
    setOptions(prev => ({ ...prev, [key]: value }))
  }

  const reset = () => {
    setPasswords([])
    setOptions({ length: 16, uppercase: true, lowercase: true, numbers: true, symbols: true, excludeSimilar: false })
    setCount(5)
    setZxcvbnResult(null)
  }

  const level = zxcvbnResult ? STRENGTH_LEVELS[zxcvbnResult.score] : null
  const crackTime = zxcvbnResult
    ? formatCrackTime(zxcvbnResult.crack_times_seconds.online_no_throttling_10_per_second)
    : null

  return (
    <ToolLayout meta={meta} onReset={reset} outputValue={passwords.join('\n')}>
      {/* Controls */}
      <div className="flex items-center gap-4 mb-4 flex-wrap">
        <button onClick={generate} className="btn-primary">
          <RefreshCw className="w-4 h-4" />生成
        </button>
        <div className="flex items-center gap-2">
          <label className="text-xs text-text-muted">长度</label>
          <input type="number" min={4} max={128} value={options.length}
            onChange={e => updateOption('length', Math.min(128, Math.max(4, parseInt(e.target.value) || 16)))}
            className="w-16 px-2 py-1.5 rounded-lg bg-bg-surface border border-border-base text-sm text-text-primary focus:outline-none focus:border-accent" />
        </div>
        <div className="flex items-center gap-2">
          <label className="text-xs text-text-muted">数量</label>
          <input type="number" min={1} max={100} value={count}
            onChange={e => setCount(Math.min(100, Math.max(1, parseInt(e.target.value) || 5)))}
            className="w-16 px-2 py-1.5 rounded-lg bg-bg-surface border border-border-base text-sm text-text-primary focus:outline-none focus:border-accent" />
        </div>
        {passwords.length > 0 && (
          <button onClick={downloadAsText} className="btn-ghost ml-auto">
            <Download className="w-4 h-4" />下载
          </button>
        )}
      </div>

      <div className="flex items-center gap-4 mb-4 flex-wrap">
        {[
          { key: 'uppercase',      label: '大写字母 (A-Z)' },
          { key: 'lowercase',      label: '小写字母 (a-z)' },
          { key: 'numbers',        label: '数字 (0-9)' },
          { key: 'symbols',        label: '特殊字符 (!@#...)' },
          { key: 'excludeSimilar', label: '排除相似字符 (0/O/l/1)' },
        ].map(({ key, label }) => (
          <label key={key} className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={options[key as keyof PasswordOptions] as boolean}
              onChange={e => updateOption(key as keyof PasswordOptions, e.target.checked)}
              className="w-4 h-4 rounded border-border-base bg-bg-surface accent-accent" />
            <span className="text-sm text-text-secondary">{label}</span>
          </label>
        ))}
      </div>

      {/* zxcvbn Strength indicator */}
      {level && zxcvbnResult && (
        <div className="mb-4 p-4 rounded-xl bg-bg-surface border border-border-base">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4" style={{ color: level.color }} />
              <span className="text-sm font-semibold" style={{ color: level.color }}>{level.label}</span>
            </div>
            <div className="text-xs text-text-muted">
              在线破解（无限制）: <span className="font-mono text-text-primary">{crackTime}</span>
            </div>
          </div>
          {/* Score bar */}
          <div className="h-2 bg-bg-raised rounded-full overflow-hidden mb-3">
            <div
              className={`h-full transition-all duration-500 rounded-full ${level.bg}`}
              style={{ width: `${(zxcvbnResult.score + 1) * 20}%` }}
            />
          </div>
          {/* Suggestions */}
          {zxcvbnResult.feedback.suggestions.length > 0 && (
            <div className="flex flex-col gap-1">
              {zxcvbnResult.feedback.suggestions.map((s, i) => (
                <p key={i} className="text-xs text-text-muted">• {s}</p>
              ))}
            </div>
          )}
          {zxcvbnResult.feedback.warning && (
            <p className="text-xs text-yellow-400 mt-1">⚠ {zxcvbnResult.feedback.warning}</p>
          )}
        </div>
      )}

      {/* Password list */}
      <div className="flex-1 min-h-0">
        {passwords.length > 0 ? (
          <div className="rounded-lg bg-bg-surface border border-border-base overflow-hidden">
            {passwords.map((pwd, i) => (
              <div key={i}
                className="flex items-center gap-3 px-4 py-2.5 border-b border-border-base last:border-b-0 hover:bg-bg-raised transition-colors group">
                <span className="font-mono text-sm text-text-primary flex-1 select-all">{pwd}</span>
                <button onClick={() => handleCopy(pwd, i)}
                  className="p-1.5 rounded-md opacity-0 group-hover:opacity-100 hover:bg-bg-base transition-all">
                  {copiedIdx === i ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4 text-text-muted" />}
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="h-32 rounded-lg bg-bg-raised border border-border-base flex items-center justify-center">
            <p className="text-text-muted text-sm">配置选项后点击生成</p>
          </div>
        )}
      </div>
    </ToolLayout>
  )
}
