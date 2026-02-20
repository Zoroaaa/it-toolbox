import { useState } from 'react'
import { ToolLayout } from '@/components/tool/ToolLayout'
import { meta } from './meta'
import { formatXml, minifyXml } from '@it-toolbox/core'

export default function XmlFormatter() {
  const [input, setInput] = useState('')
  const [output, setOutput] = useState('')
  const [error, setError] = useState('')
  const [indent, setIndent] = useState(2)

  const handleFormat = () => {
    setError('')
    if (!input.trim()) {
      setOutput('')
      return
    }

    const result = formatXml(input, indent)
    if (result.ok) {
      setOutput(result.value)
    } else {
      setError(result.error)
      setOutput('')
    }
  }

  const handleMinify = () => {
    setError('')
    if (!input.trim()) {
      setOutput('')
      return
    }

    const result = minifyXml(input)
    if (result.ok) {
      setOutput(result.value)
    } else {
      setError(result.error)
      setOutput('')
    }
  }

  return (
    <ToolLayout meta={meta}>
      <div className="space-y-4">
        <div className="flex items-center gap-4">
          <label className="text-sm text-text-secondary">缩进空格:</label>
          <select
            value={indent}
            onChange={(e) => setIndent(Number(e.target.value))}
            className="px-3 py-1.5 bg-bg-secondary border border-border-primary rounded-lg text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-accent-primary"
          >
            <option value={2}>2</option>
            <option value={4}>4</option>
          </select>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">XML 输入</label>
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="输入 XML..."
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
