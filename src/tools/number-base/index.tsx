import { useState, useCallback } from 'react'
import { ArrowRightLeft, Copy, Check } from 'lucide-react'
import { ToolLayout } from '@/components/tool/ToolLayout'
import { convertNumberBase } from '@core/index'
import { useAppStore } from '@/store/app'
import { useClipboard } from '@/hooks/useClipboard'
import { meta } from './meta'

const bases = [
  { value: 2, label: '二进制', prefix: '0b' },
  { value: 8, label: '八进制', prefix: '0o' },
  { value: 10, label: '十进制', prefix: '' },
  { value: 16, label: '十六进制', prefix: '0x' },
]

export default function NumberBaseConverter() {
  const [input, setInput] = useState('')
  const [fromBase, setFromBase] = useState(10)
  const [results, setResults] = useState<{ base: number; value: string }[]>([])
  const [error, setError] = useState('')
  const { addHistory, addRecentTool } = useAppStore()
  const { copy, copied } = useClipboard()
  const [copiedBase, setCopiedBase] = useState<number | null>(null)

  const convert = useCallback(() => {
    if (!input.trim()) return
    addRecentTool(meta.id)

    const result = convertNumberBase(input, fromBase)
    if (result.ok) {
      setResults([
        { base: 2, value: result.value.binary },
        { base: 8, value: result.value.octal },
        { base: 10, value: result.value.decimal },
        { base: 16, value: result.value.hexadecimal },
      ])
      setError('')
      addHistory(meta.id, input)
    } else {
      setError(result.error)
      setResults([])
    }
  }, [input, fromBase, addHistory, addRecentTool])

  const handleCopy = (base: number, value: string) => {
    copy(value)
    setCopiedBase(base)
    setTimeout(() => setCopiedBase(null), 2000)
  }

  const reset = () => {
    setInput('')
    setResults([])
    setError('')
    setFromBase(10)
  }

  const outputValue = results.map(r => `${r.base}进制: ${r.value}`).join('\n')

  return (
    <ToolLayout meta={meta} onReset={reset} outputValue={outputValue}>
      <div className="flex items-center gap-4 mb-4 flex-wrap">
        <button onClick={convert} className="btn-primary">
          <ArrowRightLeft className="w-4 h-4" />
          转换
        </button>

        <div className="flex items-center gap-2">
          <label className="text-xs text-text-muted">输入进制</label>
          <select
            value={fromBase}
            onChange={e => setFromBase(parseInt(e.target.value))}
            className="px-3 py-2 rounded-lg bg-bg-surface border border-border-base text-sm text-text-primary focus:outline-none focus:border-accent"
          >
            {bases.map(b => (
              <option key={b.value} value={b.value}>{b.label}</option>
            ))}
          </select>
        </div>

        <div className="flex-1 min-w-48">
          <input
            type="text"
            value={input}
            onChange={e => { setInput(e.target.value); setError('') }}
            placeholder={`输入${bases.find(b => b.value === fromBase)?.label}数字...`}
            className="w-full px-3 py-2 rounded-lg bg-bg-surface border border-border-base font-mono text-sm text-text-primary focus:outline-none focus:border-accent"
          />
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 rounded-lg bg-rose-500/10 border border-rose-500/30">
          <p className="text-sm text-rose-500">{error}</p>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {bases.map(b => {
          const result = results.find(r => r.base === b.value)
          const isInput = b.value === fromBase
          return (
            <div
              key={b.value}
              className={`p-4 rounded-xl border transition-colors group
                ${isInput
                  ? 'bg-accent/10 border-accent/30'
                  : 'bg-bg-surface border-border-base hover:border-border-strong'
                }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className={`text-xs font-medium ${isInput ? 'text-accent' : 'text-text-muted'}`}>
                  {b.label}
                </span>
                {result && !isInput && (
                  <button
                    onClick={() => handleCopy(b.value, result.value)}
                    className="p-1 rounded opacity-0 group-hover:opacity-100 hover:bg-bg-raised transition-all"
                  >
                    {copied && copiedBase === b.value ? (
                      <Check className="w-3.5 h-3.5 text-accent" />
                    ) : (
                      <Copy className="w-3.5 h-3.5 text-text-muted" />
                    )}
                  </button>
                )}
              </div>
              <p className={`font-mono text-sm break-all ${isInput ? 'text-accent' : 'text-text-primary'}`}>
                {b.prefix}{result ? result.value : (isInput ? input || '—' : '—')}
              </p>
            </div>
          )
        })}
      </div>

      {results.length > 0 && (
        <div className="mt-6">
          <label className="text-xs font-medium text-text-muted uppercase tracking-wider mb-3 block">位操作可视化</label>
          <div className="p-4 rounded-xl bg-bg-surface border border-border-base overflow-x-auto">
            <pre className="font-mono text-xs text-text-primary leading-loose">
              {results[0]?.value.split('').map((bit, i) => (
                <span key={i} className="inline-block w-4 text-center hover:text-accent transition-colors">
                  {bit}
                </span>
              ))}
            </pre>
          </div>
        </div>
      )}
    </ToolLayout>
  )
}
