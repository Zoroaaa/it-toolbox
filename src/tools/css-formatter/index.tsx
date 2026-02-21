import { useState, useCallback } from 'react'
import { Copy, Check, Minimize2, Maximize2 } from 'lucide-react'
import * as prettier from 'prettier/standalone'
import * as postcssPlugin from 'prettier/plugins/postcss'
import { ToolLayout } from '@/components/tool/ToolLayout'
import { useAppStore } from '@/store/app'
import { useClipboard } from '@/hooks/useClipboard'
import { meta } from './meta'

type Mode = 'format' | 'minify'
type Parser = 'css' | 'scss' | 'less'

const PARSER_OPTIONS: { value: Parser; label: string }[] = [
  { value: 'css', label: 'CSS' },
  { value: 'scss', label: 'SCSS' },
  { value: 'less', label: 'Less' },
]

const SAMPLE = `body{background:#fff;color:#333;font-family:sans-serif;margin:0;padding:0}
.container{max-width:1200px;margin:0 auto;padding:0 16px}
.btn{display:inline-flex;align-items:center;gap:8px;padding:8px 16px;border-radius:6px;font-size:14px;font-weight:500;cursor:pointer;transition:all .2s}
.btn-primary{background:#3b82f6;color:#fff;border:none}.btn-primary:hover{background:#2563eb}
@media(max-width:768px){.container{padding:0 12px}.btn{width:100%}}`

export default function CSSFormatter() {
  const [input, setInput] = useState(SAMPLE)
  const [output, setOutput] = useState('')
  const [mode, setMode] = useState<Mode>('format')
  const [parser, setParser] = useState<Parser>('css')
  const [indent, setIndent] = useState(2)
  const [singleQuote, setSingleQuote] = useState(false)
  const [error, setError] = useState('')
  const [processing, setProcessing] = useState(false)
  const { addRecentTool } = useAppStore()
  const { copy, copied } = useClipboard()

  const handleProcess = useCallback(async () => {
    if (!input.trim()) return
    addRecentTool(meta.id)
    setError('')
    setProcessing(true)

    try {
      if (mode === 'minify') {
        // prettier doesn't minify; use a simple minifier
        const minified = input
          .replace(/\/\*[\s\S]*?\*\//g, '')    // remove comments
          .replace(/\s*([{};:,>~+])\s*/g, '$1') // collapse whitespace around punctuation
          .replace(/\s+/g, ' ')                  // collapse remaining spaces
          .replace(/;\}/g, '}')                  // remove last semicolon in block
          .trim()
        setOutput(minified)
      } else {
        const formatted = await prettier.format(input, {
          parser,
          plugins: [postcssPlugin],
          tabWidth: indent,
          useTabs: false,
          singleQuote,
          printWidth: 80,
        })
        setOutput(formatted)
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : '格式化失败，请检查 CSS 语法')
    } finally {
      setProcessing(false)
    }
  }, [input, mode, parser, indent, singleQuote, addRecentTool])

  const reset = () => { setInput(''); setOutput(''); setError('') }

  return (
    <ToolLayout meta={meta} onReset={reset} outputValue={output}>
      <div className="flex flex-col gap-4 h-[calc(100vh-12rem)]">

        {/* Controls */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Mode */}
          <div className="flex rounded-lg overflow-hidden border border-border-base">
            {(['format', 'minify'] as Mode[]).map(m => (
              <button key={m} onClick={() => setMode(m)}
                className={`px-4 py-1.5 text-sm transition-colors ${mode === m ? 'bg-accent text-bg-base' : 'bg-bg-surface text-text-secondary hover:bg-bg-raised'}`}>
                {m === 'format' ? '格式化' : '压缩'}
              </button>
            ))}
          </div>

          {/* Parser */}
          <div className="flex rounded-lg overflow-hidden border border-border-base">
            {PARSER_OPTIONS.map(p => (
              <button key={p.value} onClick={() => setParser(p.value)}
                className={`px-3 py-1.5 text-sm transition-colors ${parser === p.value ? 'bg-accent/10 text-accent' : 'bg-bg-surface text-text-secondary hover:bg-bg-raised'}`}>
                {p.label}
              </button>
            ))}
          </div>

          {mode === 'format' && (
            <>
              <label className="flex items-center gap-2 text-sm text-text-secondary">
                缩进:
                <select value={indent} onChange={e => setIndent(+e.target.value)}
                  className="px-2 py-1 rounded-md bg-bg-raised border border-border-base text-sm text-text-primary focus:outline-none">
                  <option value={2}>2 空格</option>
                  <option value={4}>4 空格</option>
                </select>
              </label>
              <label className="flex items-center gap-2 text-sm text-text-secondary cursor-pointer">
                <input type="checkbox" checked={singleQuote} onChange={e => setSingleQuote(e.target.checked)} />
                单引号
              </label>
            </>
          )}
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 text-red-400 text-sm font-mono whitespace-pre-wrap">{error}</div>
        )}

        <div className="flex-1 grid grid-cols-2 gap-4 min-h-0">
          <div className="flex flex-col gap-2">
            <label className="text-xs font-medium text-text-muted uppercase tracking-wider">输入</label>
            <textarea value={input} onChange={e => { setInput(e.target.value); setOutput('') }}
              placeholder="粘贴 CSS/SCSS/Less 代码..."
              className="flex-1 px-3 py-2.5 rounded-lg bg-bg-surface border border-border-base text-sm font-mono text-text-primary focus:outline-none focus:border-accent resize-none" />
          </div>
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-medium text-text-muted uppercase tracking-wider">输出</label>
              {output && (
                <button onClick={() => copy(output)}
                  className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-bg-raised hover:bg-bg-surface text-xs text-text-secondary transition-colors">
                  {copied ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3" />}复制
                </button>
              )}
            </div>
            <textarea value={output} readOnly placeholder="处理结果将显示在这里..."
              className="flex-1 px-3 py-2.5 rounded-lg bg-bg-surface border border-border-base text-sm font-mono text-text-muted resize-none" />
          </div>
        </div>

        <button onClick={handleProcess} disabled={!input.trim() || processing}
          className="flex items-center justify-center gap-2 px-6 py-2.5 rounded-lg bg-accent text-bg-base font-medium text-sm hover:bg-accent/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
          {mode === 'format' ? <Maximize2 className="w-4 h-4" /> : <Minimize2 className="w-4 h-4" />}
          {processing ? '处理中...' : mode === 'format' ? '使用 Prettier 格式化' : '压缩'}
        </button>
      </div>
    </ToolLayout>
  )
}
