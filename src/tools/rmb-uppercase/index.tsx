import { useMemo, useState } from 'react'
import { Banknote } from 'lucide-react'
import { ToolLayout } from '@/components/tool/ToolLayout'
import { amountToChinese } from '@core/rmb'
import { useAppStore } from '@/store/app'
import { meta } from './meta'

const EXAMPLES = ['1234.56', '1000000.99', '0.05', '1409.5']

export default function RmbUppercase() {
  const [input, setInput] = useState('')
  const addRecentTool = useAppStore((s) => s.addRecentTool)

  const result = useMemo(() => {
    if (!input.trim()) return null
    return amountToChinese(input)
  }, [input])

  const outputValue = result?.ok ? result.value : ''

  const reset = () => setInput('')

  return (
    <ToolLayout meta={meta} onReset={reset} outputValue={outputValue}>
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <label className="text-xs text-text-muted">金额（最多两位小数，可带 ¥ 与千分位）</label>
          <div className="flex items-center gap-2">
            <span className="text-text-muted font-mono text-lg">¥</span>
            <input
              value={input}
              onChange={(e) => {
                const value = e.target.value
                if (!input.trim() && value.trim()) addRecentTool(meta.id)
                setInput(value)
              }}
              inputMode="decimal"
              placeholder="1234.56"
              spellCheck={false}
              className="flex-1 px-3 py-2.5 rounded-xl bg-bg-surface border border-border-base font-mono text-lg text-text-primary focus:outline-none focus:border-accent"
            />
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs text-text-muted">示例</span>
            {EXAMPLES.map((example) => (
              <button
                key={example}
                onClick={() => {
                  setInput(example)
                  addRecentTool(meta.id)
                }}
                className="px-2 py-0.5 rounded-md border border-border-base bg-bg-surface text-xs font-mono text-text-secondary hover:border-accent hover:text-accent transition-colors"
              >
                {example}
              </button>
            ))}
          </div>
        </div>

        <div className="p-5 rounded-xl bg-bg-surface border border-border-base min-h-[96px] flex items-center">
          {!result && <span className="text-sm text-text-muted">输入金额后显示中文大写</span>}
          {result && !result.ok && <span className="text-sm text-red-400">{result.error}</span>}
          {result?.ok && (
            <div className="flex flex-col gap-2">
              <span className="text-2xl font-semibold text-accent tracking-wide break-all">
                {result.value}
              </span>
              <span className="text-xs text-text-muted flex items-center gap-1.5">
                <Banknote className="w-3.5 h-3.5" />
                无角分时补「整」；角位为 0 而分位不为 0 时，「元」后补「零」
              </span>
            </div>
          )}
        </div>

        <ul className="text-xs text-text-muted leading-relaxed list-disc pl-5">
          <li>支持到 16 位整数（9999 万亿元），超出报错而不是静默截断。</li>
          <li>不足 1 元时补「零元」定位，如 0.05 → 零元零伍分。</li>
          <li>三位及以上小数会被拒绝，避免自动四舍五入改变金额。</li>
        </ul>
      </div>
    </ToolLayout>
  )
}
