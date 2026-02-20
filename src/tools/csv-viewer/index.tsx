import { useState, useMemo } from 'react'
import Papa from 'papaparse'
import { ToolLayout } from '@/components/tool/ToolLayout'
import { meta } from './meta'

export default function CsvViewer() {
  const [input, setInput] = useState('')
  const [delimiter, setDelimiter] = useState(',')
  const [hasHeader, setHasHeader] = useState(true)

  const parsedData = useMemo(() => {
    if (!input.trim()) return null

    try {
      const result = Papa.parse(input, {
        delimiter,
        header: hasHeader,
        skipEmptyLines: true,
      })

      if (result.errors.length > 0) {
        return { error: result.errors[0].message }
      }

      return {
        data: result.data as Record<string, string>[] | string[][],
        fields: result.meta.fields,
      }
    } catch (e) {
      return { error: (e as Error).message }
    }
  }, [input, delimiter, hasHeader])

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      setInput(event.target?.result as string)
    }
    reader.readAsText(file)
  }

  const exportJson = () => {
    if (!parsedData?.data) return
    const json = JSON.stringify(parsedData.data, null, 2)
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'data.json'
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <ToolLayout meta={meta}>
      <div className="space-y-4">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <label className="text-sm text-text-secondary">分隔符:</label>
            <select
              value={delimiter}
              onChange={(e) => setDelimiter(e.target.value)}
              className="px-3 py-1.5 bg-bg-secondary border border-border-primary rounded-lg text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-accent-primary"
            >
              <option value=",">逗号 (,)</option>
              <option value=";">分号 (;)</option>
              <option value="\t">制表符 (Tab)</option>
              <option value="|">竖线 (|)</option>
            </select>
          </div>

          <label className="flex items-center gap-2 text-sm text-text-secondary">
            <input
              type="checkbox"
              checked={hasHeader}
              onChange={(e) => setHasHeader(e.target.checked)}
              className="rounded border-border-primary text-accent-primary focus:ring-accent-primary"
            />
            首行为表头
          </label>

          <label className="px-4 py-1.5 bg-accent-primary text-white rounded-lg text-sm font-medium cursor-pointer hover:bg-accent-secondary transition-colors">
            上传文件
            <input
              type="file"
              accept=".csv,.txt"
              onChange={handleFileUpload}
              className="hidden"
            />
          </label>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">CSV 输入</label>
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="输入 CSV 数据或上传文件..."
              className="w-full h-80 px-3 py-2 bg-bg-secondary border border-border-primary rounded-lg text-text-primary placeholder-text-tertiary focus:outline-none focus:ring-2 focus:ring-accent-primary font-mono text-sm resize-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">表格预览</label>
            <div className="w-full h-80 overflow-auto bg-bg-secondary border border-border-primary rounded-lg">
              {parsedData?.error ? (
                <div className="p-3 text-red-400 text-sm">{parsedData.error}</div>
              ) : parsedData?.data ? (
                <table className="w-full text-sm">
                  <thead className="bg-bg-tertiary sticky top-0">
                    <tr>
                      {parsedData.fields ? (
                        parsedData.fields.map((field, i) => (
                          <th key={i} className="px-3 py-2 text-left text-text-primary font-medium border-b border-border-primary">
                            {field}
                          </th>
                        ))
                      ) : (
                        (parsedData.data[0] as string[]).map((_, i) => (
                          <th key={i} className="px-3 py-2 text-left text-text-primary font-medium border-b border-border-primary">
                            列 {i + 1}
                          </th>
                        ))
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {(hasHeader ? parsedData.data : parsedData.data).map((row, i) => (
                      <tr key={i} className="border-b border-border-primary hover:bg-bg-tertiary">
                        {Object.values(row).map((cell, j) => (
                          <td key={j} className="px-3 py-2 text-text-secondary">
                            {cell}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="p-3 text-text-tertiary text-sm">暂无数据</div>
              )}
            </div>
          </div>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => {
              setInput('')
            }}
            className="px-4 py-2 bg-bg-secondary text-text-secondary rounded-lg text-sm font-medium hover:bg-bg-tertiary transition-colors"
          >
            清空
          </button>
          {parsedData?.data && (
            <>
              <button
                onClick={exportJson}
                className="px-4 py-2 bg-accent-primary text-white rounded-lg text-sm font-medium hover:bg-accent-secondary transition-colors"
              >
                导出 JSON
              </button>
              <button
                onClick={() => navigator.clipboard.writeText(JSON.stringify(parsedData.data, null, 2))}
                className="px-4 py-2 bg-bg-secondary text-text-secondary rounded-lg text-sm font-medium hover:bg-bg-tertiary transition-colors"
              >
                复制 JSON
              </button>
            </>
          )}
        </div>
      </div>
    </ToolLayout>
  )
}
