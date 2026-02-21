import { useState, useCallback } from 'react'
import { ArrowRightLeft } from 'lucide-react'
import { ToolLayout } from '@/components/tool/ToolLayout'
import { meta } from './meta'
import { useAppStore } from '@/store/app'

type Mode = 'toml-to-json' | 'json-to-toml'

// ─── Full-featured TOML v1.0 Parser ─────────────────────────────────────────

class TomlParser {
  private src: string
  private pos: number

  constructor(src: string) {
    this.src = src
    this.pos = 0
  }

  private get done() { return this.pos >= this.src.length }
  private peek() { return this.src[this.pos] }
  private advance() { return this.src[this.pos++] }

  private skipWhitespace() {
    while (!this.done && (this.peek() === ' ' || this.peek() === '\\t')) this.advance()
  }

  private skipWhitespaceAndNewlines() {
    while (!this.done && /[ \\t\\r\\n]/.test(this.peek())) this.advance()
  }

  private skipComment() {
    if (this.peek() === '#') {
      while (!this.done && this.peek() !== '\\n') this.advance()
    }
  }

  private skipLineEnd() {
    this.skipWhitespace()
    this.skipComment()
    if (!this.done && (this.peek() === '\\r' || this.peek() === '\\n')) {
      if (this.peek() === '\\r') this.advance()
      if (!this.done && this.peek() === '\\n') this.advance()
    }
  }

  private parseKey(): string[] {
    const keys: string[] = []
    keys.push(this.parseSimpleKey())
    while (!this.done && this.peek() === '.') {
      this.advance()
      this.skipWhitespace()
      keys.push(this.parseSimpleKey())
    }
    return keys
  }

  private parseSimpleKey(): string {
    this.skipWhitespace()
    if (this.peek() === '"') return this.parseBasicString()
    if (this.peek() === "'") return this.parseLiteralString()
    // bare key
    let key = ''
    while (!this.done && /[a-zA-Z0-9_-]/.test(this.peek())) key += this.advance()
    if (!key) throw new Error(`Invalid key at position ${this.pos}`)
    return key
  }

  private parseBasicString(): string {
    this.advance() // opening "
    // Check for triple-quote
    if (this.src.startsWith('""', this.pos)) {
      this.pos += 2
      return this.parseMultilineBasicString()
    }
    let s = ''
    while (!this.done && this.peek() !== '"') {
      if (this.peek() === '\\\\') {
        this.advance()
        const esc = this.advance()
        switch (esc) {
          case 'b': s += '\\b'; break
          case 't': s += '\\t'; break
          case 'n': s += '\\n'; break
          case 'f': s += '\\f'; break
          case 'r': s += '\\r'; break
          case '"': s += '"'; break
          case '\\\\': s += '\\\\'; break
          case 'u': s += String.fromCodePoint(parseInt(this.src.slice(this.pos, this.pos + 4), 16)); this.pos += 4; break
          case 'U': s += String.fromCodePoint(parseInt(this.src.slice(this.pos, this.pos + 8), 16)); this.pos += 8; break
          default: throw new Error(`Invalid escape \\\\${esc}`)
        }
      } else {
        s += this.advance()
      }
    }
    if (this.done) throw new Error('Unterminated string')
    this.advance() // closing "
    return s
  }

  private parseMultilineBasicString(): string {
    // Skip optional first newline
    if (!this.done && this.peek() === '\\n') this.advance()
    else if (!this.done && this.peek() === '\\r' && this.src[this.pos + 1] === '\\n') this.pos += 2
    let s = ''
    while (!this.done) {
      if (this.src.startsWith('"""', this.pos)) { this.pos += 3; return s }
      if (this.peek() === '\\\\') {
        this.advance()
        if (this.peek() === '\\n' || this.peek() === '\\r' || this.peek() === ' ' || this.peek() === '\\t') {
          // line ending backslash - skip whitespace/newlines
          while (!this.done && /[ \\t\\r\\n]/.test(this.peek())) this.advance()
          continue
        }
        const esc = this.advance()
        switch (esc) {
          case 'n': s += '\\n'; break
          case 't': s += '\\t'; break
          case '"': s += '"'; break
          case '\\\\': s += '\\\\'; break
          default: s += esc
        }
      } else {
        s += this.advance()
      }
    }
    throw new Error('Unterminated multiline string')
  }

  private parseLiteralString(): string {
    this.advance() // opening '
    if (this.src.startsWith("''", this.pos)) {
      this.pos += 2
      return this.parseMultilineLiteralString()
    }
    let s = ''
    while (!this.done && this.peek() !== "'") s += this.advance()
    if (this.done) throw new Error('Unterminated literal string')
    this.advance()
    return s
  }

  private parseMultilineLiteralString(): string {
    if (!this.done && this.peek() === '\\n') this.advance()
    else if (!this.done && this.peek() === '\\r' && this.src[this.pos + 1] === '\\n') this.pos += 2
    let s = ''
    while (!this.done) {
      if (this.src.startsWith("'''", this.pos)) { this.pos += 3; return s }
      s += this.advance()
    }
    throw new Error('Unterminated multiline literal string')
  }

  private parseValue(): unknown {
    this.skipWhitespace()
    const ch = this.peek()

    if (ch === '"') return this.parseBasicString()
    if (ch === "'") return this.parseLiteralString()
    if (ch === '[') return this.parseArray()
    if (ch === '{') return this.parseInlineTable()

    // Boolean
    if (this.src.startsWith('true', this.pos) && !/[a-zA-Z0-9_-]/.test(this.src[this.pos + 4] ?? '')) { this.pos += 4; return true }
    if (this.src.startsWith('false', this.pos) && !/[a-zA-Z0-9_-]/.test(this.src[this.pos + 5] ?? '')) { this.pos += 5; return false }

    // Numbers and dates - collect the token
    let tok = ''
    while (!this.done && /[-0-9a-zA-Z_.:+TZ]/.test(this.peek())) tok += this.advance()

    if (!tok) throw new Error(`Unexpected character '${ch}' at position ${this.pos}`)

    // Date/DateTime detection (contains T or - between digits)
    if (/^\\d{4}-\\d{2}-\\d{2}/.test(tok)) {
      const d = new Date(tok)
      return isNaN(d.getTime()) ? tok : d.toISOString()
    }

    // Float
    if (/[._]/.test(tok) || tok === 'inf' || tok === '-inf' || tok === '+inf' || tok === 'nan') {
      if (tok === 'inf' || tok === '+inf') return Infinity
      if (tok === '-inf') return -Infinity
      if (tok === 'nan') return NaN
      return parseFloat(tok.replace(/_/g, ''))
    }

    // Integer (hex, octal, binary, decimal)
    if (tok.startsWith('0x')) return parseInt(tok.slice(2), 16)
    if (tok.startsWith('0o')) return parseInt(tok.slice(2), 8)
    if (tok.startsWith('0b')) return parseInt(tok.slice(2), 2)

    const n = parseInt(tok.replace(/_/g, ''), 10)
    if (!isNaN(n)) return n

    throw new Error(`Cannot parse value: ${tok}`)
  }

  private parseArray(): unknown[] {
    this.advance() // [
    const arr: unknown[] = []
    this.skipWhitespaceAndNewlines()
    while (!this.done && this.peek() !== ']') {
      this.skipComment()
      this.skipWhitespaceAndNewlines()
      if (this.peek() === ']') break
      arr.push(this.parseValue())
      this.skipWhitespaceAndNewlines()
      this.skipComment()
      this.skipWhitespaceAndNewlines()
      if (this.peek() === ',') { this.advance(); this.skipWhitespaceAndNewlines() }
    }
    if (this.done) throw new Error('Unterminated array')
    this.advance() // ]
    return arr
  }

  private parseInlineTable(): Record<string, unknown> {
    this.advance() // {
    const table: Record<string, unknown> = {}
    this.skipWhitespace()
    while (!this.done && this.peek() !== '}') {
      const keys = this.parseKey()
      this.skipWhitespace()
      if (this.advance() !== '=') throw new Error('Expected = in inline table')
      const val = this.parseValue()
      setNested(table, keys, val)
      this.skipWhitespace()
      if (this.peek() === ',') { this.advance(); this.skipWhitespace() }
    }
    if (this.done) throw new Error('Unterminated inline table')
    this.advance() // }
    return table
  }

  parse(): Record<string, unknown> {
    const root: Record<string, unknown> = {}
    let current = root
    let currentPath: string[] = []

    while (!this.done) {
      this.skipWhitespace()
      if (this.done) break
      const ch = this.peek()

      // Comment or blank line
      if (ch === '#' || ch === '\\n' || ch === '\\r') {
        this.skipComment()
        if (!this.done && (this.peek() === '\\n' || this.peek() === '\\r')) {
          if (this.peek() === '\\r') this.advance()
          if (!this.done && this.peek() === '\\n') this.advance()
        }
        continue
      }

      // Array of tables [[...]]
      if (ch === '[' && this.src[this.pos + 1] === '[') {
        this.pos += 2
        const keys = this.parseKey()
        if (this.advance() !== ']' || this.advance() !== ']') throw new Error('Expected ]] to close array of tables')
        this.skipLineEnd()
        currentPath = keys
        // Navigate to the array
        let node = root
        for (let i = 0; i < keys.length - 1; i++) {
          if (!(keys[i] in node)) node[keys[i]] = {}
          node = node[keys[i]] as Record<string, unknown>
        }
        const last = keys[keys.length - 1]
        if (!(last in node)) node[last] = []
        const arr = node[last] as Record<string, unknown>[]
        const newTable: Record<string, unknown> = {}
        arr.push(newTable)
        current = newTable
        void currentPath
        continue
      }

      // Table header [...]
      if (ch === '[') {
        this.advance()
        const keys = this.parseKey()
        if (this.advance() !== ']') throw new Error('Expected ] to close table header')
        this.skipLineEnd()
        currentPath = keys
        current = root
        for (const key of keys) {
          if (!(key in current)) current[key] = {}
          const next = current[key]
          if (Array.isArray(next)) current = next[next.length - 1] as Record<string, unknown>
          else current = next as Record<string, unknown>
        }
        continue
      }

      // Key-value pair
      const keys = this.parseKey()
      this.skipWhitespace()
      if (this.advance() !== '=') throw new Error(`Expected = after key "${keys.join('.')}"`)
      const val = this.parseValue()
      setNested(current, keys, val)
      this.skipLineEnd()
    }

    return root
  }
}

function setNested(obj: Record<string, unknown>, keys: string[], val: unknown): void {
  let node = obj
  for (let i = 0; i < keys.length - 1; i++) {
    if (!(keys[i] in node)) node[keys[i]] = {}
    const next = node[keys[i]]
    if (Array.isArray(next)) node = next[next.length - 1] as Record<string, unknown>
    else node = next as Record<string, unknown>
  }
  const last = keys[keys.length - 1]
  if (last in node) throw new Error(`Duplicate key: ${keys.join('.')}`)
  node[last] = val
}

export function parseToml(input: string): Record<string, unknown> {
  return new TomlParser(input).parse()
}

function jsonValueToToml(val: unknown, indent: number, path: string): string {
  if (val === null) return 'null' // TOML doesn't have null but we'll handle it gracefully
  if (typeof val === 'boolean') return val ? 'true' : 'false'
  if (typeof val === 'number') return isFinite(val) ? String(val) : (val > 0 ? 'inf' : '-inf')
  if (typeof val === 'string') {
    // Use basic string with escaping
    return '"' + val.replace(/\\\\/g, '\\\\\\\\').replace(/"/g, '\\\\"').replace(/\\n/g, '\\\\n').replace(/\\r/g, '\\\\r').replace(/\\t/g, '\\\\t') + '"'
  }
  if (Array.isArray(val)) {
    // Check if array contains only primitives
    const allPrimitive = val.every(v => typeof v !== 'object' || v === null)
    if (allPrimitive) {
      return '[' + val.map(v => jsonValueToToml(v, 0, '')).join(', ') + ']'
    }
    // Array of tables - handled at key level
    return '[]' // placeholder, handled separately
  }
  if (typeof val === 'object') {
    return '{' + Object.entries(val as Record<string, unknown>).map(([k, v]) => `${k} = ${jsonValueToToml(v, 0, '')}`).join(', ') + '}'
  }
  return String(val)
}

export function jsonToToml(obj: Record<string, unknown>, _prefix = ''): string {
  const lines: string[] = []
  const tableEntries: [string, Record<string, unknown>][] = []
  const arrayTableEntries: [string, Record<string, unknown>[]][] = []

  for (const [key, val] of Object.entries(obj)) {
    if (Array.isArray(val) && val.length > 0 && typeof val[0] === 'object' && val[0] !== null) {
      arrayTableEntries.push([key, val as Record<string, unknown>[]])
    } else if (typeof val === 'object' && val !== null && !Array.isArray(val)) {
      tableEntries.push([key, val as Record<string, unknown>])
    } else {
      lines.push(`${key} = ${jsonValueToToml(val, 0, key)}`)
    }
  }

  const sections: string[] = []

  for (const [key, tableVal] of tableEntries) {
    const nested: string[] = []
    const subTableEntries: [string, Record<string, unknown>][] = []
    const subArrayTableEntries: [string, Record<string, unknown>[]][] = []

    for (const [k, v] of Object.entries(tableVal)) {
      if (Array.isArray(v) && v.length > 0 && typeof v[0] === 'object' && v[0] !== null) {
        subArrayTableEntries.push([k, v as Record<string, unknown>[]])
      } else if (typeof v === 'object' && v !== null && !Array.isArray(v)) {
        subTableEntries.push([k, v as Record<string, unknown>])
      } else {
        nested.push(`${k} = ${jsonValueToToml(v, 0, k)}`)
      }
    }

    sections.push(`[${key}]\\n${nested.join('\\n')}`)

    for (const [k, tableArr] of subArrayTableEntries) {
      for (const item of tableArr) {
        const itemLines = Object.entries(item).map(([ik, iv]) => `${ik} = ${jsonValueToToml(iv, 0, ik)}`)
        sections.push(`[[${key}.${k}]]\\n${itemLines.join('\\n')}`)
      }
    }

    for (const [k, v] of subTableEntries) {
      const subLines = Object.entries(v).map(([sk, sv]) => `${sk} = ${jsonValueToToml(sv, 0, sk)}`)
      sections.push(`[${key}.${k}]\\n${subLines.join('\\n')}`)
    }
  }

  for (const [key, arr] of arrayTableEntries) {
    for (const item of arr) {
      const itemLines = Object.entries(item).map(([k, v]) => `${k} = ${jsonValueToToml(v, 0, k)}`)
      sections.push(`[[${key}]]\\n${itemLines.join('\\n')}`)
    }
  }

  const result = [lines.join('\\n'), ...sections].filter(Boolean)
  return result.join('\\n\\n')
}


export default function TomlJson() {
  const [input, setInput] = useState('')
  const [output, setOutput] = useState('')
  const [error, setError] = useState('')
  const [mode, setMode] = useState<Mode>('toml-to-json')
  const [isProcessing, setIsProcessing] = useState(false)
  const { addHistory, addRecentTool } = useAppStore()

  const runTransform = useCallback(() => {
    if (!input.trim()) return
    addRecentTool(meta.id)
    setIsProcessing(true)

    try {
      let result: string
      if (mode === 'toml-to-json') {
        const parsed = parseToml(input)
        result = JSON.stringify(parsed, null, 2)
      } else {
        const parsed = JSON.parse(input) as Record<string, unknown>
        result = jsonToToml(parsed)
      }
      setOutput(result)
      setError('')
      addHistory(meta.id, input)
    } catch (e) {
      setError((e as Error).message)
      setOutput('')
    }
    setIsProcessing(false)
  }, [input, mode, addHistory, addRecentTool])

  const reset = () => {
    setInput('')
    setOutput('')
    setError('')
  }

  return (
    <ToolLayout meta={meta} onReset={reset} outputValue={output}>
      <div className="flex items-center gap-2 mb-4 flex-wrap">
        <button onClick={runTransform} disabled={isProcessing} className="btn-primary">
          <ArrowRightLeft className="w-4 h-4" />
          {isProcessing ? '处理中...' : '转换'}
        </button>

        <div className="flex items-center gap-1 bg-bg-raised rounded-lg p-1">
          {(['toml-to-json', 'json-to-toml'] as Mode[]).map((m) => (
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
              {m === 'toml-to-json' ? 'TOML → JSON' : 'JSON → TOML'}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 h-[calc(100vh-16rem)]">
        <div className="flex flex-col gap-2">
          <label className="text-xs font-medium text-text-muted uppercase tracking-wider">
            {mode === 'toml-to-json' ? 'TOML' : 'JSON'}
          </label>
          <textarea
            className="tool-input flex-1 font-mono text-xs leading-relaxed"
            value={input}
            onChange={(e) => {
              setInput(e.target.value)
              setError('')
            }}
            placeholder={mode === 'toml-to-json' ? '输入 TOML...' : '输入 JSON...'}
            spellCheck={false}
          />
          <div className="text-xs text-text-muted">{input.length} 字符</div>
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-xs font-medium text-text-muted uppercase tracking-wider">
            {mode === 'toml-to-json' ? 'JSON' : 'TOML'}
          </label>
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
