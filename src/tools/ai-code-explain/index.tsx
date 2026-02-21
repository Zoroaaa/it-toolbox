import { useState } from 'react'
import { Sparkles, AlertCircle } from 'lucide-react'
import { ToolLayout } from '@/components/tool/ToolLayout'
import { meta } from './meta'

const LANGUAGES = ['auto', 'javascript', 'typescript', 'python', 'go', 'rust', 'java', 'c', 'cpp', 'sql', 'bash', 'css', 'html']
const LANG_LABELS: Record<string, string> = {
  auto: '自动检测', javascript: 'JavaScript', typescript: 'TypeScript',
  python: 'Python', go: 'Go', rust: 'Rust', java: 'Java',
  c: 'C', cpp: 'C++', sql: 'SQL', bash: 'Shell', css: 'CSS', html: 'HTML',
}

export default function AiCodeExplain() {
  const [code, setCode] = useState('')
  const [language, setLanguage] = useState('auto')
  const [explanation, setExplanation] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const explain = async () => {
    if (!code.trim()) return
    if (code.length > 4000) { setError('代码超过 4000 字符限制'); return }
    setLoading(true); setError(''); setExplanation('')
    try {
      const res = await fetch('/api/ai/explain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, language: language === 'auto' ? undefined : language }),
      })
      const json = await res.json() as { success: boolean; data?: { explanation: string }; error?: string }
      if (json.success && json.data) {
        setExplanation(json.data.explanation)
      } else {
        setError(json.error ?? 'AI 请求失败')
      }
    } catch (e) {
      setError('网络错误：' + (e as Error).message)
    } finally {
      setLoading(false)
    }
  }

  const exampleCode = `function debounce(fn, delay) {
  let timer
  return function(...args) {
    clearTimeout(timer)
    timer = setTimeout(() => fn.apply(this, args), delay)
  }
}`

  return (
    <ToolLayout meta={meta} onReset={() => { setCode(''); setExplanation(''); setError('') }}>
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-3 flex-wrap">
            <label className="text-xs font-medium text-text-muted uppercase tracking-wider">代码</label>
            <select
              className="text-xs bg-bg-raised border border-border-base rounded-md px-2 py-1 text-text-secondary"
              value={language}
              onChange={e => setLanguage(e.target.value)}>
              {LANGUAGES.map(l => <option key={l} value={l}>{LANG_LABELS[l]}</option>)}
            </select>
            <span className={`text-xs ml-auto ${code.length > 3600 ? 'text-amber-400' : 'text-text-muted'}`}>
              {code.length} / 4000
            </span>
          </div>
          <textarea
            className="tool-input font-mono text-sm h-48 resize-none"
            placeholder="粘贴要解释的代码..."
            value={code}
            onChange={e => setCode(e.target.value)}
            spellCheck={false}
          />
          <div className="flex items-center gap-2">
            <button onClick={explain} disabled={loading || !code.trim()} className="btn-primary gap-2">
              <Sparkles className="w-4 h-4" />
              {loading ? 'AI 分析中...' : '解释代码'}
            </button>
            <button onClick={() => { setCode(exampleCode); setLanguage('javascript') }}
              className="btn-ghost text-xs">载入示例</button>
          </div>
        </div>

        {error && (
          <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 flex gap-2 text-xs text-rose-400">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />{error}
          </div>
        )}

        {loading && (
          <div className="flex items-center gap-3 p-4 bg-bg-surface rounded-lg border border-border-base">
            <div className="w-4 h-4 border-2 border-accent border-t-transparent rounded-full animate-spin" />
            <span className="text-sm text-text-muted">AI 正在分析代码...</span>
          </div>
        )}

        {explanation && (
          <div className="bg-bg-surface rounded-lg border border-border-base p-4">
            <p className="text-xs font-medium text-text-muted uppercase tracking-wider mb-3">AI 解释</p>
            <div className="text-sm text-text-primary leading-relaxed whitespace-pre-wrap">{explanation}</div>
          </div>
        )}
      </div>
    </ToolLayout>
  )
}
