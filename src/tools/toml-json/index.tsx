import { useState, useCallback } from 'react'
import { ArrowRightLeft } from 'lucide-react'
import { ToolLayout } from '@/components/tool/ToolLayout'
import { meta } from './meta'
import { useAppStore } from '@/store/app'

type Mode = 'toml-to-json' | 'json-to-toml'

function parseToml(toml: string): Record<string, unknown> {
  const result: Record<string, unknown> = {}
  const lines = toml.split('\n')
  let currentSection = result
  let currentSectionName = ''

  for (let line of lines) {
    line = line.trim()
    if (!line || line.startsWith('#')) continue

    const sectionMatch = line.match(/^\[([^\]]+)\]$/)
    if (sectionMatch) {
      currentSectionName = sectionMatch[1]
      const parts = currentSectionName.split('.')
      currentSection = result
      for (const part of parts) {
        if (!currentSection[part]) {
          currentSection[part] = {}
        }
        currentSection = currentSection[part] as Record<string, unknown>
      }
      continue
    }

    const keyValueMatch = line.match(/^([^=]+)=(.*)$/)
    if (keyValueMatch) {
      const key = keyValueMatch[1].trim()
      let value: unknown = keyValueMatch[2].trim()

      if (typeof value === 'string') {
        if (value.startsWith('"') && value.endsWith('"')) {
          value = value.slice(1, -1)
        } else if (value.startsWith("'") && value.endsWith("'")) {
          value = value.slice(1, -1)
        } else if (value === 'true') {
          value = true
        } else if (value === 'false') {
          value = false
        } else if (!isNaN(Number(value))) {
          value = Number(value)
        } else if (value.startsWith('[')) {
          try {
            value = JSON.parse(value.replace(/'/g, '"'))
          } catch {
            value = value
          }
        }
      }

      currentSection[key] = value
    }
  }

  return result
}

function jsonToToml(obj: Record<string, unknown>, prefix = ''): string {
  let result = ''
  const sections: string[] = []
  const values: string[] = []

  for (const [key, value] of Object.entries(obj)) {
    const fullKey = prefix ? `${prefix}.${key}` : key

    if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
      sections.push(`[${fullKey}]`)
      sections.push(jsonToToml(value as Record<string, unknown>, fullKey))
    } else {
      let tomlValue: string
      if (typeof value === 'string') {
        tomlValue = `"${value}"`
      } else if (Array.isArray(value)) {
        tomlValue = JSON.stringify(value)
      } else if (value === null) {
        tomlValue = 'null'
      } else {
        tomlValue = String(value)
      }
      values.push(`${key} = ${tomlValue}`)
    }
  }

  if (prefix && values.length > 0) {
    result = values.join('\n') + '\n'
  } else if (!prefix) {
    result = values.join('\n')
    if (sections.length > 0 && values.length > 0) {
      result += '\n\n'
    }
  }

  result += sections.join('\n\n')

  return result
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
        const parsed = JSON.parse(input)
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
