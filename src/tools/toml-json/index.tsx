import { useState, useCallback } from 'react'
import { ArrowRightLeft } from 'lucide-react'
import { ToolLayout } from '@/components/tool/ToolLayout'
import { meta } from './meta'
import { useAppStore } from '@/store/app'
import { parse, stringify } from 'smol-toml'

type Mode = 'toml-to-json' | 'json-to-toml'

// TOML 没有 null 类型，序列化前拦下来，避免字段被静默丢弃
function assertNoNull(value: unknown, path = 'root'): void {
  if (value === null) {
    throw new Error(`TOML 不支持 null 值（位于 "${path}"），请移除该字段或改为字符串`)
  }
  if (Array.isArray(value)) {
    value.forEach((item, i) => assertNoNull(item, `${path}[${i}]`))
  } else if (typeof value === 'object') {
    for (const [key, item] of Object.entries(value as Record<string, unknown>)) {
      assertNoNull(item, `${path}.${key}`)
    }
  }
}

export function tomlToJson(input: string): string {
  // smol-toml 把 TOML 日期解析为 Date，JSON.stringify 会自动转成 ISO 字符串
  return JSON.stringify(parse(input), null, 2)
}

export function jsonToToml(input: string): string {
  const parsed: unknown = JSON.parse(input)
  if (parsed === null || typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw new Error('TOML 顶层必须是对象，JSON 根节点不能是数组或基本类型')
  }
  assertNoNull(parsed)
  return stringify(parsed)
}

export default function TomlJson() {
  const [input, setInput] = useState('')
  const [output, setOutput] = useState('')
  const [error, setError] = useState('')
  const [mode, setMode] = useState<Mode>('toml-to-json')
  const [isProcessing, setIsProcessing] = useState(false)
  const addHistory = useAppStore((s) => s.addHistory)
const addRecentTool = useAppStore((s) => s.addRecentTool)

  const runTransform = useCallback(() => {
    if (!input.trim()) return
    addRecentTool(meta.id)
    setIsProcessing(true)

    try {
      const result = mode === 'toml-to-json' ? tomlToJson(input) : jsonToToml(input)
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
