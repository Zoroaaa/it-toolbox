import { useState } from 'react'
import { format as formatSql } from 'sql-formatter'
import { ToolLayout } from '@/components/tool/ToolLayout'
import { meta } from './meta'

export default function SqlFormatter() {
  const [input, setInput] = useState('')
  const [output, setOutput] = useState('')
  const [error, setError] = useState('')
  const [language, setLanguage] = useState('sql')

  const handleFormat = () => {
    setError('')
    if (!input.trim()) {
      setOutput('')
      return
    }

    try {
      const formatted = formatSql(input, {
        language: language as 'sql' | 'mysql' | 'postgresql' | 'mariadb' | 'sqlite' | 'transactsql',
        tabWidth: 2,
        keywordCase: 'upper',
      })
      setOutput(formatted)
    } catch (e) {
      setError((e as Error).message)
      setOutput('')
    }
  }

  const handleMinify = () => {
    setError('')
    if (!input.trim()) {
      setOutput('')
      return
    }

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
  }

  return (
    <ToolLayout meta={meta}>
      <div className="space-y-4">
        <div className="flex items-center gap-4">
          <label className="text-sm text-text-secondary">SQL 方言:</label>
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            className="px-3 py-1.5 bg-bg-secondary border border-border-primary rounded-lg text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-accent-primary"
          >
            <option value="sql">标准 SQL</option>
            <option value="mysql">MySQL</option>
            <option value="postgresql">PostgreSQL</option>
            <option value="mariadb">MariaDB</option>
            <option value="sqlite">SQLite</option>
            <option value="transactsql">SQL Server</option>
          </select>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">SQL 输入</label>
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="输入 SQL 语句..."
              className="w-full h-80 px-3 py-2 bg-bg-secondary border border-border-primary rounded-lg text-text-primary placeholder-text-tertiary focus:outline-none focus:ring-2 focus:ring-accent-primary font-mono text-sm resize-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">输出</label>
            <textarea
              value={output}
              readOnly
              placeholder="格式化结果..."
              className="w-full h-80 px-3 py-2 bg-bg-secondary border border-border-primary rounded-lg text-text-primary placeholder-text-tertiary font-mono text-sm resize-none"
            />
          </div>
        </div>

        {error && (
          <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
            {error}
          </div>
        )}

        <div className="flex gap-2">
          <button
            onClick={handleFormat}
            className="px-4 py-2 bg-accent-primary text-white rounded-lg text-sm font-medium hover:bg-accent-secondary transition-colors"
          >
            格式化
          </button>
          <button
            onClick={handleMinify}
            className="px-4 py-2 bg-accent-primary text-white rounded-lg text-sm font-medium hover:bg-accent-secondary transition-colors"
          >
            压缩
          </button>
          <button
            onClick={() => {
              setInput('')
              setOutput('')
              setError('')
            }}
            className="px-4 py-2 bg-bg-secondary text-text-secondary rounded-lg text-sm font-medium hover:bg-bg-tertiary transition-colors"
          >
            清空
          </button>
          {output && (
            <button
              onClick={() => navigator.clipboard.writeText(output)}
              className="px-4 py-2 bg-bg-secondary text-text-secondary rounded-lg text-sm font-medium hover:bg-bg-tertiary transition-colors"
            >
              复制结果
            </button>
          )}
        </div>
      </div>
    </ToolLayout>
  )
}
