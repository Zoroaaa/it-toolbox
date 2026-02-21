import { useState, useCallback } from 'react'
import { Maximize2, Minimize2, CheckCircle } from 'lucide-react'
import { format as formatSql } from 'sql-formatter'
import { ToolLayout } from '@/components/tool/ToolLayout'
import { meta } from './meta'
import { useAppStore } from '@/store/app'

type SqlLanguage = 'sql' | 'mysql' | 'postgresql' | 'mariadb' | 'sqlite' | 'transactsql'

const LANGUAGE_OPTIONS: { value: SqlLanguage; label: string }[] = [
  { value: 'sql', label: '标准 SQL' },
  { value: 'mysql', label: 'MySQL' },
  { value: 'postgresql', label: 'PostgreSQL' },
  { value: 'mariadb', label: 'MariaDB' },
  { value: 'sqlite', label: 'SQLite' },
  { value: 'transactsql', label: 'SQL Server' },
]

export default function SqlFormatter() {
  const [input, setInput] = useState('')
  const [output, setOutput] = useState('')
  const [error, setError] = useState('')
  const [language, setLanguage] = useState<SqlLanguage>('sql')
  const { addHistory, addRecentTool } = useAppStore()

  const handleFormat = useCallback(() => {
    setError('')
    if (!input.trim()) {
      setOutput('')
      return
    }
    addRecentTool(meta.id)
    try {
      const formatted = formatSql(input, {
        language,
        tabWidth: 2,
        keywordCase: 'upper',
      })
      setOutput(formatted)
      addHistory(meta.id, input)
    } catch (e) {
      setError((e as Error).message)
      setOutput('')
    }
  }, [input, language, addHistory, addRecentTool])

  const handleMinify = useCallback(() => {
    setError('')
    if (!input.trim()) {
      setOutput('')
      return
    }
    addRecentTool(meta.id)
    try {
      const minified = input
        .replace(/\s+/g, ' ')
        .replace(/\s*([(),])\s*/g, '$1')
        .trim()
      setOutput(minified)
    } catch (e) {
      setError((e as Error).message)
      setOutput('')
    }
  }, [input, addRecentTool])

  const reset = () => {
    setInput('')
    setOutput('')
    setError('')
  }

  return (
    <ToolLayout meta={meta} onReset={reset} outputValue={output}>
      <div className="flex items-center gap-2 mb-4 flex-wrap">
        <button onClick={handleFormat} className="btn-primary">
          <Maximize2 className="w-4 h-4" />
          格式化
        </button>
        <button onClick={handleMinify} className="btn-ghost">
          <Minimize2 className="w-4 h-4" />
          压缩
        </button>

        <div className="ml-auto flex items-center gap-2">
          <span className="text-xs text-text-muted">方言</span>
          <select
            value={language}
            onChange={e => setLanguage(e.target.value as SqlLanguage)}
            className="px-2 py-1 rounded-md bg-bg-raised border border-border-base text-sm text-text-primary focus:outline-none"
          >
            {LANGUAGE_OPTIONS.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 h-[calc(100vh-16rem)]">
        <div className="flex flex-col gap-2">
          <label className="text-xs font-medium text-text-muted uppercase tracking-wider">SQL 输入</label>
          <textarea
            className="tool-input flex-1 font-mono text-xs leading-relaxed"
            value={input}
            onChange={e => { setInput(e.target.value); setError('') }}
            placeholder="SELECT * FROM users WHERE id = 1;"
            spellCheck={false}
          />
          <div className="flex items-center justify-between text-xs text-text-muted">
            <span>{input.length} 字符</span>
            <span>{input.split('\n').length} 行</span>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-xs font-medium text-text-muted uppercase tracking-wider">输出</label>
          {error ? (
            <div className="flex-1 rounded-lg bg-rose-500/10 border border-rose-500/30 p-4 flex items-start gap-3">
              <CheckCircle className="w-4 h-4 text-rose-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-rose-500 mb-1">SQL 解析错误</p>
                <p className="text-xs text-rose-400/80 font-mono leading-relaxed">{error}</p>
              </div>
            </div>
          ) : (
            <textarea
              className="tool-input flex-1 font-mono text-xs leading-relaxed"
              value={output}
              readOnly
              placeholder="格式化结果将在这里显示..."
              spellCheck={false}
            />
          )}
          {output && !error && (
            <div className="flex items-center justify-between text-xs text-text-muted">
              <span>{output.length} 字符</span>
              <span>{output.split('\n').length} 行</span>
            </div>
          )}
        </div>
      </div>
    </ToolLayout>
  )
}
