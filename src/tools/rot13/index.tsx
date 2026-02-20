import { useState, useCallback } from 'react'
import { ArrowRightLeft } from 'lucide-react'
import { ToolLayout } from '@/components/tool/ToolLayout'
import { rot13, caesarCipher } from '@core/index'
import { useAppStore } from '@/store/app'
import { meta } from './meta'

export default function Rot13() {
  const [input, setInput] = useState('')
  const [output, setOutput] = useState('')
  const [error, setError] = useState('')
  const [shift, setShift] = useState(13)
  const { addHistory, addRecentTool } = useAppStore()

  const runTransform = useCallback(() => {
    if (!input.trim()) return
    addRecentTool(meta.id)

    const result = shift === 13 ? rot13(input) : caesarCipher(input, shift)

    if (result.ok) {
      setOutput(result.value)
      setError('')
      addHistory(meta.id, input)
    } else {
      setError(result.error)
      setOutput('')
    }
  }, [input, shift, addHistory, addRecentTool])

  const reset = () => {
    setInput('')
    setOutput('')
    setError('')
    setShift(13)
  }

  return (
    <ToolLayout meta={meta} onReset={reset} outputValue={output}>
      <div className="flex items-center gap-2 mb-4 flex-wrap">
        <button onClick={runTransform} className="btn-primary">
          <ArrowRightLeft className="w-4 h-4" />
          转换
        </button>

        <div className="flex items-center gap-2 ml-2">
          <span className="text-xs text-text-muted">偏移量:</span>
          <input
            type="number"
            min="1"
            max="25"
            value={shift}
            onChange={e => setShift(parseInt(e.target.value) || 13)}
            className="w-16 px-2 py-1 rounded text-xs bg-bg-raised border border-border-base text-text-primary"
          />
          <button
            onClick={() => setShift(13)}
            className={`px-2.5 py-1 rounded-md text-xs transition-colors
              ${shift === 13 ? 'bg-accent text-bg-base' : 'bg-bg-raised text-text-muted hover:text-text-primary'}`}
          >
            ROT13
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 h-[calc(100vh-16rem)]">
        <div className="flex flex-col gap-2">
          <label className="text-xs font-medium text-text-muted uppercase tracking-wider">输入</label>
          <textarea
            className="tool-input flex-1 font-mono text-xs leading-relaxed"
            value={input}
            onChange={e => { setInput(e.target.value); setError('') }}
            placeholder="输入文本..."
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
