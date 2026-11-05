import { useState } from 'react'
import { Sparkles, Copy, Check, AlertCircle, FileJson } from 'lucide-react'
import { ToolLayout } from '@/components/tool/ToolLayout'
import { useClipboard } from '@/hooks/useClipboard'
import { meta } from './meta'
import { callAi } from '@/lib/ai'

interface SchemaResult {
  schema: string | Record<string, unknown>
  explanation: string
}

const EXAMPLES = [
  `{"name": "张三", "age": 25, "email": "zhangsan@example.com", "active": true}`,
  `{"id": 1, "title": "产品名称", "price": 99.99, "tags": ["热销", "新品"], "stock": 100}`,
  `{"user": {"id": 1, "name": "李四"}, "orders": [{"id": 101, "amount": 199.5}]}`,
]

export default function AiJsonSchema() {
  const [jsonInput, setJsonInput] = useState('')
  const [result, setResult] = useState<SchemaResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const { copy, copied } = useClipboard()

  const generate = async () => {
    if (!jsonInput.trim()) return
    setLoading(true)
    setError('')
    setResult(null)
    
    try {
      JSON.parse(jsonInput)
    } catch {
      setError('JSON格式无效，请检查输入')
      setLoading(false)
      return
    }
    
    try {
      const ai = await callAi<SchemaResult>('json-schema', { json: jsonInput })

      if (ai.ok) setResult(ai.data)
      else setError(ai.error)
    } catch (e) {
      setError('网络错误：' + (e as Error).message)
    } finally {
      setLoading(false)
    }
  }

  const reset = () => {
    setJsonInput('')
    setResult(null)
    setError('')
  }

  const schemaText = result
    ? typeof result.schema === 'string'
      ? result.schema
      : JSON.stringify(result.schema, null, 2)
    : ''

  const outputValue = schemaText

  return (
    <ToolLayout meta={meta} onReset={reset} outputValue={outputValue}>
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <label className="text-xs font-medium text-text-muted uppercase tracking-wider">JSON样本</label>
          <textarea
            value={jsonInput}
            onChange={e => setJsonInput(e.target.value)}
            placeholder="粘贴JSON数据，AI将自动生成对应的JSON Schema..."
            className="w-full h-40 px-4 py-3 rounded-xl bg-bg-surface border border-border-base text-text-primary font-mono text-sm focus:outline-none focus:border-accent resize-none"
            spellCheck={false}
          />
        </div>

        <div className="flex flex-wrap gap-1.5">
          <span className="text-xs text-text-muted">示例:</span>
          {EXAMPLES.map((ex, i) => (
            <button
              key={i}
              onClick={() => setJsonInput(ex)}
              className="px-2 py-1 text-xs rounded-md bg-bg-raised text-text-muted hover:text-text-primary hover:bg-bg-surface border border-border-base transition-colors"
            >
              示例 {i + 1}
            </button>
          ))}
        </div>

        <button
          onClick={generate}
          disabled={loading || !jsonInput.trim()}
          className="btn-primary w-full"
        >
          <Sparkles className="w-4 h-4" />
          {loading ? '生成中...' : 'AI生成Schema'}
        </button>

        {error && (
          <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 flex gap-2 text-xs text-rose-400">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            {error}
          </div>
        )}

        {result && (
          <div className="space-y-4">
            <div className="bg-bg-surface rounded-lg border border-border-base p-4 flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-text-muted uppercase tracking-wider flex items-center gap-2">
                  <FileJson className="w-4 h-4" />
                  生成的JSON Schema
                </span>
                <button
                  onClick={() => copy(schemaText)}
                  className="btn-ghost text-xs"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-accent" /> : <Copy className="w-3.5 h-3.5" />}
                  复制
                </button>
              </div>
              <pre className="bg-bg-raised rounded-lg p-4 text-sm font-mono text-text-primary overflow-x-auto whitespace-pre-wrap">
                {schemaText}
              </pre>
            </div>

            {result.explanation && (
              <div className="bg-bg-surface rounded-lg border border-border-base p-4">
                <div className="text-xs font-medium text-text-muted uppercase tracking-wider mb-2">说明</div>
                <p className="text-sm text-text-secondary leading-relaxed">{result.explanation}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </ToolLayout>
  )
}
