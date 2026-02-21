import { useState } from 'react'
import { Sparkles, Copy, Check, AlertCircle, Database } from 'lucide-react'
import { ToolLayout } from '@/components/tool/ToolLayout'
import { useClipboard } from '@/hooks/useClipboard'
import { meta } from './meta'

interface SqlResult {
  sql: string
  explanation: string
}

export default function AiSqlGenerator() {
  const [description, setDescription] = useState('')
  const [schema, setSchema] = useState('')
  const [showSchema, setShowSchema] = useState(false)
  const [result, setResult] = useState<SqlResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const { copy, copied } = useClipboard()

  const generate = async () => {
    if (!description.trim()) return
    setLoading(true); setError(''); setResult(null)
    try {
      const res = await fetch('/api/ai/sql', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description, schema: schema.trim() || undefined }),
      })
      const json = await res.json() as { success: boolean; data?: SqlResult; error?: string }
      if (json.success && json.data) {
        setResult(json.data)
      } else {
        setError(json.error ?? 'AI 请求失败')
      }
    } catch (e) {
      setError('网络错误：' + (e as Error).message)
    } finally {
      setLoading(false)
    }
  }

  const examples = [
    '查询过去 30 天注册的用户，按注册时间倒序',
    '统计每个分类下的商品数量和平均价格',
    '查找购买次数超过 5 次的 VIP 用户',
    '获取每个部门薪资最高的员工',
  ]

  const schemaPlaceholder = `-- 示例 Schema
CREATE TABLE users (
  id INT PRIMARY KEY,
  name VARCHAR(100),
  email VARCHAR(200),
  created_at DATETIME
);

CREATE TABLE orders (
  id INT PRIMARY KEY,
  user_id INT,
  amount DECIMAL(10,2),
  created_at DATETIME
);`

  return (
    <ToolLayout meta={meta} onReset={() => { setDescription(''); setSchema(''); setResult(null); setError('') }}>
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <label className="text-xs font-medium text-text-muted uppercase tracking-wider">描述你想查询的数据</label>
          <textarea
            className="tool-input h-24 resize-none"
            placeholder="例如：查询上个月销售额最高的前 10 个商品，包含商品名称、销售数量和总销售额"
            value={description}
            onChange={e => setDescription(e.target.value)}
          />
          <div className="flex flex-wrap gap-1.5">
            {examples.map(ex => (
              <button key={ex} onClick={() => setDescription(ex)}
                className="px-2 py-1 text-xs rounded-md bg-bg-raised text-text-muted hover:text-text-primary hover:bg-bg-surface border border-border-base transition-colors">
                {ex}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <button
            onClick={() => setShowSchema(!showSchema)}
            className="flex items-center gap-2 text-xs text-text-muted hover:text-text-primary transition-colors self-start">
            <Database className="w-3.5 h-3.5" />
            {showSchema ? '隐藏 Schema（可选）' : '添加 Schema 以获得更准确的 SQL'}
          </button>
          {showSchema && (
            <textarea
              className="tool-input font-mono text-xs h-32 resize-none"
              placeholder={schemaPlaceholder}
              value={schema}
              onChange={e => setSchema(e.target.value)}
              spellCheck={false}
            />
          )}
        </div>

        <button onClick={generate} disabled={loading || !description.trim()} className="btn-primary self-start gap-2">
          <Sparkles className="w-4 h-4" />
          {loading ? '生成中...' : 'AI 生成 SQL'}
        </button>

        {error && (
          <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 flex gap-2 text-xs text-rose-400">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />{error}
          </div>
        )}

        {result && (
          <div className="bg-bg-surface rounded-lg border border-border-base p-4 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-text-muted uppercase tracking-wider">生成的 SQL</span>
              <button onClick={() => copy(result.sql)} className="btn-ghost text-xs gap-1">
                {copied ? <Check className="w-3.5 h-3.5 text-accent" /> : <Copy className="w-3.5 h-3.5" />}
                复制
              </button>
            </div>
            <pre className="font-mono text-sm text-text-primary bg-bg-raised rounded-lg px-4 py-3 overflow-x-auto whitespace-pre-wrap">{result.sql}</pre>
            <div className="text-xs text-text-secondary leading-relaxed">
              <span className="font-medium text-text-primary">说明：</span>{result.explanation}
            </div>
          </div>
        )}
      </div>
    </ToolLayout>
  )
}
