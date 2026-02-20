import { useState, useCallback } from 'react'
import { ToolLayout } from '@/components/tool/ToolLayout'
import { meta } from './meta'
import { useAppStore } from '@/store/app'

type Mode = 'format' | 'minify'

function formatJs(code: string, indent: number = 2): string {
  const indentStr = ' '.repeat(indent)
  let result = ''
  let indentLevel = 0
  let inString = false
  let stringChar = ''
  let inComment = false
  let inLineComment = false

  const isNewline = (char: string) => char === '\n'
  const isWhitespace = (char: string) => /\s/.test(char)

  for (let i = 0; i < code.length; i++) {
    const char = code[i]
    const nextChar = code[i + 1] || ''
    const prevChar = code[i - 1] || ''

    if (inLineComment) {
      result += char
      if (isNewline(char)) {
        inLineComment = false
      }
      continue
    }

    if (inComment) {
      result += char
      if (prevChar === '*' && char === '/') {
        inComment = false
      }
      continue
    }

    if (!inString && char === '/' && nextChar === '/') {
      inLineComment = true
      result += char
      continue
    }

    if (!inString && char === '/' && nextChar === '*') {
      inComment = true
      result += char
      continue
    }

    if (!inString && (char === '"' || char === "'" || char === '`')) {
      inString = true
      stringChar = char
      result += char
      continue
    }

    if (inString) {
      result += char
      if (char === stringChar && prevChar !== '\\') {
        inString = false
      }
      continue
    }

    if (char === '{') {
      result += ' {\n' + indentStr.repeat(indentLevel + 1)
      indentLevel++
      continue
    }

    if (char === '}') {
      indentLevel = Math.max(0, indentLevel - 1)
      result = result.trimEnd()
      result += '\n' + indentStr.repeat(indentLevel) + '}\n' + indentStr.repeat(indentLevel)
      continue
    }

    if (char === ';') {
      result += ';\n' + indentStr.repeat(indentLevel)
      continue
    }

    if (char === '\n' || char === '\r') {
      continue
    }

    if (isWhitespace(char) && isWhitespace(prevChar)) {
      continue
    }

    result += char
  }

  return result.trim()
}

function minifyJs(code: string): string {
  let result = code
  result = result.replace(/\/\*[\s\S]*?\*\//g, '')
  result = result.replace(/\/\/.*$/gm, '')
  result = result.replace(/\s+/g, ' ')
  result = result.replace(/\s*([{}();,:<>=+\-*/&|!?.])\s*/g, '$1')
  result = result.trim()
  return result
}

export default function JsFormatter() {
  const [input, setInput] = useState('')
  const [output, setOutput] = useState('')
  const [error, setError] = useState('')
  const [mode, setMode] = useState<Mode>('format')
  const [indent, setIndent] = useState(2)
  const [isProcessing, setIsProcessing] = useState(false)
  const { addHistory, addRecentTool } = useAppStore()

  const runTransform = useCallback(() => {
    if (!input.trim()) return
    addRecentTool(meta.id)
    setIsProcessing(true)

    try {
      const result = mode === 'format' ? formatJs(input, indent) : minifyJs(input)
      setOutput(result)
      setError('')
      addHistory(meta.id, input)
    } catch (e) {
      setError((e as Error).message)
      setOutput('')
    }
    setIsProcessing(false)
  }, [input, mode, indent, addHistory, addRecentTool])

  const reset = () => {
    setInput('')
    setOutput('')
    setError('')
  }

  return (
    <ToolLayout meta={meta} onReset={reset} outputValue={output}>
      <div className="flex items-center gap-2 mb-4 flex-wrap">
        <button onClick={runTransform} disabled={isProcessing} className="btn-primary">
          {isProcessing ? '处理中...' : mode === 'format' ? '格式化' : '压缩'}
        </button>

        <div className="flex items-center gap-1 bg-bg-raised rounded-lg p-1">
          {(['format', 'minify'] as Mode[]).map((m) => (
            <button
              key={m}
              onClick={() => {
                setMode(m)
                setOutput('')
                setError('')
              }}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                mode === m ? 'bg-accent text-bg-base' : 'text-text-muted hover:text-text-primary'
              }`}
            >
              {m === 'format' ? '格式化' : '压缩'}
            </button>
          ))}
        </div>

        {mode === 'format' && (
          <div className="flex items-center gap-2 ml-auto">
            <label className="text-xs text-text-muted">缩进:</label>
            <select
              value={indent}
              onChange={(e) => setIndent(parseInt(e.target.value))}
              className="px-3 py-1.5 bg-bg-raised border border-border-base rounded-lg text-sm text-text-primary"
            >
              <option value={2}>2 空格</option>
              <option value={4}>4 空格</option>
            </select>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 h-[calc(100vh-16rem)]">
        <div className="flex flex-col gap-2">
          <label className="text-xs font-medium text-text-muted uppercase tracking-wider">输入</label>
          <textarea
            className="tool-input flex-1 font-mono text-xs leading-relaxed"
            value={input}
            onChange={(e) => {
              setInput(e.target.value)
              setError('')
            }}
            placeholder="输入 JavaScript/TypeScript 代码..."
            spellCheck={false}
          />
          <div className="text-xs text-text-muted">{input.length} 字符</div>
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-xs font-medium text-text-muted uppercase tracking-wider">输出</label>
          {error ? (
            <div className="flex-1 rounded-lg bg-rose-500/10 border border-rose-500/30 p-4">
              <p className="text-xs text-rose-400/80">{error}</p>
            </div>
          ) : (
            <textarea
              className="tool-input flex-1 font-mono text-xs leading-relaxed"
              value={output}
              readOnly
              placeholder="结果将在这里显示..."
              spellCheck={false}
            />
          )}
          {output && !error && <div className="text-xs text-text-muted">{output.length} 字符</div>}
        </div>
      </div>
    </ToolLayout>
  )
}
