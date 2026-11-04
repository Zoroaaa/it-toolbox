import { useState, useCallback } from 'react'
import { RefreshCw, Download, Copy, Check, Plus, Trash2 } from 'lucide-react'
import { ToolLayout } from '@/components/tool/ToolLayout'
import { useAppStore } from '@/store/app'
import { useClipboard } from '@/hooks/useClipboard'
import { meta } from './meta'

type FieldType = 'string' | 'number' | 'boolean' | 'date' | 'email' | 'name' | 'phone' | 'address' | 'url' | 'uuid' | 'array' | 'object'

interface FieldDefinition {
  id: string
  name: string
  type: FieldType
  required: boolean
  children?: FieldDefinition[]
  arrayLength?: number
  min?: number
  max?: number
}

const FIELD_TYPES: { value: FieldType; label: string }[] = [
  { value: 'string', label: '字符串' },
  { value: 'number', label: '数字' },
  { value: 'boolean', label: '布尔值' },
  { value: 'date', label: '日期' },
  { value: 'email', label: '邮箱' },
  { value: 'name', label: '姓名' },
  { value: 'phone', label: '电话' },
  { value: 'address', label: '地址' },
  { value: 'url', label: 'URL' },
  { value: 'uuid', label: 'UUID' },
  { value: 'array', label: '数组' },
  { value: 'object', label: '对象' },
]

const SAMPLE_NAMES = ['张三', '李四', '王五', '赵六', '钱七', '孙八', '周九', '吴十', '郑一', '王二']
const SAMPLE_CITIES = ['北京', '上海', '广州', '深圳', '杭州', '成都', '武汉', '西安', '南京', '苏州']
const SAMPLE_STREETS = ['人民路', '中山路', '解放路', '建设路', '和平路', '文化路', '科技路', '创新大道']

function generateId(): string {
  return Math.random().toString(36).substring(2, 9)
}

function generateUuid(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = Math.random() * 16 | 0
    const v = c === 'x' ? r : (r & 0x3 | 0x8)
    return v.toString(16)
  })
}

function generateFieldValue(field: FieldDefinition): unknown {
  const { type, min, max, arrayLength = 3, children } = field

  switch (type) {
    case 'string': {
      const strLen = Math.floor(Math.random() * 10) + 5
      return Math.random().toString(36).substring(2, strLen + 2)
    }
    case 'number': {
      const minVal = min ?? 0
      const maxVal = max ?? 100
      return Math.floor(Math.random() * (maxVal - minVal + 1)) + minVal
    }
    case 'boolean':
      return Math.random() > 0.5
    case 'date': {
      const start = new Date(2020, 0, 1)
      const end = new Date()
      return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime())).toISOString().split('T')[0]
    }
    case 'email': {
      const domains = ['gmail.com', 'outlook.com', 'qq.com', '163.com', 'yahoo.com']
      return `${Math.random().toString(36).substring(2, 8)}@${domains[Math.floor(Math.random() * domains.length)]}`
    }
    case 'name':
      return SAMPLE_NAMES[Math.floor(Math.random() * SAMPLE_NAMES.length)]
    case 'phone': {
      const prefixes = ['138', '139', '150', '151', '186', '187', '188']
      return `${prefixes[Math.floor(Math.random() * prefixes.length)]}${Math.random().toString().substring(2, 10)}`
    }
    case 'address': {
      const city = SAMPLE_CITIES[Math.floor(Math.random() * SAMPLE_CITIES.length)]
      const street = SAMPLE_STREETS[Math.floor(Math.random() * SAMPLE_STREETS.length)]
      return `${city}市${street}${Math.floor(Math.random() * 999) + 1}号`
    }
    case 'url':
      return `https://example.com/${Math.random().toString(36).substring(2, 8)}`
    case 'uuid':
      return generateUuid()
    case 'array': {
      if (!children || children.length === 0) return []
      const arrLength = Math.max(1, arrayLength)
      const arr = []
      for (let i = 0; i < arrLength; i++) {
        if (children[0].type === 'object') {
          arr.push(generateObject(children[0].children || []))
        } else {
          arr.push(generateFieldValue(children[0]))
        }
      }
      return arr
    }
    case 'object':
      return generateObject(children || [])
    default:
      return null
  }
}

function generateObject(fields: FieldDefinition[]): Record<string, unknown> {
  const obj: Record<string, unknown> = {}
  for (const field of fields) {
    if (field.required || Math.random() > 0.2) {
      obj[field.name] = generateFieldValue(field)
    }
  }
  return obj
}

function generateJson(schema: FieldDefinition[], count: number): unknown[] {
  const results: unknown[] = []
  for (let i = 0; i < count; i++) {
    results.push(generateObject(schema))
  }
  return results
}

export default function JsonGenerator() {
  const [fields, setFields] = useState<FieldDefinition[]>([
    { id: generateId(), name: 'id', type: 'uuid', required: true },
    { id: generateId(), name: 'name', type: 'name', required: true },
    { id: generateId(), name: 'email', type: 'email', required: true },
  ])
  const [count, setCount] = useState(5)
  const [results, setResults] = useState<unknown[] | null>(null)
  const addRecentTool = useAppStore((s) => s.addRecentTool)
  const { copy, copied } = useClipboard()

  const addField = useCallback(() => {
    setFields(prev => [...prev, {
      id: generateId(),
      name: `field_${prev.length + 1}`,
      type: 'string',
      required: false,
    }])
  }, [])

  const removeField = useCallback((id: string) => {
    setFields(prev => prev.filter(f => f.id !== id))
  }, [])

  const updateField = useCallback((id: string, updates: Partial<FieldDefinition>) => {
    setFields(prev => prev.map(f => f.id === id ? { ...f, ...updates } : f))
  }, [])

  const generate = useCallback(() => {
    addRecentTool(meta.id)
    const data = generateJson(fields, count)
    setResults(data)
  }, [fields, count, addRecentTool])

  const downloadJson = useCallback(() => {
    if (!results) return
    const blob = new Blob([JSON.stringify(results, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'mock-data.json'
    a.click()
    URL.revokeObjectURL(url)
  }, [results])

  const reset = () => {
    setFields([
      { id: generateId(), name: 'id', type: 'uuid', required: true },
      { id: generateId(), name: 'name', type: 'name', required: true },
      { id: generateId(), name: 'email', type: 'email', required: true },
    ])
    setCount(5)
    setResults(null)
  }

  const outputValue = results ? JSON.stringify(results, null, 2) : ''

  return (
    <ToolLayout meta={meta} onReset={reset} outputValue={outputValue}>
      <div className="flex items-center gap-2 mb-4 flex-wrap">
        <button onClick={generate} className="btn-primary">
          <RefreshCw className="w-4 h-4" />
          生成
        </button>
        <button onClick={addField} className="btn-ghost">
          <Plus className="w-4 h-4" />
          添加字段
        </button>
        <div className="flex items-center gap-2 ml-4">
          <label className="text-xs text-text-muted">生成数量:</label>
          <input
            type="number"
            min={1}
            max={1000}
            value={count}
            onChange={e => setCount(Math.max(1, Math.min(1000, parseInt(e.target.value) || 1)))}
            className="w-20 px-2 py-1.5 rounded-lg bg-bg-surface border border-border-base text-sm text-text-primary focus:outline-none focus:border-accent"
          />
        </div>
        {results && (
          <button onClick={downloadJson} className="btn-ghost ml-auto">
            <Download className="w-4 h-4" />
            下载JSON
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 h-[calc(100vh-20rem)]">
        <div className="flex flex-col gap-2">
          <label className="text-xs font-medium text-text-muted uppercase tracking-wider">
            Schema 定义 ({fields.length} 个字段)
          </label>
          <div className="flex-1 overflow-y-auto space-y-2 p-3 rounded-xl bg-bg-surface border border-border-base">
            {fields.map(field => (
              <div key={field.id} className="flex items-center gap-2 p-2 rounded-lg bg-bg-raised border border-border-base">
                <input
                  type="text"
                  value={field.name}
                  onChange={e => updateField(field.id, { name: e.target.value })}
                  placeholder="字段名"
                  className="flex-1 px-2 py-1 rounded bg-bg-surface border border-border-base text-sm text-text-primary focus:outline-none focus:border-accent font-mono"
                />
                <select
                  value={field.type}
                  onChange={e => updateField(field.id, { type: e.target.value as FieldType })}
                  className="px-2 py-1 rounded bg-bg-surface border border-border-base text-sm text-text-primary focus:outline-none focus:border-accent"
                >
                  {FIELD_TYPES.map(t => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
                <label className="flex items-center gap-1 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={field.required}
                    onChange={e => updateField(field.id, { required: e.target.checked })}
                    className="w-4 h-4 rounded border-border-base bg-bg-surface accent-accent"
                  />
                  <span className="text-xs text-text-muted">必填</span>
                </label>
                {field.type === 'number' && (
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      value={field.min ?? ''}
                      onChange={e => updateField(field.id, { min: e.target.value ? parseInt(e.target.value) : undefined })}
                      placeholder="最小"
                      className="w-14 px-1 py-0.5 rounded bg-bg-surface border border-border-base text-xs text-text-primary focus:outline-none focus:border-accent"
                    />
                    <input
                      type="number"
                      value={field.max ?? ''}
                      onChange={e => updateField(field.id, { max: e.target.value ? parseInt(e.target.value) : undefined })}
                      placeholder="最大"
                      className="w-14 px-1 py-0.5 rounded bg-bg-surface border border-border-base text-xs text-text-primary focus:outline-none focus:border-accent"
                    />
                  </div>
                )}
                {field.type === 'array' && (
                  <input
                    type="number"
                    value={field.arrayLength ?? 3}
                    onChange={e => updateField(field.id, { arrayLength: parseInt(e.target.value) || 3 })}
                    placeholder="长度"
                    min={1}
                    max={100}
                    className="w-14 px-1 py-0.5 rounded bg-bg-surface border border-border-base text-xs text-text-primary focus:outline-none focus:border-accent"
                  />
                )}
                <button
                  onClick={() => removeField(field.id)}
                  className="p-1 rounded hover:bg-rose-500/10 text-text-muted hover:text-rose-400 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
            {fields.length === 0 && (
              <p className="text-center text-text-muted text-sm py-4">点击"添加字段"开始定义Schema</p>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-medium text-text-muted uppercase tracking-wider">生成结果</label>
            {results && (
              <button onClick={() => copy(outputValue)} className="btn-ghost text-xs">
                {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                {copied ? '已复制' : '复制'}
              </button>
            )}
          </div>
          {results ? (
            <pre className="flex-1 overflow-auto p-3 rounded-xl bg-bg-surface border border-border-base text-xs font-mono text-text-primary leading-relaxed">
              {JSON.stringify(results, null, 2)}
            </pre>
          ) : (
            <div className="flex-1 rounded-xl bg-bg-raised border border-border-base flex items-center justify-center">
              <p className="text-text-muted text-sm">定义Schema后点击生成</p>
            </div>
          )}
        </div>
      </div>
    </ToolLayout>
  )
}
