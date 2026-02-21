import { useState, useCallback } from 'react'
import { ToolLayout } from '@/components/tool/ToolLayout'
import { meta } from './meta'
import { useAppStore } from '@/store/app'

type Mode = 'format' | 'minify'

function formatCss(css: string, indent: number = 2): string {
  const indentStr = ' '.repeat(indent)
  
  // Tokenize: strings, comments, and chars
  const tokens: string[] = []
  let i = 0
  while (i < css.length) {
    // Strings
    if (css[i] === '"' || css[i] === "'") {
      const q = css[i]; let tok = q; i++
      while (i < css.length && css[i] !== q) {
        if (css[i] === '\\') { tok += css[i] + css[i+1]; i += 2; continue }
        tok += css[i++]
      }
      tokens.push(tok + (css[i++] || '')); continue
    }
    // Block comment
    if (css[i] === '/' && css[i+1] === '*') {
      let tok = '/*'; i += 2
      while (i < css.length && !(css[i] === '*' && css[i+1] === '/')) tok += css[i++]
      tokens.push(tok + '*/'); i += 2; continue
    }
    // Line comment (SCSS/Less)
    if (css[i] === '/' && css[i+1] === '/') {
      let tok = ''
      while (i < css.length && css[i] !== '\n') tok += css[i++]
      tokens.push(tok); continue
    }
    tokens.push(css[i++])
  }

  let result = ''
  let level = 0
  let inRule = false
  let buf = ''
  
  const flush = () => {
    const trimmed = buf.trim()
    if (trimmed) {
      result += indentStr.repeat(level) + trimmed + '\n'
    }
    buf = ''
  }

  const raw = tokens.join('')
  let pos = 0
  
  while (pos < raw.length) {
    const ch = raw[pos]
    
    if (ch === '{') {
      const selector = buf.trim()
      if (selector) {
        result += indentStr.repeat(level) + selector + ' {\n'
      }
      buf = ''
      level++
      inRule = true
      pos++
      continue
    }
    
    if (ch === '}') {
      flush()
      level = Math.max(0, level - 1)
      result += indentStr.repeat(level) + '}\n'
      if (level === 0) result += '\n'
      inRule = false
      pos++
      continue
    }
    
    if (ch === ';') {
      buf += ';'
      flush()
      pos++
      continue
    }
    
    // Preserve comments
    if (ch === '/' && raw[pos+1] === '*') {
      let comment = ''
      while (pos < raw.length && !(raw[pos] === '*' && raw[pos+1] === '/')) comment += raw[pos++]
      comment += '*/' ; pos += 2
      flush()
      result += indentStr.repeat(level) + comment.trim() + '\n'
      continue
    }
    
    if (ch === '\n' || ch === '\r') {
      if (!inRule) {
        const trimmed = buf.trim()
        if (trimmed && !trimmed.endsWith('{') && !trimmed.endsWith('}')) {
          buf += ' '
        }
      }
      pos++
      continue
    }
    
    buf += ch
    pos++
  }
  
  flush()
  return result.trim()
}

function minifyCss(css: string): string {
  return css
    .replace(/\/\*[\s\S]*?\*\//g, '') // remove comments
    .replace(/\s+/g, ' ')              // collapse whitespace
    .replace(/\s*{\s*/g, '{')
    .replace(/\s*}\s*/g, '}')
    .replace(/\s*;\s*/g, ';')
    .replace(/\s*:\s*/g, ':')
    .replace(/\s*,\s*/g, ',')
    .trim()
}

export default function CssFormatter() {
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
      const result = mode === 'format' ? formatCss(input, indent) : minifyCss(input)
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
          {isProcessing ? '处理中...' : (mode === 'format' ? '格式化' : '压缩')}
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
            placeholder="输入 CSS 代码..."
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
