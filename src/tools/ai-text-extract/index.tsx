import { useState } from 'react'
import { Copy, Check, AlertCircle, Sparkles } from 'lucide-react'
import { ToolLayout } from '@/components/tool/ToolLayout'
import { useClipboard } from '@/hooks/useClipboard'
import { meta } from './meta'
import { callAi } from '@/lib/ai'

interface ExtractResult {
  data: Record<string, unknown>
  explanation: string
}

export default function AiTextExtract() {
  const [text, setText] = useState('')
  const [fields, setFields] = useState('')
  const [result, setResult] = useState<ExtractResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const { copy, copied } = useClipboard()

  const extract = async () => {
    if (!text.trim()) return
    setLoading(true)
    setError('')
    setResult(null)
    try {
      const ai = await callAi<ExtractResult>('extract', { text, fields: fields || undefined })
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
    { label: '简历信息', fields: '姓名, 电话, 邮箱, 工作年限, 学历' },
    { label: '产品描述', fields: '产品名称, 价格, 规格, 品牌' },
    { label: '新闻文章', fields: '标题, 作者, 日期, 摘要' },
    { label: '订单信息', fields: '订单号, 商品, 数量, 金额, 收货地址' },
  ]

  return (
    <ToolLayout meta={meta} onReset={() => { setText(''); setFields(''); setResult(null); setError('') }}>
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <label className="text-xs font-medium text-text-muted uppercase tracking-wider">输入文本</label>
          <textarea
            className="tool-input font-mono text-sm h-32 resize-none"
            placeholder="粘贴需要提取信息的文本..."
            value={text}
            onChange={e => setText(e.target.value)}
            spellCheck={false}
          />
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-xs font-medium text-text-muted uppercase tracking-wider">要提取的字段（可选，用逗号分隔）</label>
          <input
            className="tool-input"
            placeholder="例如：姓名, 电话, 邮箱, 地址"
            value={fields}
            onChange={e => setFields(e.target.value)}
          />
          <div className="flex flex-wrap gap-1.5">
            {examples.map(ex => (
              <button
                key={ex.label}
                onClick={() => setFields(ex.fields)}
                className="px-2 py-1 text-xs rounded-md bg-bg-raised text-text-muted hover:text-text-primary hover:bg-bg-surface border border-border-base transition-colors"
              >
                {ex.label}
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={extract}
          disabled={loading || !text.trim()}
          className="btn-primary gap-2"
        >
          <Sparkles className="w-4 h-4" />
          {loading ? '提取中...' : 'AI 提取'}
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
                <span className="text-xs font-medium text-text-muted uppercase tracking-wider">提取结果</span>
                <button onClick={() => copy(jsonOutput)} className="btn-ghost text-xs gap-1">
                  {copied ? <Check className="w-3.5 h-3.5 text-accent" /> : <Copy className="w-3.5 h-3.5" />}
                  复制 JSON
                </button>
              </div>
              <pre className="font-mono text-sm text-text-primary bg-bg-raised rounded-lg p-3 overflow-auto max-h-64">
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
