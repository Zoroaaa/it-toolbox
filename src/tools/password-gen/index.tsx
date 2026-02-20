import { useState, useCallback, useEffect } from 'react'
import { RefreshCw, Download, Shield } from 'lucide-react'
import { ToolLayout } from '@/components/tool/ToolLayout'
import { generatePasswords, checkPasswordStrength, type PasswordOptions } from '@core/index'
import { useAppStore } from '@/store/app'
import { meta } from './meta'

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
  const [strength, setStrength] = useState<ReturnType<typeof checkPasswordStrength> | null>(null)
  const { addRecentTool } = useAppStore()

  const generate = useCallback(() => {
    addRecentTool(meta.id)
    const result = generatePasswords(count, options)
    if (result.ok) {
      setPasswords(result.value)
    }
  }, [count, options, addRecentTool])

  useEffect(() => {
    if (passwords.length > 0) {
      setStrength(checkPasswordStrength(passwords[0]))
    }
  }, [passwords])

  const reset = () => {
    setPasswords([])
    setOptions({
      length: 16,
      uppercase: true,
      lowercase: true,
      numbers: true,
      symbols: true,
      excludeSimilar: false,
    })
    setCount(5)
    setStrength(null)
  }

  const outputValue = passwords.join('\n')

  const downloadAsText = () => {
    const blob = new Blob([outputValue], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'passwords.txt'
    a.click()
    URL.revokeObjectURL(url)
  }

  const updateOption = <K extends keyof PasswordOptions>(key: K, value: PasswordOptions[K]) => {
    setOptions(prev => ({ ...prev, [key]: value }))
  }

  return (
    <ToolLayout meta={meta} onReset={reset} outputValue={outputValue}>
      <div className="flex items-center gap-4 mb-4 flex-wrap">
        <button onClick={generate} className="btn-primary">
          <RefreshCw className="w-4 h-4" />
          生成
        </button>

        <div className="flex items-center gap-2">
          <label className="text-xs text-text-muted">长度</label>
          <input
            type="number"
            min={4}
            max={128}
            value={options.length}
            onChange={e => updateOption('length', Math.min(128, Math.max(4, parseInt(e.target.value) || 16)))}
            className="w-16 px-2 py-1.5 rounded-lg bg-bg-surface border border-border-base text-sm text-text-primary focus:outline-none focus:border-accent"
          />
        </div>

        <div className="flex items-center gap-2">
          <label className="text-xs text-text-muted">数量</label>
          <input
            type="number"
            min={1}
            max={100}
            value={count}
            onChange={e => setCount(Math.min(100, Math.max(1, parseInt(e.target.value) || 5)))}
            className="w-16 px-2 py-1.5 rounded-lg bg-bg-surface border border-border-base text-sm text-text-primary focus:outline-none focus:border-accent"
          />
        </div>

        {passwords.length > 0 && (
          <button onClick={downloadAsText} className="btn-ghost ml-auto">
            <Download className="w-4 h-4" />
            下载
          </button>
        )}
      </div>

      <div className="flex items-center gap-4 mb-4 flex-wrap">
        {[
          { key: 'uppercase', label: '大写字母' },
          { key: 'lowercase', label: '小写字母' },
          { key: 'numbers', label: '数字' },
          { key: 'symbols', label: '特殊字符' },
          { key: 'excludeSimilar', label: '排除相似字符' },
        ].map(({ key, label }) => (
          <label key={key} className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={options[key as keyof PasswordOptions] as boolean}
              onChange={e => updateOption(key as keyof PasswordOptions, e.target.checked)}
              className="w-4 h-4 rounded border-border-base bg-bg-surface accent-accent"
            />
            <span className="text-sm text-text-secondary">{label}</span>
          </label>
        ))}
      </div>

      {strength && passwords.length > 0 && (
        <div className="mb-4 p-3 rounded-lg bg-bg-surface border border-border-base">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4" style={{ color: strength.color }} />
              <span className="text-sm font-medium" style={{ color: strength.color }}>
                {strength.label}
              </span>
            </div>
            <span className="text-xs text-text-muted">破解时间: {strength.crackTime}</span>
          </div>
          <div className="h-2 bg-bg-raised rounded-full overflow-hidden">
            <div
              className="h-full transition-all duration-300"
              style={{
                width: `${(strength.score / 11) * 100}%`,
                backgroundColor: strength.color,
              }}
            />
          </div>
        </div>
      )}

      <div className="flex-1 min-h-0">
        {passwords.length > 0 ? (
          <div className="h-full overflow-y-auto rounded-lg bg-bg-surface border border-border-base p-4">
            <div className="space-y-2">
              {passwords.map((pwd, i) => (
                <div key={i} className="font-mono text-sm text-text-primary p-2 rounded bg-bg-raised">
                  {pwd}
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="h-full rounded-lg bg-bg-raised border border-border-base flex items-center justify-center">
            <p className="text-text-muted text-sm">配置选项后点击生成</p>
          </div>
        )}
      </div>
    </ToolLayout>
  )
}
