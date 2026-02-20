import { useState } from 'react'
import { ToolLayout } from '@/components/tool/ToolLayout'
import { meta } from './meta'
import { escapeString, unescapeString } from '@it-toolbox/core'

type Language = 'js' | 'python' | 'java' | 'c' | 'json'

const LANGUAGES: { value: Language; label: string }[] = [
  { value: 'js', label: 'JavaScript' },
  { value: 'python', label: 'Python' },
  { value: 'java', label: 'Java' },
  { value: 'c', label: 'C/C++' },
  { value: 'json', label: 'JSON' },
]

export default function StringEscape() {
  const [input, setInput] = useState('')
  const [output, setOutput] = useState('')
  const [mode, setMode] = useState<'escape' | 'unescape'>('escape')
  const [language, setLanguage] = useState<Language>('js')
  const [error, setError] = useState('')

  const handleEscape = () => {
    if (!input.trim()) {
      setOutput('')
      setError('')
      return
    }

    const result = escapeString(input, language)
    if (result.ok) {
      setOutput(result.value)
      setError('')
    } else {
      setError(result.error)
      setOutput('')
    }
  }

  const handleUnescape = () => {
    if (!input.trim()) {
      setOutput('')
      setError('')
      return
    }

    const result = unescapeString(input)
    if (result.ok) {
      setOutput(result.value)
      setError('')
    } else {
      setError(result.error)
      setOutput('')
    }
  }

  const handleTransform = () => {
    if (mode === 'escape') {
      handleEscape()
    } else {
      handleUnescape()
    }
  }

  const reset = () => {
    setInput('')
    setOutput('')
    setError('')
  }

  return (
    <ToolLayout meta={meta} onReset={reset} outputValue={output}>
      <div className="space-y-4">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-1 bg-bg-raised rounded-lg p-1">
            {(['escape', 'unescape'] as const).map((m) => (
              <button
                key={m}
                onClick={() => {
                  setMode(m)
                  setOutput('')
                  setError('')
                }}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                  mode === m
                    ? 'bg-accent text-bg-base'
                    : 'text-text-muted hover:text-text-primary'
                }`}
              >
                {m === 'escape' ? '转义' : '反转义'}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <label className="text-xs text-text-muted">语言:</label>
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value as Language)}
              disabled={mode === 'unescape'}
              className="px-3 py-1.5 bg-bg-raised border border-border-base rounded-lg text-sm text-text-primary focus:outline-none focus:border-accent disabled:opacity-50"
            >
              {LANGUAGES.map((lang) => (
                <option key={lang.value} value={lang.value}>
                  {lang.label}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={handleTransform}
            disabled={!input.trim()}
            className="btn-primary"
          >
            {mode === 'escape' ? '转义' : '反转义'}
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="flex flex-col gap-2">
            <label className="text-xs font-medium text-text-muted uppercase tracking-wider">
              输入
            </label>
            <textarea
              className="tool-input flex-1 font-mono text-xs leading-relaxed min-h-[300px]"
              value={input}
              onChange={(e) => {
                setInput(e.target.value)
                setError('')
              }}
              placeholder={mode === 'escape' ? '输入要转义的字符串...' : '输入要反转义的字符串...'}
              spellCheck={false}
            />
            <div className="text-xs text-text-muted">{input.length} 字符</div>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-xs font-medium text-text-muted uppercase tracking-wider">
              输出
            </label>
            {error ? (
              <div className="flex-1 rounded-lg bg-rose-500/10 border border-rose-500/30 p-4 min-h-[300px]">
                <p className="text-xs text-rose-400/80">{error}</p>
              </div>
            ) : (
              <textarea
                className="tool-input flex-1 font-mono text-xs leading-relaxed min-h-[300px]"
                value={output}
                readOnly
                placeholder="结果将在这里显示..."
                spellCheck={false}
              />
            )}
            {output && !error && (
              <div className="text-xs text-text-muted">{output.length} 字符</div>
            )}
          </div>
        </div>
      </div>
    </ToolLayout>
  )
}
