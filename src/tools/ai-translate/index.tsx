import { useState } from 'react'
import { Copy, Check, AlertCircle, Sparkles, ArrowRightLeft } from 'lucide-react'
import { ToolLayout } from '@/components/tool/ToolLayout'
import { useClipboard } from '@/hooks/useClipboard'
import { meta } from './meta'
import { callAi } from '@/lib/ai'

interface TranslateResult {
  translation: string
  detectedLanguage?: string
  notes?: string
}

const languages = [
  { code: 'auto', name: '自动检测' },
  { code: 'zh', name: '中文' },
  { code: 'en', name: 'English' },
  { code: 'ja', name: '日本語' },
  { code: 'ko', name: '한국어' },
  { code: 'fr', name: 'Français' },
  { code: 'de', name: 'Deutsch' },
  { code: 'es', name: 'Español' },
  { code: 'ru', name: 'Русский' },
  { code: 'pt', name: 'Português' },
  { code: 'it', name: 'Italiano' },
  { code: 'ar', name: 'العربية' },
]

export default function AiTranslate() {
  const [text, setText] = useState('')
  const [sourceLang, setSourceLang] = useState('auto')
  const [targetLang, setTargetLang] = useState('zh')
  const [result, setResult] = useState<TranslateResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const { copy, copied } = useClipboard()

  const translate = async () => {
    if (!text.trim()) return
    setLoading(true)
    setError('')
    setResult(null)
    try {
      const ai = await callAi<TranslateResult>('translate', { text, sourceLang, targetLang })
      if (ai.ok) setResult(ai.data)
      else setError(ai.error)
    } catch (e) {
      setError('网络错误：' + (e as Error).message)
    } finally {
      setLoading(false)
    }
  }

  const swapLanguages = () => {
    if (sourceLang !== 'auto') {
      const temp = sourceLang
      setSourceLang(targetLang)
      setTargetLang(temp)
    }
  }

  const examples = [
    'Hello, world! This is a test.',
    'The quick brown fox jumps over the lazy dog.',
    'console.log("Hello, World!");',
    'Machine learning is a subset of artificial intelligence.',
  ]

  return (
    <ToolLayout meta={meta} onReset={() => { setText(''); setResult(null); setError('') }}>
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-2">
          <select
            className="tool-input flex-1"
            value={sourceLang}
            onChange={e => setSourceLang(e.target.value)}
          >
            {languages.map(lang => (
              <option key={lang.code} value={lang.code}>{lang.name}</option>
            ))}
          </select>
          <button
            onClick={swapLanguages}
            className="p-2 rounded-lg bg-bg-raised border border-border-base hover:bg-bg-surface transition-colors"
            title="交换语言"
          >
            <ArrowRightLeft className="w-4 h-4 text-text-muted" />
          </button>
          <select
            className="tool-input flex-1"
            value={targetLang}
            onChange={e => setTargetLang(e.target.value)}
          >
            {languages.filter(l => l.code !== 'auto').map(lang => (
              <option key={lang.code} value={lang.code}>{lang.name}</option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-xs font-medium text-text-muted uppercase tracking-wider">输入文本</label>
          <textarea
            className="tool-input font-mono text-sm h-32 resize-none"
            placeholder="输入需要翻译的文本..."
            value={text}
            onChange={e => setText(e.target.value)}
            spellCheck={false}
          />
          <div className="flex flex-wrap gap-1.5">
            {examples.map(ex => (
              <button
                key={ex}
                onClick={() => setText(ex)}
                className="px-2 py-1 text-xs rounded-md bg-bg-raised text-text-muted hover:text-text-primary hover:bg-bg-surface border border-border-base transition-colors"
              >
                {ex.slice(0, 20)}...
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={translate}
          disabled={loading || !text.trim()}
          className="btn-primary gap-2"
        >
          <Sparkles className="w-4 h-4" />
          {loading ? '翻译中...' : 'AI 翻译'}
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
                <span className="text-xs font-medium text-text-muted uppercase tracking-wider">
                  翻译结果
                  {result.detectedLanguage && (
                    <span className="ml-2 text-accent">（检测到：{result.detectedLanguage}）</span>
                  )}
                </span>
                <button onClick={() => copy(result.translation)} className="btn-ghost text-xs gap-1">
                  {copied ? <Check className="w-3.5 h-3.5 text-accent" /> : <Copy className="w-3.5 h-3.5" />}
                  复制
                </button>
              </div>
              <div className="text-sm text-text-primary leading-relaxed whitespace-pre-wrap">
                {result.translation}
              </div>
              {result.notes && (
                <div className="text-xs text-text-secondary leading-relaxed border-t border-border-base pt-3">
                  <span className="font-medium text-text-primary">备注：</span>
                  {result.notes}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </ToolLayout>
  )
}
