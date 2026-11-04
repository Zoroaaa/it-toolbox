import { useState } from 'react'
import { Sparkles, AlertCircle, Shield, Zap, BookOpen, CheckCircle, XCircle, AlertTriangle } from 'lucide-react'
import { ToolLayout } from '@/components/tool/ToolLayout'
import { meta } from './meta'
import { callAi } from '@/lib/ai'

const LANGUAGES = ['auto', 'javascript', 'typescript', 'python', 'go', 'rust', 'java', 'c', 'cpp', 'sql', 'bash', 'css', 'html']
const LANG_LABELS: Record<string, string> = {
  auto: '自动检测', javascript: 'JavaScript', typescript: 'TypeScript',
  python: 'Python', go: 'Go', rust: 'Rust', java: 'Java',
  c: 'C', cpp: 'C++', sql: 'SQL', bash: 'Shell', css: 'CSS', html: 'HTML',
}

interface ReviewResult {
  security: {
    score: number
    issues: string[]
    suggestions: string[]
  }
  performance: {
    score: number
    issues: string[]
    suggestions: string[]
  }
  readability: {
    score: number
    issues: string[]
    suggestions: string[]
  }
  overall: string
}

export default function AiCodeReview() {
  const [code, setCode] = useState('')
  const [language, setLanguage] = useState('auto')
  const [review, setReview] = useState<ReviewResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const doReview = async () => {
    if (!code.trim()) return
    if (code.length > 4000) { setError('代码超过 4000 字符限制'); return }
    setLoading(true)
    setError('')
    setReview(null)

    try {
      const ai = await callAi<Partial<ReviewResult>>('review', {
        code,
        language: language === 'auto' ? undefined : language,
      })
      if (ai.ok) {
        const section = (value: Partial<ReviewResult>['security']) => ({
          score: Number(value?.score ?? 0),
          issues: Array.isArray(value?.issues) ? value.issues : [],
          suggestions: Array.isArray(value?.suggestions) ? value.suggestions : [],
        })
        setReview({
          security: section(ai.data.security),
          performance: section(ai.data.performance),
          readability: section(ai.data.readability),
          overall: typeof ai.data.overall === 'string' ? ai.data.overall : '',
        })
      } else {
        setError(ai.error)
      }
    } catch (e) {
      setError('网络错误：' + (e as Error).message)
    } finally {
      setLoading(false)
    }
  }

  const exampleCode = `function getUserData(userId) {
  const query = "SELECT * FROM users WHERE id = " + userId;
  return db.execute(query);
}`

  const reset = () => {
    setCode('')
    setReview(null)
    setError('')
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-400'
    if (score >= 60) return 'text-yellow-400'
    return 'text-red-400'
  }

  const getScoreBg = (score: number) => {
    if (score >= 80) return 'bg-green-400/10 border-green-400/30'
    if (score >= 60) return 'bg-yellow-400/10 border-yellow-400/30'
    return 'bg-red-400/10 border-red-400/30'
  }

  return (
    <ToolLayout meta={meta} onReset={reset}>
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-3 flex-wrap">
            <label className="text-xs font-medium text-text-muted uppercase tracking-wider">代码</label>
            <select
              className="text-xs bg-bg-raised border border-border-base rounded-md px-2 py-1 text-text-secondary"
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
            >
              {LANGUAGES.map((l) => (
                <option key={l} value={l}>{LANG_LABELS[l]}</option>
              ))}
            </select>
            <span className={`text-xs ml-auto ${code.length > 3600 ? 'text-amber-400' : 'text-text-muted'}`}>
              {code.length} / 4000
            </span>
          </div>
          <textarea
            className="tool-input font-mono text-sm h-48 resize-none"
            placeholder="粘贴要进行 Code Review 的代码..."
            value={code}
            onChange={(e) => setCode(e.target.value)}
            spellCheck={false}
          />
          <div className="flex items-center gap-2">
            <button
              onClick={doReview}
              disabled={loading || !code.trim()}
              className="btn-primary gap-2"
            >
              <Sparkles className="w-4 h-4" />
              {loading ? 'AI 分析中...' : '开始 Review'}
            </button>
            <button
              onClick={() => { setCode(exampleCode); setLanguage('javascript') }}
              className="btn-ghost text-xs"
            >
              载入示例
            </button>
          </div>
        </div>

        {error && (
          <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 flex gap-2 text-xs text-rose-400">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            {error}
          </div>
        )}

        {loading && (
          <div className="flex items-center gap-3 p-4 bg-bg-surface rounded-lg border border-border-base">
            <div className="w-4 h-4 border-2 border-accent border-t-transparent rounded-full animate-spin" />
            <span className="text-sm text-text-muted">AI 正在进行代码审查...</span>
          </div>
        )}

        {review && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <ScoreCard
                icon={<Shield className="w-5 h-5" />}
                title="安全性"
                score={review.security.score}
                issues={review.security.issues}
                suggestions={review.security.suggestions}
                getScoreColor={getScoreColor}
                getScoreBg={getScoreBg}
              />
              <ScoreCard
                icon={<Zap className="w-5 h-5" />}
                title="性能"
                score={review.performance.score}
                issues={review.performance.issues}
                suggestions={review.performance.suggestions}
                getScoreColor={getScoreColor}
                getScoreBg={getScoreBg}
              />
              <ScoreCard
                icon={<BookOpen className="w-5 h-5" />}
                title="可读性"
                score={review.readability.score}
                issues={review.readability.issues}
                suggestions={review.readability.suggestions}
                getScoreColor={getScoreColor}
                getScoreBg={getScoreBg}
              />
            </div>

            <div className="bg-bg-surface rounded-lg border border-border-base p-4">
              <p className="text-xs font-medium text-text-muted uppercase tracking-wider mb-3">综合评价</p>
              <div className="text-sm text-text-primary leading-relaxed whitespace-pre-wrap">
                {review.overall}
              </div>
            </div>
          </div>
        )}
      </div>
    </ToolLayout>
  )
}

function ScoreCard({
  icon,
  title,
  score,
  issues,
  suggestions,
  getScoreColor,
  getScoreBg,
}: {
  icon: React.ReactNode
  title: string
  score: number
  issues: string[]
  suggestions: string[]
  getScoreColor: (score: number) => string
  getScoreBg: (score: number) => string
}) {
  return (
    <div className={`rounded-lg border p-4 ${getScoreBg(score)}`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2 text-text-secondary">
          {icon}
          <span className="text-sm font-medium">{title}</span>
        </div>
        <span className={`text-2xl font-bold ${getScoreColor(score)}`}>{score}</span>
      </div>

      {issues.length > 0 && (
        <div className="mb-3">
          <div className="flex items-center gap-1 text-xs text-red-400 mb-2">
            <XCircle className="w-3 h-3" />
            <span>问题</span>
          </div>
          <ul className="space-y-1">
            {issues.map((issue, i) => (
              <li key={i} className="text-xs text-text-secondary pl-4 relative before:content-['•'] before:absolute before:left-0 before:text-text-muted">
                {issue}
              </li>
            ))}
          </ul>
        </div>
      )}

      {suggestions.length > 0 && (
        <div>
          <div className="flex items-center gap-1 text-xs text-green-400 mb-2">
            <CheckCircle className="w-3 h-3" />
            <span>建议</span>
          </div>
          <ul className="space-y-1">
            {suggestions.map((suggestion, i) => (
              <li key={i} className="text-xs text-text-secondary pl-4 relative before:content-['•'] before:absolute before:left-0 before:text-text-muted">
                {suggestion}
              </li>
            ))}
          </ul>
        </div>
      )}

      {issues.length === 0 && suggestions.length === 0 && (
        <div className="flex items-center gap-1 text-xs text-text-muted">
          <AlertTriangle className="w-3 h-3" />
          <span>暂无分析结果</span>
        </div>
      )}
    </div>
  )
}
