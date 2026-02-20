import { useState, useCallback } from 'react'
import { Maximize2, Minimize2, CheckCircle, XCircle, AlertCircle } from 'lucide-react'
import { ToolLayout } from '@/components/tool/ToolLayout'
import { formatJson, minifyJson, validateJson } from '@core/index'
import { useAppStore } from '@/store/app'
import { meta } from './meta'

type IndentSize = 2 | 4

export default function JsonFormatter() {
  const [input, setInput] = useState('')
  const [output, setOutput] = useState('')
  const [error, setError] = useState('')
  const [indent, setIndent] = useState<IndentSize>(2)
  const [status, setStatus] = useState<'idle' | 'valid' | 'invalid'>('idle')
  const { addHistory, addRecentTool } = useAppStore()

  const runFormat = useCallback(() => {
    if (!input.trim()) return
    addRecentTool(meta.id)
    const result = formatJson(input, indent)
    if (result.ok) {
      setOutput(result.value)
      setError('')
      setStatus('valid')
      addHistory(meta.id, input)
    } else {
      setError(result.error)
      setStatus('invalid')
    }
  }, [input, indent, addHistory, addRecentTool])

  const runMinify = useCallback(() => {
    if (!input.trim()) return
    const result = minifyJson(input)
    if (result.ok) {
      setOutput(result.value)
      setError('')
      setStatus('valid')
    } else {
      setError(result.error)
      setStatus('invalid')
    }
  }, [input])

  const runValidate = useCallback(() => {
    if (!input.trim()) return
    const result = validateJson(input)
    if (result.ok) {
      setError('')
      setStatus('valid')
      setOutput(`✓ 有效的 JSON ${result.value.type}`)
    } else {
      setError(result.error)
      setStatus('invalid')
    }
  }, [input])

  const reset = () => {
    setInput('')
    setOutput('')
    setError('')
    setStatus('idle')
  }

  const statusIcon = {
    idle: null,
    valid: <CheckCircle className="w-4 h-4 text-accent" />,
    invalid: <XCircle className="w-4 h-4 text-rose-500" />,
  }[status]

  return (
    <ToolLayout meta={meta} onReset={reset} outputValue={output}>
      {/* Toolbar */}
      <div className="flex items-center gap-2 mb-4 flex-wrap">
        <button onClick={runFormat} className="btn-primary">
          <Maximize2 className="w-4 h-4" />
          格式化
        </button>
        <button onClick={runMinify} className="btn-ghost">
          <Minimize2 className="w-4 h-4" />
          压缩
        </button>
        <button onClick={runValidate} className="btn-ghost">
          <CheckCircle className="w-4 h-4" />
          校验
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
          {statusIcon && (
            <div className="flex items-center gap-1.5 ml-2">
              {statusIcon}
              <span className={`text-xs ${status === 'valid' ? 'text-accent' : 'text-rose-500'}`}>
                {status === 'valid' ? '有效' : '无效'}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Editor area */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 h-[calc(100vh-16rem)]">
        {/* Input */}
        <div className="flex flex-col gap-2">
          <label className="text-xs font-medium text-text-muted uppercase tracking-wider">输入</label>
          <textarea
            className="tool-input flex-1 font-mono text-xs leading-relaxed"
            value={input}
            onChange={e => { setInput(e.target.value); setStatus('idle') }}
            placeholder={'{\n  "key": "value"\n}'}
            spellCheck={false}
          />
          <div className="flex items-center justify-between text-xs text-text-muted">
            <span>{input.length} 字符</span>
            <span>{input.split('\n').length} 行</span>
          </div>
        </div>

        {/* Output */}
        <div className="flex flex-col gap-2">
          <label className="text-xs font-medium text-text-muted uppercase tracking-wider">输出</label>
          {error ? (
            <div className="flex-1 rounded-lg bg-rose-500/10 border border-rose-500/30 p-4 flex items-start gap-3">
              <AlertCircle className="w-4 h-4 text-rose-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-rose-500 mb-1">JSON 解析错误</p>
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
