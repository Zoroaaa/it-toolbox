import { useState, useCallback } from 'react'
import { ArrowRightLeft } from 'lucide-react'
import { ToolLayout } from '@/components/tool/ToolLayout'
import { encodeHex, decodeHex } from '@core/index'
import { useAppStore } from '@/store/app'
import { meta } from './meta'

type Mode = 'encode' | 'decode'
type Separator = '' | ' ' | ':' | '-'

export default function HexEncode() {
  const [input, setInput] = useState('')
  const [output, setOutput] = useState('')
  const [error, setError] = useState('')
  const [mode, setMode] = useState<Mode>('encode')
  const [separator, setSeparator] = useState<Separator>(' ')
  const { addHistory, addRecentTool } = useAppStore()

  const runTransform = useCallback(() => {
    if (!input.trim()) return
    addRecentTool(meta.id)

    const result = mode === 'encode' ? encodeHex(input, separator) : decodeHex(input)

    if (result.ok) {
      setOutput(result.value)
      setError('')
      addHistory(meta.id, input)
    } else {
      setError(result.error)
      setOutput('')
    }
  }, [input, mode, separator, addHistory, addRecentTool])

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
          {mode === 'encode' ? '编码' : '解码'}
        </button>

        <div className="flex items-center gap-1 bg-bg-raised rounded-lg p-1">
          {(['encode', 'decode'] as Mode[]).map(m => (
            <button
              key={m}
              onClick={() => { setMode(m); setOutput(''); setError('') }}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors
                ${mode === m ? 'bg-accent text-bg-base' : 'text-text-muted hover:text-text-primary'}`}
            >
              {m === 'encode' ? '编码' : '解码'}
            </button>
          ))}
        </div>

        {mode === 'encode' && (
          <div className="flex items-center gap-1 ml-2">
            <span className="text-xs text-text-muted">分隔符:</span>
            {(['', ' ', ':', '-'] as Separator[]).map(s => (
              <button
                key={s || 'none'}
                onClick={() => setSeparator(s)}
                className={`px-2.5 py-1 rounded-md text-xs font-mono transition-colors
                  ${separator === s ? 'bg-accent text-bg-base' : 'bg-bg-raised text-text-muted hover:text-text-primary'}`}
              >
                {s || '无'}
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
            placeholder={mode === 'encode' ? '输入要编码的文本...' : '输入十六进制字符串...'}
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
