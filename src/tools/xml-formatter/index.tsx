import { useState, useCallback } from 'react'
import { Maximize2, Minimize2, CheckCircle } from 'lucide-react'
import { ToolLayout } from '@/components/tool/ToolLayout'
import { meta } from './meta'
import { formatXml, minifyXml } from '@it-toolbox/core'
import { useAppStore } from '@/store/app'

type IndentSize = 2 | 4

export default function XmlFormatter() {
  const [input, setInput] = useState('')
  const [output, setOutput] = useState('')
  const [error, setError] = useState('')
  const [indent, setIndent] = useState<IndentSize>(2)
  const { addHistory, addRecentTool } = useAppStore()

  const handleFormat = useCallback(() => {
    setError('')
    if (!input.trim()) {
      setOutput('')
      return
    }
    addRecentTool(meta.id)
    const result = formatXml(input, indent)
    if (result.ok) {
      setOutput(result.value)
      addHistory(meta.id, input)
    } else {
      setError(result.error)
      setOutput('')
    }
  }, [input, indent, addHistory, addRecentTool])

  const handleMinify = useCallback(() => {
    setError('')
    if (!input.trim()) {
      setOutput('')
      return
    }
    addRecentTool(meta.id)
    const result = minifyXml(input)
    if (result.ok) {
      setOutput(result.value)
    } else {
      setError(result.error)
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
          <span className="text-xs text-text-muted">缩进</span>
          {([2, 4] as IndentSize[]).map(n => (
            <button
              key={n}
              onClick={() => setIndent(n)}
              className={`px-2.5 py-1 rounded text-xs font-mono transition-colors duration-100
                ${indent === n
                  ? 'bg-accent/15 text-accent border border-accent/30'
                  : 'text-text-muted hover:text-text-primary border border-border-base hover:border-border-strong'
                }`}
            >
              {n}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 h-[calc(100vh-16rem)]">
        <div className="flex flex-col gap-2">
          <label className="text-xs font-medium text-text-muted uppercase tracking-wider">XML 输入</label>
          <textarea
            className="tool-input flex-1 font-mono text-xs leading-relaxed"
            value={input}
            onChange={e => { setInput(e.target.value); setError('') }}
            placeholder={'<root>\n  <element>value</element>\n</root>'}
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
                <p className="text-sm font-medium text-rose-500 mb-1">XML 解析错误</p>
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
