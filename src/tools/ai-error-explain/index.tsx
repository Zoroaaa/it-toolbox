import { useState } from 'react'
import { Bug, Copy, Check, AlertCircle, Sparkles, Lightbulb, Wrench } from 'lucide-react'
import { ToolLayout } from '@/components/tool/ToolLayout'
import { useClipboard } from '@/hooks/useClipboard'
import { meta } from './meta'
import { callAi } from '@/lib/ai'

interface ErrorResult {
  cause: string
  explanation: string
  solutions: string[]
  relatedDocs?: string
}

export default function AiErrorExplain() {
  const [errorText, setErrorText] = useState('')
  const [context, setContext] = useState('')
  const [result, setResult] = useState<ErrorResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const { copy, copied } = useClipboard()

  const explain = async () => {
    if (!errorText.trim()) return
    setLoading(true)
    setError('')
    setResult(null)
    try {
      const ai = await callAi<ErrorResult>('error-explain', { errorText, context })
      if (ai.ok) setResult(ai.data)
      else setError(ai.error)
    } catch (e) {
      setError('网络错误：' + (e as Error).message)
    } finally {
      setLoading(false)
    }
  }

  const examples = [
    'TypeError: Cannot read properties of undefined (reading "map")',
    'Error: ENOENT: no such file or directory, open "./config.json"',
    'SyntaxError: Unexpected token < in JSON at position 0',
    'ReferenceError: process is not defined',
  ]

  return (
    <ToolLayout meta={meta} onReset={() => { setErrorText(''); setContext(''); setResult(null); setError('') }}>
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <label className="text-xs font-medium text-text-muted uppercase tracking-wider">错误信息</label>
          <textarea
            className="tool-input font-mono text-sm h-28 resize-none"
            placeholder="粘贴完整的错误堆栈或错误信息..."
            value={errorText}
            onChange={e => setErrorText(e.target.value)}
            spellCheck={false}
          />
          <div className="flex flex-wrap gap-1.5">
            {examples.map(ex => (
              <button
                key={ex.slice(0, 20)}
                onClick={() => setErrorText(ex)}
                className="px-2 py-1 text-xs rounded-md bg-bg-raised text-text-muted hover:text-text-primary hover:bg-bg-surface border border-border-base transition-colors"
              >
                {ex.slice(0, 30)}...
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-xs font-medium text-text-muted uppercase tracking-wider">上下文（可选）</label>
          <input
            className="tool-input"
            placeholder="例如：React 18 项目，使用 TypeScript"
            value={context}
            onChange={e => setContext(e.target.value)}
          />
        </div>

        <button
          onClick={explain}
          disabled={loading || !errorText.trim()}
          className="btn-primary gap-2"
        >
          <Sparkles className="w-4 h-4" />
          {loading ? '分析中...' : 'AI 解释'}
        </button>

        {error && (
          <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 flex gap-2 text-xs text-rose-400">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            {error}
          </div>
        )}

        {result && (
          <div className="flex flex-col gap-4">
            <div className="bg-bg-surface rounded-lg border border-border-base p-4 flex flex-col gap-3">
              <div className="flex items-center gap-2">
                <Bug className="w-4 h-4 text-rose-400" />
                <span className="text-xs font-medium text-text-muted uppercase tracking-wider">错误原因</span>
              </div>
              <div className="text-sm text-text-primary leading-relaxed">
                {result.cause}
              </div>
            </div>

            <div className="bg-bg-surface rounded-lg border border-border-base p-4 flex flex-col gap-3">
              <div className="flex items-center gap-2">
                <Lightbulb className="w-4 h-4 text-amber-400" />
                <span className="text-xs font-medium text-text-muted uppercase tracking-wider">详细解释</span>
              </div>
              <div className="text-sm text-text-secondary leading-relaxed">
                {result.explanation}
              </div>
            </div>

            <div className="bg-bg-surface rounded-lg border border-border-base p-4 flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Wrench className="w-4 h-4 text-emerald-400" />
                  <span className="text-xs font-medium text-text-muted uppercase tracking-wider">修复方案</span>
                </div>
                <button
                  onClick={() => copy(result.solutions.join('\n\n'))}
                  className="btn-ghost text-xs gap-1"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-accent" /> : <Copy className="w-3.5 h-3.5" />}
                  复制
                </button>
              </div>
              <ol className="text-sm text-text-secondary leading-relaxed space-y-2">
                {result.solutions.map((solution, i) => (
                  <li key={i} className="flex gap-2">
                    <span className="text-accent font-mono">{i + 1}.</span>
                    <span>{solution}</span>
                  </li>
                ))}
              </ol>
            </div>

            {result.relatedDocs && (
              <div className="text-xs text-text-muted leading-relaxed">
                <span className="font-medium text-text-secondary">相关文档：</span>
                {result.relatedDocs}
              </div>
            )}
          </div>
        )}
      </div>
    </ToolLayout>
  )
}
