import { useState, useMemo } from 'react'
import { Search, Copy, Check } from 'lucide-react'
import { ToolLayout } from '@/components/tool/ToolLayout'
import { getAsciiTable, searchAscii } from '@core/index'
import { useAppStore } from '@/store/app'
import { useClipboard } from '@/hooks/useClipboard'
import { meta } from './meta'

export default function AsciiTable() {
  const [query, setQuery] = useState('')
  const { addRecentTool } = useAppStore()
  const { copy, copied } = useClipboard()

  const table = useMemo(() => {
    addRecentTool(meta.id)
    return query ? searchAscii(query) : getAsciiTable()
  }, [query, addRecentTool])

  const reset = () => {
    setQuery('')
  }

  return (
    <ToolLayout meta={meta} onReset={reset}>
      <div className="flex items-center gap-2 mb-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="搜索字符、码值或描述..."
            className="w-full pl-9 pr-3 py-2 rounded-lg bg-bg-raised border border-border-base text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent"
          />
        </div>
        <span className="text-xs text-text-muted">{table.length} 条记录</span>
      </div>

      <div className="overflow-auto h-[calc(100vh-16rem)] rounded-lg border border-border-base">
        <table className="w-full text-xs">
          <thead className="sticky top-0 bg-bg-surface border-b border-border-base">
            <tr>
              <th className="px-3 py-2 text-left font-medium text-text-secondary">十进制</th>
              <th className="px-3 py-2 text-left font-medium text-text-secondary">十六进制</th>
              <th className="px-3 py-2 text-left font-medium text-text-secondary">字符</th>
              <th className="px-3 py-2 text-left font-medium text-text-secondary">HTML 实体</th>
              <th className="px-3 py-2 text-left font-medium text-text-secondary">描述</th>
              <th className="px-3 py-2 text-left font-medium text-text-secondary">操作</th>
            </tr>
          </thead>
          <tbody>
            {table.map(entry => (
              <tr key={entry.code} className="border-b border-border-base hover:bg-bg-raised transition-colors">
                <td className="px-3 py-2 font-mono text-text-primary">{entry.code}</td>
                <td className="px-3 py-2 font-mono text-text-primary">{entry.hex}</td>
                <td className="px-3 py-2 font-mono text-text-primary">
                  {entry.char ? (
                    <span className="inline-block w-6 h-6 text-center leading-6 bg-bg-raised rounded">
                      {entry.char}
                    </span>
                  ) : (
                    <span className="text-text-muted">-</span>
                  )}
                </td>
                <td className="px-3 py-2 font-mono text-text-muted">{entry.htmlEntity || '-'}</td>
                <td className="px-3 py-2 text-text-secondary">{entry.description || '-'}</td>
                <td className="px-3 py-2">
                  {entry.char && (
                    <button
                      onClick={() => copy(entry.char)}
                      className="p-1 rounded hover:bg-bg-surface transition-colors"
                    >
                      {copied ? <Check className="w-3.5 h-3.5 text-accent" /> : <Copy className="w-3.5 h-3.5 text-text-muted" />}
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </ToolLayout>
  )
}
