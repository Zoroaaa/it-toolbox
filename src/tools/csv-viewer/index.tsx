import { useState, useMemo, useCallback } from 'react'
import { Upload, Download, Trash2 } from 'lucide-react'
import Papa from 'papaparse'
import { ToolLayout } from '@/components/tool/ToolLayout'
import { meta } from './meta'
import { useAppStore } from '@/store/app'

export default function CsvViewer() {
  const [input, setInput] = useState('')
  const [delimiter, setDelimiter] = useState(',')
  const [hasHeader, setHasHeader] = useState(true)
  const { addRecentTool } = useAppStore()

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

  const handleFileUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    addRecentTool(meta.id)
    const reader = new FileReader()
    reader.onload = (event) => {
      setInput(event.target?.result as string)
    }
    reader.readAsText(file)
  }, [addRecentTool])

  const exportJson = useCallback(() => {
    if (!parsedData?.data) return
    addRecentTool(meta.id)
    const json = JSON.stringify(parsedData.data, null, 2)
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'data.json'
    a.click()
    URL.revokeObjectURL(url)
  }, [parsedData, addRecentTool])

  const reset = () => {
    setInput('')
  }

  return (
    <ToolLayout meta={meta} onReset={reset}>
      <div className="flex items-center gap-2 mb-4 flex-wrap">
        <label className="px-4 py-2 bg-accent text-bg-base rounded-lg text-sm font-medium cursor-pointer hover:bg-accent-hover transition-colors">
          <Upload className="w-4 h-4 inline mr-2" />
          上传文件
          <input
            type="file"
            accept=".csv,.txt"
            onChange={handleFileUpload}
            className="hidden"
          />
        </label>

        {parsedData?.data && (
          <>
            <button onClick={exportJson} className="btn-primary">
              <Download className="w-4 h-4" />
              导出 JSON
            </button>
            <button
              onClick={() => navigator.clipboard.writeText(JSON.stringify(parsedData.data, null, 2))}
              className="btn-ghost"
            >
              复制 JSON
            </button>
          </>
        )}

        <div className="flex items-center gap-2 ml-auto">
          <span className="text-xs text-text-muted">分隔符</span>
          <select
            value={delimiter}
            onChange={(e) => setDelimiter(e.target.value)}
            className="px-2 py-1 rounded-md bg-bg-raised border border-border-base text-sm text-text-primary focus:outline-none"
          >
            <option value=",">逗号 (,)</option>
            <option value=";">分号 (;)</option>
            <option value="\t">制表符</option>
            <option value="|">竖线 (|)</option>
          </select>
        </div>

        <label className="flex items-center gap-2 text-sm text-text-secondary cursor-pointer">
          <input
            type="checkbox"
            checked={hasHeader}
            onChange={(e) => setHasHeader(e.target.checked)}
            className="rounded border-border-base"
          />
          首行为表头
        </label>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 h-[calc(100vh-20rem)]">
        <div className="flex flex-col gap-2">
          <label className="text-xs font-medium text-text-muted uppercase tracking-wider">CSV 输入</label>
          <textarea
            className="tool-input flex-1 font-mono text-xs leading-relaxed"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="输入 CSV 数据或上传文件..."
            spellCheck={false}
          />
          <div className="text-xs text-text-muted">{input.length} 字符</div>
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-xs font-medium text-text-muted uppercase tracking-wider">表格预览</label>
          <div className="flex-1 overflow-auto bg-bg-surface border border-border-base rounded-lg">
            {parsedData?.error ? (
              <div className="p-3 text-rose-400 text-sm">{parsedData.error}</div>
            ) : parsedData?.data ? (
              <table className="w-full text-sm">
                <thead className="bg-bg-raised sticky top-0">
                  <tr>
                    {parsedData.fields ? (
                      parsedData.fields.map((field, i) => (
                        <th key={i} className="px-3 py-2 text-left text-text-primary font-medium border-b border-border-base">
                          {field}
                        </th>
                      ))
                    ) : (
                      (parsedData.data[0] as string[]).map((_, i) => (
                        <th key={i} className="px-3 py-2 text-left text-text-primary font-medium border-b border-border-base">
                          列 {i + 1}
                        </th>
                      ))
                    )}
                  </tr>
                </thead>
                <tbody>
                  {(hasHeader ? parsedData.data : parsedData.data).map((row, i) => (
                    <tr key={i} className="border-b border-border-base hover:bg-bg-raised">
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
              <div className="p-3 text-text-muted text-sm">暂无数据</div>
            )}
          </div>
        </div>
      </div>
    </ToolLayout>
  )
}
