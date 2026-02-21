import { useState, useCallback } from 'react'
import { Copy, Check, Minimize2, Maximize2 } from 'lucide-react'
import * as prettier from 'prettier/standalone'
import * as babelPlugin from 'prettier/plugins/babel'
import * as estreePlugin from 'prettier/plugins/estree'
import { ToolLayout } from '@/components/tool/ToolLayout'
import { useAppStore } from '@/store/app'
import { useClipboard } from '@/hooks/useClipboard'
import { meta } from './meta'

type Mode = 'format' | 'minify'
type Parser = 'babel' | 'babel-ts' | 'json' | 'json5'

const PARSER_OPTIONS: { value: Parser; label: string }[] = [
  { value: 'babel', label: 'JavaScript' },
  { value: 'babel-ts', label: 'TypeScript' },
  { value: 'json', label: 'JSON' },
  { value: 'json5', label: 'JSON5' },
]

const SAMPLE = `const fetchUser=async(id)=>{try{const response=await fetch('/api/users/'+id);if(!response.ok){throw new Error('HTTP error! status: '+response.status)}const data=await response.json();return{id:data.id,name:data.name,email:data.email,createdAt:new Date(data.created_at)}}catch(error){console.error('Failed to fetch user:',error);throw error}}`

export default function JSFormatter() {
  const [input, setInput] = useState(SAMPLE)
  const [output, setOutput] = useState('')
  const [mode, setMode] = useState<Mode>('format')
  const [parser, setParser] = useState<Parser>('babel')
  const [indent, setIndent] = useState(2)
  const [semi, setSemi] = useState(true)
  const [singleQuote, setSingleQuote] = useState(false)
  const [printWidth, setPrintWidth] = useState(80)
  const [trailingComma, setTrailingComma] = useState<'all' | 'es5' | 'none'>('all')
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
        // For JS minify: remove comments and collapse whitespace (basic)
        // Real minification needs terser which is CF-incompatible; do safe collapse
        let minified = input
          .replace(/\/\/[^\n]*/g, '')
          .replace(/\/\*[\s\S]*?\*\//g, '')
          .replace(/\s*\n\s*/g, ' ')
          .replace(/\s{2,}/g, ' ')
          .trim()
        setOutput(minified)
      } else {
        const formatted = await prettier.format(input, {
          parser,
          plugins: [babelPlugin, estreePlugin],
          tabWidth: indent,
          useTabs: false,
          semi,
          singleQuote,
          printWidth,
          trailingComma,
        })
        setOutput(formatted)
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : '格式化失败，请检查代码语法')
    } finally {
      setProcessing(false)
    }
  }, [input, mode, parser, indent, semi, singleQuote, printWidth, trailingComma, addRecentTool])

  const reset = () => { setInput(''); setOutput(''); setError('') }

  return (
    <ToolLayout meta={meta} onReset={reset} outputValue={output}>
      <div className="flex flex-col gap-4 h-[calc(100vh-12rem)]">

        {/* Controls row 1 */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex rounded-lg overflow-hidden border border-border-base">
            {(['format', 'minify'] as Mode[]).map(m => (
              <button key={m} onClick={() => setMode(m)}
                className={`px-4 py-1.5 text-sm transition-colors ${mode === m ? 'bg-accent text-bg-base' : 'bg-bg-surface text-text-secondary hover:bg-bg-raised'}`}>
                {m === 'format' ? '格式化' : '压缩'}
              </button>
            ))}
          </div>

          <div className="flex rounded-lg overflow-hidden border border-border-base">
            {PARSER_OPTIONS.map(p => (
              <button key={p.value} onClick={() => setParser(p.value)}
                className={`px-3 py-1.5 text-sm transition-colors ${parser === p.value ? 'bg-accent/10 text-accent' : 'bg-bg-surface text-text-secondary hover:bg-bg-raised'}`}>
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {/* Controls row 2 */}
        {mode === 'format' && (
          <div className="flex flex-wrap items-center gap-3">
            <label className="flex items-center gap-2 text-sm text-text-secondary">
              缩进:
              <select value={indent} onChange={e => setIndent(+e.target.value)}
                className="px-2 py-1 rounded-md bg-bg-raised border border-border-base text-sm text-text-primary focus:outline-none">
                <option value={2}>2 空格</option>
                <option value={4}>4 空格</option>
              </select>
            </label>
            <label className="flex items-center gap-2 text-sm text-text-secondary">
              行宽:
              <select value={printWidth} onChange={e => setPrintWidth(+e.target.value)}
                className="px-2 py-1 rounded-md bg-bg-raised border border-border-base text-sm text-text-primary focus:outline-none">
                <option value={80}>80</option>
                <option value={100}>100</option>
                <option value={120}>120</option>
              </select>
            </label>
            <label className="flex items-center gap-2 text-sm text-text-secondary">
              末尾逗号:
              <select value={trailingComma} onChange={e => setTrailingComma(e.target.value as 'all' | 'es5' | 'none')}
                className="px-2 py-1 rounded-md bg-bg-raised border border-border-base text-sm text-text-primary focus:outline-none">
                <option value="all">all</option>
                <option value="es5">es5</option>
                <option value="none">none</option>
              </select>
            </label>
            <label className="flex items-center gap-2 text-sm text-text-secondary cursor-pointer">
              <input type="checkbox" checked={semi} onChange={e => setSemi(e.target.checked)} />分号
            </label>
            <label className="flex items-center gap-2 text-sm text-text-secondary cursor-pointer">
              <input type="checkbox" checked={singleQuote} onChange={e => setSingleQuote(e.target.checked)} />单引号
            </label>
          </div>
        )}

        {error && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 text-red-400 text-sm font-mono whitespace-pre-wrap overflow-auto max-h-32">{error}</div>
        )}

        <div className="flex-1 grid grid-cols-2 gap-4 min-h-0">
          <div className="flex flex-col gap-2">
            <label className="text-xs font-medium text-text-muted uppercase tracking-wider">输入</label>
            <textarea value={input} onChange={e => { setInput(e.target.value); setOutput('') }}
              placeholder="粘贴 JavaScript / TypeScript / JSON 代码..."
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
