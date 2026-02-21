import { useState, useCallback } from 'react'
import { ToolLayout } from '@/components/tool/ToolLayout'
import { meta } from './meta'
import { useAppStore } from '@/store/app'

type Mode = 'format' | 'minify'

function formatJs(code: string, indent: number = 2): string {
  const indentStr = ' '.repeat(indent)
  
  // Tokenize the code into meaningful chunks
  const tokens: string[] = []
  let i = 0
  
  while (i < code.length) {
    // Template literals
    if (code[i] === '`') {
      let tok = '`'; i++
      let depth = 0
      while (i < code.length) {
        if (code[i] === '\\') { tok += code[i] + code[i+1]; i += 2; continue }
        if (code[i] === '$' && code[i+1] === '{') { depth++; tok += '${'; i += 2; continue }
        if (code[i] === '}' && depth > 0) { depth--; tok += '}'; i++; continue }
        if (code[i] === '`' && depth === 0) { tok += '`'; i++; break }
        tok += code[i++]
      }
      tokens.push(tok); continue
    }
    // String literals
    if (code[i] === '"' || code[i] === "'") {
      const q = code[i]; let tok = q; i++
      while (i < code.length && code[i] !== q) {
        if (code[i] === '\\') { tok += code[i] + code[i+1]; i += 2; continue }
        tok += code[i++]
      }
      tok += code[i++] || ''
      tokens.push(tok); continue
    }
    // Line comment
    if (code[i] === '/' && code[i+1] === '/') {
      let tok = ''
      while (i < code.length && code[i] !== '\n') tok += code[i++]
      tokens.push(tok); continue
    }
    // Block comment
    if (code[i] === '/' && code[i+1] === '*') {
      let tok = '/*'; i += 2
      while (i < code.length && !(code[i] === '*' && code[i+1] === '/')) tok += code[i++]
      tok += '*/'; i += 2
      tokens.push(tok); continue
    }
    // Regex literal (basic detection: after = ( , [ ! & | ? : return)
    if (code[i] === '/') {
      const prev = tokens.filter(t => t.trim()).at(-1) ?? ''
      const lastChar = prev.trim().slice(-1)
      if ('=([,!&|?:'.includes(lastChar) || prev.trim() === 'return' || prev.trim() === 'typeof') {
        let tok = '/'; i++
        while (i < code.length && code[i] !== '/' && code[i] !== '\n') {
          if (code[i] === '\\') { tok += code[i] + code[i+1]; i += 2; continue }
          tok += code[i++]
        }
        tok += code[i++] || ''
        // flags
        while (i < code.length && /[gimsuy]/.test(code[i])) tok += code[i++]
        tokens.push(tok); continue
      }
    }
    // Whitespace/newlines - collapse
    if (/\s/.test(code[i])) {
      while (i < code.length && /\s/.test(code[i])) i++
      tokens.push(' '); continue
    }
    tokens.push(code[i++])
  }
  
  // Now reconstruct with proper formatting
  let result = ''
  let level = 0
  let lineStart = true
  const toks = tokens.filter(t => t !== ' ' || !lineStart)
  
  const writeIndent = () => { result += indentStr.repeat(level) }
  const writeln = () => { result += '\n'; lineStart = true }
  
  for (let idx = 0; idx < toks.length; idx++) {
    const tok = toks[idx]
    const next = toks[idx + 1] ?? ''
    
    if (tok === ' ') {
      if (!lineStart && result.slice(-1) !== ' ') result += ' '
      continue
    }
    
    if (tok === '{' || tok === '[' || tok === '(') {
      if (lineStart) writeIndent()
      result += tok
      lineStart = false
      // Check if closing is on same line (inline objects/arrays)
      let depth = 1, j = idx + 1
      while (j < toks.length && depth > 0) {
        const t = toks[j].trim()
        if (t === tok || t === '{' || t === '[' || t === '(') depth++
        if (t === '}' || t === ']' || t === ')') depth--
        j++
      }
      // If closing bracket is right next or only whitespace between, keep inline
      const inner = toks.slice(idx + 1, j - 1).join('').trim()
      if (!inner || (inner.length < 60 && !inner.includes('\n') && !inner.includes('{'))) {
        continue // keep inline
      }
      level++; writeln()
      continue
    }
    
    if (tok === '}' || tok === ']' || tok === ')') {
      if (level > 0) level--
      if (!lineStart) { writeln(); writeIndent() }
      else writeIndent()
      result += tok
      lineStart = false
      if (next === ';' || next === ',' || next === ')' || next === ']' || next === '}') continue
      if (next === '{') { result += ' '; continue }
      if (next && next !== ' ' && !next.startsWith('//')) writeln()
      continue
    }
    
    if (tok === ';') {
      result += ';'
      lineStart = false
      if (next && next !== '}' && next !== ')') writeln()
      continue
    }
    
    if (tok === ',') {
      result += ','
      lineStart = false
      // Check if we're in a multi-line context
      if (level > 0) writeln()
      else result += ' '
      continue
    }
    
    if (tok.startsWith('//') || tok.startsWith('/*')) {
      if (lineStart) writeIndent()
      else result += ' '
      result += tok
      lineStart = false
      if (tok.startsWith('//')) writeln()
      continue
    }
    
    if (lineStart) { writeIndent(); lineStart = false }
    else if (result.slice(-1) !== ' ' && result.slice(-1) !== '(' && result.slice(-1) !== '[') {
      // Add space between tokens where needed
      const prev = result.slice(-1)
      if (prev !== '.' && tok !== '.' && prev !== '!' && prev !== '~' && tok !== '(' && tok !== '[' && tok !== ')' && tok !== ']' && tok !== ';' && tok !== ',') {
        // keywords and operators need spaces
        if (/[a-zA-Z0-9_$]/.test(prev) && /[a-zA-Z0-9_$]/.test(tok[0])) result += ' '
        else if (/[=+\-*/<>!&|^%?:]/.test(prev) || /^[=+\-*/<>!&|^%?:]/.test(tok)) result += ' '
      }
    }
    
    result += tok
  }
  
  return result.trim()
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
