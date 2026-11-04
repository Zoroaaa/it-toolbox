import { useState } from 'react'
import { Copy, Check, AlertCircle, Sparkles, Plus, Minus } from 'lucide-react'
import { ToolLayout } from '@/components/tool/ToolLayout'
import { useClipboard } from '@/hooks/useClipboard'
import { meta } from './meta'
import { callAi } from '@/lib/ai'

interface MockResult {
  data: unknown
  explanation: string
}

export default function AiMockData() {
  const [description, setDescription] = useState('')
  const [count, setCount] = useState(3)
  const [result, setResult] = useState<MockResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const { copy, copied } = useClipboard()

  const generate = async () => {
    if (!description.trim()) return
    setLoading(true)
    setError('')
    setResult(null)
    try {
      const ai = await callAi<MockResult>('mock-data', { description, count })
      if (ai.ok) setResult(ai.data)
      else setError(ai.error)
    } catch (e) {
      setError('网络错误：' + (e as Error).message)
    } finally {
      setLoading(false)
    }
  }

  const jsonOutput = result ? JSON.stringify(result.data, null, 2) : ''

  const examples = [
    '用户信息：姓名、邮箱、手机号、年龄',
    '商品数据：名称、价格、库存、分类',
    '订单信息：订单号、商品列表、总价、状态',
    '博客文章：标题、作者、内容、发布时间',
    '公司信息：名称、地址、员工数、行业',
  ]

  return (
    <ToolLayout meta={meta} onReset={() => { setDescription(''); setResult(null); setError(''); setCount(3) }}>
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <label className="text-xs font-medium text-text-muted uppercase tracking-wider">描述数据结构</label>
          <textarea
            className="tool-input font-mono text-sm h-24 resize-none"
            placeholder="例如：用户信息，包含姓名、邮箱、手机号、年龄"
            value={description}
            onChange={e => setDescription(e.target.value)}
          />
          <div className="flex flex-wrap gap-1.5">
            {examples.map(ex => (
              <button
                key={ex}
                onClick={() => setDescription(ex)}
                className="px-2 py-1 text-xs rounded-md bg-bg-raised text-text-muted hover:text-text-primary hover:bg-bg-surface border border-border-base transition-colors"
              >
                {ex.split('：')[0]}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-xs font-medium text-text-muted uppercase tracking-wider">生成数量</label>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCount(Math.max(1, count - 1))}
              className="p-2 rounded-lg bg-bg-raised border border-border-base hover:bg-bg-surface transition-colors"
            >
              <Minus className="w-4 h-4 text-text-muted" />
            </button>
            <input
              type="number"
              className="tool-input w-20 text-center"
              value={count}
              onChange={e => setCount(Math.max(1, Math.min(20, parseInt(e.target.value) || 1)))}
              min={1}
              max={20}
            />
            <button
              onClick={() => setCount(Math.min(20, count + 1))}
              className="p-2 rounded-lg bg-bg-raised border border-border-base hover:bg-bg-surface transition-colors"
            >
              <Plus className="w-4 h-4 text-text-muted" />
            </button>
            <span className="text-xs text-text-muted">条数据（1-20）</span>
          </div>
        </div>

        <button
          onClick={generate}
          disabled={loading || !description.trim()}
          className="btn-primary gap-2"
        >
          <Sparkles className="w-4 h-4" />
          {loading ? '生成中...' : 'AI 生成 Mock 数据'}
        </button>

        {error && (
          <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 flex gap-2 text-xs text-rose-400">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            {error}
          </div>
        )}

        {result && (
          <div className="flex flex-col gap-3">
            <div className="bg-bg-surface rounded-lg border border-border-base p-4 flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-text-muted uppercase tracking-wider">生成的数据</span>
                <button onClick={() => copy(jsonOutput)} className="btn-ghost text-xs gap-1">
                  {copied ? <Check className="w-3.5 h-3.5 text-accent" /> : <Copy className="w-3.5 h-3.5" />}
                  复制 JSON
                </button>
              </div>
              <pre className="font-mono text-sm text-text-primary bg-bg-raised rounded-lg p-3 overflow-auto max-h-96">
                {jsonOutput}
              </pre>
              <div className="text-xs text-text-secondary leading-relaxed">
                <span className="font-medium text-text-primary">说明：</span>
                {result.explanation}
              </div>
            </div>
          </div>
        )}
      </div>
    </ToolLayout>
  )
}
