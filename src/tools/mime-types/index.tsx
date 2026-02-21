import { useState, useMemo } from 'react'
import { ToolLayout } from '@/components/tool/ToolLayout'
import { meta } from './meta'
import { MIME_TYPES, searchMimeTypes } from '@it-toolbox/core'

export default function MimeTypesTool() {
  const [search, setSearch] = useState('')

  const filteredTypes = useMemo(() => {
    if (!search) return MIME_TYPES
    return searchMimeTypes(search)
  }, [search])

  return (
    <ToolLayout meta={meta}>
      <div className="mb-4">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="搜索扩展名或 MIME 类型..."
          className="tool-input"
        />
      </div>

      <div className="overflow-x-auto max-h-[calc(100vh-16rem)]">
        <table className="w-full text-sm">
          <thead className="bg-bg-raised sticky top-0">
            <tr>
              <th className="px-4 py-2 text-left text-text-primary font-medium">扩展名</th>
              <th className="px-4 py-2 text-left text-text-primary font-medium">MIME 类型</th>
              <th className="px-4 py-2 text-left text-text-primary font-medium">描述</th>
            </tr>
          </thead>
          <tbody>
            {filteredTypes.map((mime, i) => (
              <tr key={i} className="border-b border-border-base hover:bg-bg-surface">
                <td className="px-4 py-2 font-mono text-accent">{mime.extension}</td>
                <td className="px-4 py-2 font-mono text-text-primary">{mime.mimeType}</td>
                <td className="px-4 py-2 text-text-secondary">{mime.description}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {filteredTypes.length === 0 && (
          <div className="text-center text-text-muted py-8">未找到匹配的 MIME 类型</div>
        )}
      </div>
    </ToolLayout>
  )
}
