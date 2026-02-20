import { useState, useCallback } from 'react'
import { ArrowRightLeft, Copy, Check } from 'lucide-react'
import { ToolLayout } from '@/components/tool/ToolLayout'
import { textToUnicode, unicodeToText, type UnicodeResult } from '@core/index'
import { useAppStore } from '@/store/app'
import { useClipboard } from '@/hooks/useClipboard'
import { meta } from './meta'

type Mode = 'encode' | 'decode'

export default function UnicodeConvert() {
  const [input, setInput] = useState('')
  const [output, setOutput] = useState('')
  const [error, setError] = useState('')
  const [mode, setMode] = useState<Mode>('encode')
  const [unicodeResult, setUnicodeResult] = useState<UnicodeResult | null>(null)
  const { addHistory, addRecentTool } = useAppStore()
  const { copy, copied } = useClipboard()

  const runTransform = useCallback(() => {
    if (!input.trim()) return
    addRecentTool(meta.id)

    if (mode === 'encode') {
      const result = textToUnicode(input)
      if (result.ok) {
        setUnicodeResult(result.value)
        setOutput(result.value.formats.uEscape)
        setError('')
        addHistory(meta.id, input)
      } else {
        setError(result.error)
        setOutput('')
        setUnicodeResult(null)
      }
    } else {
      const result = unicodeToText(input)
      if (result.ok) {
        setOutput(result.value)
        setError('')
        setUnicodeResult(null)
        addHistory(meta.id, input)
      } else {
        setError(result.error)
        setOutput('')
        setUnicodeResult(null)
      }
    }
  }, [input, mode, addHistory, addRecentTool])

  const reset = () => {
    setInput('')
    setOutput('')
    setError('')
    setUnicodeResult(null)
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
              onClick={() => { setMode(m); setOutput(''); setError(''); setUnicodeResult(null) }}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors
                ${mode === m ? 'bg-accent text-bg-base' : 'text-text-muted hover:text-text-primary'}`}
            >
              {m === 'encode' ? '编码' : '解码'}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 h-[calc(100vh-16rem)]">
        <div className="flex flex-col gap-2">
          <label className="text-xs font-medium text-text-muted uppercase tracking-wider">输入</label>
          <textarea
            className="tool-input flex-1 font-mono text-xs leading-relaxed"
            value={input}
            onChange={e => { setInput(e.target.value); setError('') }}
            placeholder={mode === 'encode' ? '输入文本...' : '输入 Unicode 格式...'}
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
            <div className="flex-1 overflow-y-auto">
              {unicodeResult && mode === 'encode' ? (
                <div className="space-y-4">
                  <div className="p-3 rounded-lg bg-bg-surface border border-border-base">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-medium text-text-secondary">\u 转义</span>
                      <button onClick={() => copy(unicodeResult.formats.uEscape)} className="p-1 rounded hover:bg-bg-raised">
                        {copied ? <Check className="w-3.5 h-3.5 text-accent" /> : <Copy className="w-3.5 h-3.5 text-text-muted" />}
                      </button>
                    </div>
                    <p className="font-mono text-xs text-text-primary break-all">{unicodeResult.formats.uEscape}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-bg-surface border border-border-base">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-medium text-text-secondary">\u{} 格式</span>
                      <button onClick={() => copy(unicodeResult.formats.uBrace)} className="p-1 rounded hover:bg-bg-raised">
                        <Copy className="w-3.5 h-3.5 text-text-muted" />
                      </button>
                    </div>
                    <p className="font-mono text-xs text-text-primary break-all">{unicodeResult.formats.uBrace}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-bg-surface border border-border-base">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-medium text-text-secondary">HTML 实体</span>
                      <button onClick={() => copy(unicodeResult.formats.htmlEntity)} className="p-1 rounded hover:bg-bg-raised">
                        <Copy className="w-3.5 h-3.5 text-text-muted" />
                      </button>
                    </div>
                    <p className="font-mono text-xs text-text-primary break-all">{unicodeResult.formats.htmlEntity}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-bg-surface border border-border-base">
                    <span className="text-xs font-medium text-text-secondary">码点列表</span>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {unicodeResult.codePoints.map((cp, i) => (
                        <div key={i} className="px-2 py-1 rounded bg-bg-raised text-xs">
                          <span className="text-text-primary">{cp.char}</span>
                          <span className="text-text-muted ml-1">{cp.code}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <textarea
                  className="tool-input w-full h-full font-mono text-xs leading-relaxed"
                  value={output}
                  readOnly
                  placeholder="结果将在这里显示..."
                  spellCheck={false}
                />
              )}
            </div>
          )}
        </div>
      </div>
    </ToolLayout>
  )
}
