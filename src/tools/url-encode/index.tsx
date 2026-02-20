import { useState, useCallback } from 'react'
import { ArrowRightLeft, AlertCircle } from 'lucide-react'
import { ToolLayout } from '@/components/tool/ToolLayout'
import { encodeUrl, decodeUrl, encodeUrlFull, decodeUrlFull, parseUrl } from '@core/index'
import { useAppStore } from '@/store/app'
import { meta } from './meta'

type Mode = 'encode' | 'decode' | 'parse'
type Variant = 'component' | 'full'

export default function UrlEncodeTool() {
  const [input, setInput] = useState('')
  const [output, setOutput] = useState('')
  const [error, setError] = useState('')
  const [mode, setMode] = useState<Mode>('encode')
  const [variant, setVariant] = useState<Variant>('component')
  const { addHistory, addRecentTool } = useAppStore()

  const runTransform = useCallback(() => {
    if (!input.trim()) return
    addRecentTool(meta.id)

    if (mode === 'parse') {
      const result = parseUrl(input)
      if (result.ok) {
        setOutput(JSON.stringify(result.value, null, 2))
        setError('')
        addHistory(meta.id, input)
      } else {
        setError(result.error)
        setOutput('')
      }
      return
    }

    const result = mode === 'encode'
      ? variant === 'full' ? encodeUrlFull(input) : encodeUrl(input)
      : variant === 'full' ? decodeUrlFull(input) : decodeUrl(input)

    if (result.ok) {
      setOutput(result.value)
      setError('')
      addHistory(meta.id, input)
    } else {
      setError(result.error)
      setOutput('')
    }
  }, [input, mode, variant, addHistory, addRecentTool])

  const reset = () => {
    setInput('')
    setOutput('')
    setError('')
  }

  return (
    <ToolLayout meta={meta} onReset={reset} outputValue={output}>
      <div className="flex items-center gap-2 mb-4 flex-wrap">
        <button onClick={runTransform} className="btn-primary">
          <ArrowRightLeft className="w-4 h-4" />
          {mode === 'parse' ? '解析' : mode === 'encode' ? '编码' : '解码'}
        </button>

        <div className="flex items-center gap-1 bg-bg-raised rounded-lg p-1">
          {(['encode', 'decode', 'parse'] as Mode[]).map(m => (
            <button
              key={m}
              onClick={() => { setMode(m); setOutput(''); setError('') }}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors
                ${mode === m ? 'bg-accent text-bg-base' : 'text-text-muted hover:text-text-primary'}`}
            >
              {m === 'encode' ? '编码' : m === 'decode' ? '解码' : '解析'}
            </button>
          ))}
        </div>

        {mode !== 'parse' && (
          <div className="flex items-center gap-1 bg-bg-raised rounded-lg p-1">
            {(['component', 'full'] as Variant[]).map(v => (
              <button
                key={v}
                onClick={() => { setVariant(v); setOutput(''); setError('') }}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors
                  ${variant === v ? 'bg-accent text-bg-base' : 'text-text-muted hover:text-text-primary'}`}
              >
                {v === 'component' ? '组件' : '完整'}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 h-[calc(100vh-16rem)]">
        <div className="flex flex-col gap-2">
          <label className="text-xs font-medium text-text-muted uppercase tracking-wider">输入</label>
          <textarea
            className="tool-input flex-1 font-mono text-xs leading-relaxed"
            value={input}
            onChange={e => { setInput(e.target.value); setError('') }}
            placeholder={mode === 'parse' ? '输入完整 URL...' : mode === 'encode' ? '输入要编码的文本...' : '输入已编码的 URL...'}
            spellCheck={false}
          />
          <div className="text-xs text-text-muted">{input.length} 字符</div>
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-xs font-medium text-text-muted uppercase tracking-wider">输出</label>
          {error ? (
            <div className="flex-1 rounded-lg bg-rose-500/10 border border-rose-500/30 p-4 flex items-start gap-3">
              <AlertCircle className="w-4 h-4 text-rose-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-rose-500 mb-1">错误</p>
                <p className="text-xs text-rose-400/80">{error}</p>
              </div>
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
