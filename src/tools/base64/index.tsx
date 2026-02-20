import { useState, useCallback, useRef } from 'react'
import { ArrowRightLeft, Upload, AlertCircle } from 'lucide-react'
import { ToolLayout } from '@/components/tool/ToolLayout'
import { encodeBase64, decodeBase64, encodeBase64Url, decodeBase64Url, fileToBase64 } from '@core/index'
import { useAppStore } from '@/store/app'
import { meta } from './meta'

type Mode = 'encode' | 'decode'
type Variant = 'standard' | 'url'

export default function Base64Tool() {
  const [input, setInput] = useState('')
  const [output, setOutput] = useState('')
  const [error, setError] = useState('')
  const [mode, setMode] = useState<Mode>('encode')
  const [variant, setVariant] = useState<Variant>('standard')
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { addHistory, addRecentTool } = useAppStore()

  const runTransform = useCallback(() => {
    if (!input.trim()) return
    addRecentTool(meta.id)

    const result = mode === 'encode'
      ? variant === 'url' ? encodeBase64Url(input) : encodeBase64(input)
      : variant === 'url' ? decodeBase64Url(input) : decodeBase64(input)

    if (result.ok) {
      setOutput(result.value)
      setError('')
      addHistory(meta.id, input)
    } else {
      setError(result.error)
      setOutput('')
    }
  }, [input, mode, variant, addHistory, addRecentTool])

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const result = await fileToBase64(file)
    if (result.ok) {
      setOutput(result.value)
      setInput(`[文件: ${file.name}]`)
      setError('')
      addRecentTool(meta.id)
    } else {
      setError(result.error)
    }
  }

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

        <div className="flex items-center gap-1 bg-bg-raised rounded-lg p-1">
          {(['standard', 'url'] as Variant[]).map(v => (
            <button
              key={v}
              onClick={() => { setVariant(v); setOutput(''); setError('') }}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors
                ${variant === v ? 'bg-accent text-bg-base' : 'text-text-muted hover:text-text-primary'}`}
            >
              {v === 'standard' ? '标准' : 'URL安全'}
            </button>
          ))}
        </div>

        {mode === 'encode' && (
          <>
            <button onClick={() => fileInputRef.current?.click()} className="btn-ghost">
              <Upload className="w-4 h-4" />
              上传文件
            </button>
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              onChange={handleFileUpload}
            />
          </>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 h-[calc(100vh-16rem)]">
        <div className="flex flex-col gap-2">
          <label className="text-xs font-medium text-text-muted uppercase tracking-wider">输入</label>
          <textarea
            className="tool-input flex-1 font-mono text-xs leading-relaxed"
            value={input}
            onChange={e => { setInput(e.target.value); setError('') }}
            placeholder={mode === 'encode' ? '输入要编码的文本...' : '输入 Base64 字符串...'}
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
