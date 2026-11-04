import { useState, useCallback } from 'react'
import { RefreshCw, Download, Copy, Check, Plus, Trash2 } from 'lucide-react'
import { ToolLayout } from '@/components/tool/ToolLayout'
import { useAppStore } from '@/store/app'
import { useClipboard } from '@/hooks/useClipboard'
import { meta } from './meta'

type SqlDataType = 'INT' | 'BIGINT' | 'VARCHAR' | 'TEXT' | 'BOOLEAN' | 'DATE' | 'DATETIME' | 'TIMESTAMP' | 'DECIMAL' | 'FLOAT' | 'UUID' | 'EMAIL' | 'NAME' | 'PHONE' | 'ADDRESS'

interface ColumnDefinition {
  id: string
  name: string
  type: SqlDataType
  nullable: boolean
  maxLength?: number
  minValue?: number
  maxValue?: number
}

const SQL_DATA_TYPES: { value: SqlDataType; label: string }[] = [
  { value: 'INT', label: 'INT' },
  { value: 'BIGINT', label: 'BIGINT' },
  { value: 'VARCHAR', label: 'VARCHAR' },
  { value: 'TEXT', label: 'TEXT' },
  { value: 'BOOLEAN', label: 'BOOLEAN' },
  { value: 'DATE', label: 'DATE' },
  { value: 'DATETIME', label: 'DATETIME' },
  { value: 'TIMESTAMP', label: 'TIMESTAMP' },
  { value: 'DECIMAL', label: 'DECIMAL' },
  { value: 'FLOAT', label: 'FLOAT' },
  { value: 'UUID', label: 'UUID' },
  { value: 'EMAIL', label: 'EMAIL' },
  { value: 'NAME', label: 'NAME' },
  { value: 'PHONE', label: 'PHONE' },
  { value: 'ADDRESS', label: 'ADDRESS' },
]

const SAMPLE_NAMES = ['张三', '李四', '王五', '赵六', '钱七', '孙八', '周九', '吴十']
const SAMPLE_CITIES = ['北京', '上海', '广州', '深圳', '杭州', '成都', '武汉', '西安']

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

function generateValue(column: ColumnDefinition): string | number | null {
  if (column.nullable && Math.random() < 0.1) {
    return null
  }

  const { type, maxLength = 50, minValue = 0, maxValue = 1000 } = column

  switch (type) {
    case 'INT':
      return Math.floor(Math.random() * (maxValue - minValue + 1)) + minValue
    case 'BIGINT':
      return Math.floor(Math.random() * 1000000000) + 1
    case 'VARCHAR': {
      const strLen = Math.min(Math.floor(Math.random() * 20) + 5, maxLength)
      return `'${Math.random().toString(36).substring(2, strLen + 2)}'`
    }
    case 'TEXT':
      return `'这是一段测试文本内容，用于填充TEXT字段。编号：${Math.random().toString(36).substring(2, 8)}'`
    case 'BOOLEAN':
      return Math.random() > 0.5 ? 1 : 0
    case 'DATE': {
      const dateStart = new Date(2020, 0, 1)
      const dateEnd = new Date()
      const randomDate = new Date(dateStart.getTime() + Math.random() * (dateEnd.getTime() - dateStart.getTime()))
      return `'${randomDate.toISOString().split('T')[0]}'`
    }
    case 'DATETIME':
    case 'TIMESTAMP': {
      const dtStart = new Date(2020, 0, 1)
      const dtEnd = new Date()
      const randomDt = new Date(dtStart.getTime() + Math.random() * (dtEnd.getTime() - dtStart.getTime()))
      return `'${randomDt.toISOString().replace('T', ' ').substring(0, 19)}'`
    }
    case 'DECIMAL':
    case 'FLOAT':
      return (Math.random() * (maxValue - minValue) + minValue).toFixed(2)
    case 'UUID':
      return `'${generateUuid()}'`
    case 'EMAIL': {
      const domains = ['gmail.com', 'outlook.com', 'qq.com', '163.com']
      return `'${Math.random().toString(36).substring(2, 8)}@${domains[Math.floor(Math.random() * domains.length)]}'`
    }
    case 'NAME':
      return `'${SAMPLE_NAMES[Math.floor(Math.random() * SAMPLE_NAMES.length)]}'`
    case 'PHONE': {
      const prefixes = ['138', '139', '150', '151', '186', '187']
      return `'${prefixes[Math.floor(Math.random() * prefixes.length)]}${Math.random().toString().substring(2, 10)}'`
    }
    case 'ADDRESS': {
      const city = SAMPLE_CITIES[Math.floor(Math.random() * SAMPLE_CITIES.length)]
      return `'${city}市某某路${Math.floor(Math.random() * 999) + 1}号'`
    }
    default:
      return null
  }
}

function generateInsertStatement(tableName: string, columns: ColumnDefinition[], count: number): string {
  const columnNames = columns.map(c => c.name).join(', ')
  const statements: string[] = []

  for (let i = 0; i < count; i++) {
    const values = columns.map(col => {
      const val = generateValue(col)
      return val === null ? 'NULL' : val
    })
    statements.push(`INSERT INTO ${tableName} (${columnNames}) VALUES (${values.join(', ')};`)
  }

  return statements.join('\n')
}

function generateBatchInsert(tableName: string, columns: ColumnDefinition[], count: number): string {
  const columnNames = columns.map(c => c.name).join(', ')
  const valueRows: string[] = []

  for (let i = 0; i < count; i++) {
    const values = columns.map(col => {
      const val = generateValue(col)
      return val === null ? 'NULL' : val
    })
    valueRows.push(`(${values.join(', ')})`)
  }

  return `INSERT INTO ${tableName} (${columnNames}) VALUES\n${valueRows.join(',\n')};`
}

export default function SqlGenerator() {
  const [tableName, setTableName] = useState('users')
  const [columns, setColumns] = useState<ColumnDefinition[]>([
    { id: generateId(), name: 'id', type: 'INT', nullable: false },
    { id: generateId(), name: 'name', type: 'VARCHAR', nullable: false, maxLength: 50 },
    { id: generateId(), name: 'email', type: 'EMAIL', nullable: false },
  ])
  const [count, setCount] = useState(10)
  const [batchMode, setBatchMode] = useState(true)
  const [results, setResults] = useState<string>('')
  const addRecentTool = useAppStore((s) => s.addRecentTool)
  const { copy, copied } = useClipboard()

  const addColumn = useCallback(() => {
    setColumns(prev => [...prev, {
      id: generateId(),
      name: `column_${prev.length + 1}`,
      type: 'VARCHAR',
      nullable: true,
      maxLength: 255,
    }])
  }, [])

  const removeColumn = useCallback((id: string) => {
    setColumns(prev => prev.filter(c => c.id !== id))
  }, [])

  const updateColumn = useCallback((id: string, updates: Partial<ColumnDefinition>) => {
    setColumns(prev => prev.map(c => c.id === id ? { ...c, ...updates } : c))
  }, [])

  const generate = useCallback(() => {
    addRecentTool(meta.id)
    const sql = batchMode
      ? generateBatchInsert(tableName, columns, count)
      : generateInsertStatement(tableName, columns, count)
    setResults(sql)
  }, [tableName, columns, count, batchMode, addRecentTool])

  const downloadSql = useCallback(() => {
    if (!results) return
    const blob = new Blob([results], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${tableName}_data.sql`
    a.click()
    URL.revokeObjectURL(url)
  }, [results, tableName])

  const reset = () => {
    setTableName('users')
    setColumns([
      { id: generateId(), name: 'id', type: 'INT', nullable: false },
      { id: generateId(), name: 'name', type: 'VARCHAR', nullable: false, maxLength: 50 },
      { id: generateId(), name: 'email', type: 'EMAIL', nullable: false },
    ])
    setCount(10)
    setResults('')
  }

  return (
    <ToolLayout meta={meta} onReset={reset} outputValue={results}>
      <div className="flex items-center gap-2 mb-4 flex-wrap">
        <button onClick={generate} className="btn-primary">
          <RefreshCw className="w-4 h-4" />
          生成
        </button>
        <button onClick={addColumn} className="btn-ghost">
          <Plus className="w-4 h-4" />
          添加列
        </button>
        
        <div className="flex items-center gap-2 ml-4">
          <label className="text-xs text-text-muted">表名:</label>
          <input
            type="text"
            value={tableName}
            onChange={e => setTableName(e.target.value)}
            className="w-28 px-2 py-1.5 rounded-lg bg-bg-surface border border-border-base text-sm text-text-primary focus:outline-none focus:border-accent font-mono"
          />
        </div>
        
        <div className="flex items-center gap-2">
          <label className="text-xs text-text-muted">行数:</label>
          <input
            type="number"
            min={1}
            max={10000}
            value={count}
            onChange={e => setCount(Math.max(1, Math.min(10000, parseInt(e.target.value) || 1)))}
            className="w-20 px-2 py-1.5 rounded-lg bg-bg-surface border border-border-base text-sm text-text-primary focus:outline-none focus:border-accent"
          />
        </div>

        <label className="flex items-center gap-2 cursor-pointer ml-4">
          <input
            type="checkbox"
            checked={batchMode}
            onChange={e => setBatchMode(e.target.checked)}
            className="w-4 h-4 rounded border-border-base bg-bg-surface accent-accent"
          />
          <span className="text-xs text-text-muted">批量INSERT模式</span>
        </label>

        {results && (
          <button onClick={downloadSql} className="btn-ghost ml-auto">
            <Download className="w-4 h-4" />
            下载SQL
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 h-[calc(100vh-20rem)]">
        <div className="flex flex-col gap-2">
          <label className="text-xs font-medium text-text-muted uppercase tracking-wider">
            表结构定义 ({columns.length} 列)
          </label>
          <div className="flex-1 overflow-y-auto space-y-2 p-3 rounded-xl bg-bg-surface border border-border-base">
            {columns.map(column => (
              <div key={column.id} className="flex items-center gap-2 p-2 rounded-lg bg-bg-raised border border-border-base flex-wrap">
                <input
                  type="text"
                  value={column.name}
                  onChange={e => updateColumn(column.id, { name: e.target.value })}
                  placeholder="列名"
                  className="w-24 px-2 py-1 rounded bg-bg-surface border border-border-base text-sm text-text-primary focus:outline-none focus:border-accent font-mono"
                />
                <select
                  value={column.type}
                  onChange={e => updateColumn(column.id, { type: e.target.value as SqlDataType })}
                  className="px-2 py-1 rounded bg-bg-surface border border-border-base text-sm text-text-primary focus:outline-none focus:border-accent"
                >
                  {SQL_DATA_TYPES.map(t => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
                <label className="flex items-center gap-1 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={column.nullable}
                    onChange={e => updateColumn(column.id, { nullable: e.target.checked })}
                    className="w-3 h-3 rounded border-border-base bg-bg-surface accent-accent"
                  />
                  <span className="text-xs text-text-muted">NULL</span>
                </label>
                {(column.type === 'VARCHAR' || column.type === 'TEXT') && (
                  <input
                    type="number"
                    value={column.maxLength ?? 255}
                    onChange={e => updateColumn(column.id, { maxLength: parseInt(e.target.value) || 255 })}
                    placeholder="长度"
                    min={1}
                    className="w-16 px-1 py-0.5 rounded bg-bg-surface border border-border-base text-xs text-text-primary focus:outline-none focus:border-accent"
                  />
                )}
                {(column.type === 'INT' || column.type === 'BIGINT' || column.type === 'DECIMAL' || column.type === 'FLOAT') && (
                  <>
                    <input
                      type="number"
                      value={column.minValue ?? ''}
                      onChange={e => updateColumn(column.id, { minValue: e.target.value ? parseInt(e.target.value) : undefined })}
                      placeholder="最小"
                      className="w-14 px-1 py-0.5 rounded bg-bg-surface border border-border-base text-xs text-text-primary focus:outline-none focus:border-accent"
                    />
                    <input
                      type="number"
                      value={column.maxValue ?? ''}
                      onChange={e => updateColumn(column.id, { maxValue: e.target.value ? parseInt(e.target.value) : undefined })}
                      placeholder="最大"
                      className="w-14 px-1 py-0.5 rounded bg-bg-surface border border-border-base text-xs text-text-primary focus:outline-none focus:border-accent"
                    />
                  </>
                )}
                <button
                  onClick={() => removeColumn(column.id)}
                  className="p-1 rounded hover:bg-rose-500/10 text-text-muted hover:text-rose-400 transition-colors ml-auto"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
            {columns.length === 0 && (
              <p className="text-center text-text-muted text-sm py-4">点击"添加列"开始定义表结构</p>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-medium text-text-muted uppercase tracking-wider">生成的SQL</label>
            {results && (
              <button onClick={() => copy(results)} className="btn-ghost text-xs">
                {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                {copied ? '已复制' : '复制'}
              </button>
            )}
          </div>
          {results ? (
            <pre className="flex-1 overflow-auto p-3 rounded-xl bg-bg-surface border border-border-base text-xs font-mono text-text-primary leading-relaxed whitespace-pre-wrap">
              {results}
            </pre>
          ) : (
            <div className="flex-1 rounded-xl bg-bg-raised border border-border-base flex items-center justify-center">
              <p className="text-text-muted text-sm">定义表结构后点击生成</p>
            </div>
          )}
        </div>
      </div>
    </ToolLayout>
  )
}
