import { useState, useMemo } from 'react'
import { ToolLayout } from '@/components/tool/ToolLayout'
import { meta } from './meta'

type SortMode = 'none' | 'asc' | 'desc' | 'natural' | 'shuffle' | 'reverse'
type FilterMode = 'none' | 'unique' | 'empty' | 'non-empty' | 'duplicates'

export default function LineSorter() {
  const [input, setInput] = useState('')
  const [sortMode, setSortMode] = useState<SortMode>('none')
  const [filterMode, setFilterMode] = useState<FilterMode>('none')
  const [addLineNumbers, setAddLineNumbers] = useState(false)
  const [extractLine, setExtractLine] = useState('')
  const [lineRange, setLineRange] = useState({ start: '', end: '' })

  const output = useMemo(() => {
    if (!input.trim()) return ''

    let lines = input.split('\n')

    if (filterMode !== 'none') {
      switch (filterMode) {
        case 'unique':
          lines = [...new Set(lines)]
          break
        case 'empty':
          lines = lines.filter((line) => line.trim() === '')
          break
        case 'non-empty':
          lines = lines.filter((line) => line.trim() !== '')
          break
        case 'duplicates':
          const seen = new Set<string>()
          const duplicates = new Set<string>()
          lines.forEach((line) => {
            if (seen.has(line)) {
              duplicates.add(line)
            } else {
              seen.add(line)
            }
          })
          lines = lines.filter((line) => duplicates.has(line))
          break
      }
    }

    if (sortMode !== 'none') {
      switch (sortMode) {
        case 'asc':
          lines = [...lines].sort((a, b) => a.localeCompare(b))
          break
        case 'desc':
          lines = [...lines].sort((a, b) => b.localeCompare(a))
          break
        case 'natural':
          lines = [...lines].sort((a, b) =>
            a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' })
          )
          break
        case 'shuffle':
          for (let i = lines.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1))
            ;[lines[i], lines[j]] = [lines[j], lines[i]]
          }
          break
        case 'reverse':
          lines = [...lines].reverse()
          break
      }
    }

    if (lineRange.start || lineRange.end) {
      const start = parseInt(lineRange.start) || 1
      const end = lineRange.end ? parseInt(lineRange.end) : lines.length
      lines = lines.slice(start - 1, end)
    }

    if (extractLine) {
      const lineNum = parseInt(extractLine)
      if (lineNum > 0 && lineNum <= lines.length) {
        lines = [lines[lineNum - 1]]
      } else {
        lines = []
      }
    }

    if (addLineNumbers) {
      lines = lines.map((line, i) => `${i + 1}. ${line}`)
    }

    return lines.join('\n')
  }, [input, sortMode, filterMode, addLineNumbers, extractLine, lineRange])

  const stats = useMemo(() => {
    const lines = input.split('\n')
    return {
      total: lines.length,
      nonEmpty: lines.filter((l) => l.trim()).length,
      empty: lines.filter((l) => !l.trim()).length,
      unique: new Set(lines).size,
    }
  }, [input])

  const reset = () => {
    setInput('')
    setSortMode('none')
    setFilterMode('none')
    setAddLineNumbers(false)
    setExtractLine('')
    setLineRange({ start: '', end: '' })
  }

  return (
    <ToolLayout meta={meta} onReset={reset} outputValue={output}>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <div>
          <label className="text-xs font-medium text-text-muted uppercase tracking-wider block mb-2">
            排序方式
          </label>
          <select
            value={sortMode}
            onChange={(e) => setSortMode(e.target.value as SortMode)}
            className="w-full px-3 py-2 bg-bg-surface border border-border-base rounded-lg text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-accent"
          >
            <option value="none">不排序</option>
            <option value="asc">升序 (A-Z)</option>
            <option value="desc">降序 (Z-A)</option>
            <option value="natural">自然排序</option>
            <option value="shuffle">随机打乱</option>
            <option value="reverse">反转顺序</option>
          </select>
        </div>

        <div>
          <label className="text-xs font-medium text-text-muted uppercase tracking-wider block mb-2">
            过滤方式
          </label>
          <select
            value={filterMode}
            onChange={(e) => setFilterMode(e.target.value as FilterMode)}
            className="w-full px-3 py-2 bg-bg-surface border border-border-base rounded-lg text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-accent"
          >
            <option value="none">不过滤</option>
            <option value="unique">去重</option>
            <option value="empty">只保留空行</option>
            <option value="non-empty">去除空行</option>
            <option value="duplicates">只保留重复行</option>
          </select>
        </div>

        <div className="flex items-end">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={addLineNumbers}
              onChange={(e) => setAddLineNumbers(e.target.checked)}
              className="w-4 h-4 rounded border-border-base"
            />
            <span className="text-sm text-text-secondary">添加行号</span>
          </label>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div>
          <label className="text-xs font-medium text-text-muted uppercase tracking-wider block mb-2">
            提取第 N 行
          </label>
          <input
            type="number"
            value={extractLine}
            onChange={(e) => setExtractLine(e.target.value)}
            placeholder="留空不提取"
            min="1"
            className="tool-input"
          />
        </div>

        <div>
          <label className="text-xs font-medium text-text-muted uppercase tracking-wider block mb-2">
            行范围 (起始-结束)
          </label>
          <div className="flex items-center gap-2">
            <input
              type="number"
              value={lineRange.start}
              onChange={(e) => setLineRange((prev) => ({ ...prev, start: e.target.value }))}
              placeholder="起始"
              min="1"
              className="tool-input"
            />
            <span className="text-text-muted">-</span>
            <input
              type="number"
              value={lineRange.end}
              onChange={(e) => setLineRange((prev) => ({ ...prev, end: e.target.value }))}
              placeholder="结束"
              min="1"
              className="tool-input"
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 text-xs mb-4">
        <div className="bg-bg-raised border border-border-base rounded-lg p-2 text-center">
          <div className="text-text-muted">总行数</div>
          <div className="text-lg font-bold text-text-primary">{stats.total}</div>
        </div>
        <div className="bg-bg-raised border border-border-base rounded-lg p-2 text-center">
          <div className="text-text-muted">非空行</div>
          <div className="text-lg font-bold text-text-primary">{stats.nonEmpty}</div>
        </div>
        <div className="bg-bg-raised border border-border-base rounded-lg p-2 text-center">
          <div className="text-text-muted">空行</div>
          <div className="text-lg font-bold text-text-primary">{stats.empty}</div>
        </div>
        <div className="bg-bg-raised border border-border-base rounded-lg p-2 text-center">
          <div className="text-text-muted">唯一行</div>
          <div className="text-lg font-bold text-text-primary">{stats.unique}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 h-[calc(100vh-32rem)]">
        <div className="flex flex-col gap-2">
          <label className="text-xs font-medium text-text-muted uppercase tracking-wider">
            输入
          </label>
          <textarea
            className="tool-input flex-1 font-mono text-xs leading-relaxed"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="输入文本，每行一个..."
            spellCheck={false}
          />
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-xs font-medium text-text-muted uppercase tracking-wider">
            输出
          </label>
          <textarea
            className="tool-input flex-1 font-mono text-xs leading-relaxed"
            value={output}
            readOnly
            placeholder="结果将在这里显示..."
            spellCheck={false}
          />
        </div>
      </div>
    </ToolLayout>
  )
}
