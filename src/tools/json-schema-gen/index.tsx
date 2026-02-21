import { useState, useCallback } from 'react'
import { FileJson, Copy, Check, Download } from 'lucide-react'
import { ToolLayout } from '@/components/tool/ToolLayout'
import { useAppStore } from '@/store/app'
import { useClipboard } from '@/hooks/useClipboard'
import { meta } from './meta'

type JSONSchema = {
  $schema?: string
  type?: string | string[]
  properties?: Record<string, JSONSchema>
  items?: JSONSchema
  required?: string[]
  description?: string
  examples?: unknown[]
  minimum?: number
  maximum?: number
  minLength?: number
  maxLength?: number
  format?: string
  enum?: unknown[]
  anyOf?: JSONSchema[]
}

function inferType(value: unknown): string {
  if (value === null) return 'null'
  if (Array.isArray(value)) return 'array'
  return typeof value
}

function inferFormat(value: string): string | undefined {
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(value)) return 'date-time'
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return 'date'
  if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return 'email'
  if (/^https?:\/\//.test(value)) return 'uri'
  if (/^(\d{1,3}\.){3}\d{1,3}$/.test(value)) return 'ipv4'
  return undefined
}

function generateSchema(value: unknown, options: { addExamples: boolean; detectFormat: boolean }): JSONSchema {
  const type = inferType(value)

  if (value === null) return { type: 'null' }

  if (type === 'string') {
    const str = value as string
    const schema: JSONSchema = { type: 'string' }
    if (options.detectFormat) {
      const fmt = inferFormat(str)
      if (fmt) schema.format = fmt
    }
    if (options.addExamples) schema.examples = [str]
    return schema
  }

  if (type === 'number') {
    const schema: JSONSchema = {
      type: Number.isInteger(value) ? 'integer' : 'number',
    }
    if (options.addExamples) schema.examples = [value]
    return schema
  }

  if (type === 'boolean') {
    return { type: 'boolean' }
  }

  if (type === 'array') {
    const arr = value as unknown[]
    if (arr.length === 0) return { type: 'array', items: {} }

    // Infer from first item; if mixed types, use anyOf
    const types = [...new Set(arr.map(inferType))]
    if (types.length === 1) {
      return {
        type: 'array',
        items: generateSchema(arr[0], options),
      }
    }
    return {
      type: 'array',
      items: {
        anyOf: types.map(t => {
          const sample = arr.find(v => inferType(v) === t)
          return generateSchema(sample, options)
        }),
      },
    }
  }

  if (type === 'object') {
    const obj = value as Record<string, unknown>
    const properties: Record<string, JSONSchema> = {}
    const required: string[] = []

    Object.entries(obj).forEach(([key, val]) => {
      properties[key] = generateSchema(val, options)
      if (val !== null && val !== undefined) {
        required.push(key)
      }
    })

    const schema: JSONSchema = {
      type: 'object',
      properties,
    }
    if (required.length > 0) schema.required = required
    return schema
  }

  return {}
}

function mergeSchemas(schemas: JSONSchema[]): JSONSchema {
  if (schemas.length === 1) return schemas[0]

  // Simple merge: take the first as base, flag fields that appear in some but not all as not required
  const allKeys = new Set(schemas.flatMap(s => Object.keys(s.properties || {})))
  const commonKeys = [...allKeys].filter(k => schemas.every(s => k in (s.properties || {})))

  const properties: Record<string, JSONSchema> = {}
  allKeys.forEach(key => {
    const schemasWithKey = schemas.filter(s => key in (s.properties || {}))
    properties[key] = schemasWithKey[0].properties![key]
  })

  return {
    type: 'object',
    properties,
    required: commonKeys,
  }
}

function generateFromSamples(samples: unknown[], options: { addExamples: boolean; detectFormat: boolean }): JSONSchema {
  if (samples.length === 0) return {}
  if (samples.length === 1) return generateSchema(samples[0], options)

  // If all are objects, merge
  if (samples.every(s => typeof s === 'object' && s !== null && !Array.isArray(s))) {
    const schemas = samples.map(s => generateSchema(s, options))
    return mergeSchemas(schemas)
  }

  return generateSchema(samples[0], options)
}

const EXAMPLE = `{
  "id": 1,
  "name": "Alice",
  "email": "alice@example.com",
  "createdAt": "2024-01-15T10:30:00Z",
  "isActive": true,
  "score": 98.5,
  "tags": ["admin", "user"],
  "address": {
    "city": "Beijing",
    "country": "CN"
  }
}`

export default function JSONSchemaGenerator() {
  const [input, setInput] = useState('')
  const [output, setOutput] = useState('')
  const [addExamples, setAddExamples] = useState(false)
  const [detectFormat, setDetectFormat] = useState(true)
  const [addDollarSchema, setAddDollarSchema] = useState(true)
  const [error, setError] = useState('')
  const { addRecentTool } = useAppStore()
  const { copy, copied } = useClipboard()

  const generate = useCallback(() => {
    if (!input.trim()) return
    addRecentTool(meta.id)
    setError('')

    try {
      let parsed: unknown
      if (input.trim().startsWith('[')) {
        const arr = JSON.parse(input)
        if (Array.isArray(arr) && arr.length > 0 && typeof arr[0] === 'object') {
          const schema = generateFromSamples(arr, { addExamples, detectFormat })
          if (addDollarSchema) schema.$schema = 'http://json-schema.org/draft-07/schema#'
          setOutput(JSON.stringify(schema, null, 2))
          return
        }
        parsed = arr
      } else {
        parsed = JSON.parse(input)
      }

      const schema = generateSchema(parsed, { addExamples, detectFormat })
      if (addDollarSchema) schema.$schema = 'http://json-schema.org/draft-07/schema#'
      setOutput(JSON.stringify(schema, null, 2))
    } catch (e) {
      setError(e instanceof Error ? e.message : 'JSON 解析失败')
    }
  }, [input, addExamples, detectFormat, addDollarSchema, addRecentTool])

  const handleDownload = () => {
    const blob = new Blob([output], { type: 'application/json' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = 'schema.json'
    a.click()
  }

  const reset = () => {
    setInput('')
    setOutput('')
    setError('')
  }

  return (
    <ToolLayout meta={meta} onReset={reset} outputValue={output}>
      <div className="flex flex-col gap-4 h-[calc(100vh-12rem)]">
        {/* Options */}
        <div className="flex items-center gap-6 p-3 bg-bg-surface border border-border-base rounded-lg">
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={addDollarSchema} onChange={e => setAddDollarSchema(e.target.checked)} className="rounded" />
            <span className="text-sm text-text-secondary">添加 $schema</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={detectFormat} onChange={e => setDetectFormat(e.target.checked)} className="rounded" />
            <span className="text-sm text-text-secondary">检测字符串格式（email/date/uri）</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={addExamples} onChange={e => setAddExamples(e.target.checked)} className="rounded" />
            <span className="text-sm text-text-secondary">添加 examples</span>
          </label>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 text-red-400 text-sm">{error}</div>
        )}

        <div className="flex-1 grid grid-cols-2 gap-4 min-h-0">
          {/* Input */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-medium text-text-muted uppercase tracking-wider">输入 JSON</label>
              <button
                onClick={() => setInput(EXAMPLE)}
                className="text-xs text-accent hover:text-accent/80 transition-colors"
              >
                加载示例
              </button>
            </div>
            <textarea
              value={input}
              onChange={e => { setInput(e.target.value); setOutput('') }}
              placeholder='粘贴 JSON 对象或数组（数组中多个样本可提高推断精度）...'
              className="flex-1 px-3 py-2.5 rounded-lg bg-bg-surface border border-border-base text-sm font-mono text-text-primary focus:outline-none focus:border-accent resize-none"
            />
            <button
              onClick={generate}
              disabled={!input.trim()}
              className="flex items-center justify-center gap-2 px-6 py-2.5 rounded-lg bg-accent text-bg-base font-medium text-sm hover:bg-accent/90 transition-colors disabled:opacity-50"
            >
              <FileJson className="w-4 h-4" />
              生成 JSON Schema
            </button>
          </div>

          {/* Output */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-medium text-text-muted uppercase tracking-wider">JSON Schema</label>
              <div className="flex gap-1">
                {output && (
                  <>
                    <button
                      onClick={() => copy(output)}
                      className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-bg-raised hover:bg-bg-surface text-xs text-text-secondary transition-colors"
                    >
                      {copied ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3" />}
                      复制
                    </button>
                    <button
                      onClick={handleDownload}
                      className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-bg-raised hover:bg-bg-surface text-xs text-text-secondary transition-colors"
                    >
                      <Download className="w-3 h-3" />
                      下载
                    </button>
                  </>
                )}
              </div>
            </div>
            <textarea
              value={output}
              readOnly
              placeholder="生成的 JSON Schema 将显示在这里..."
              className="flex-1 px-3 py-2.5 rounded-lg bg-bg-surface border border-border-base text-sm font-mono text-text-muted resize-none"
            />
          </div>
        </div>
      </div>
    </ToolLayout>
  )
}
