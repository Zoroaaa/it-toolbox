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
      <div className="space-y-4">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="搜索扩展名或 MIME 类型..."
          className="w-full px-3 py-2 bg-bg-secondary border border-border-primary rounded-lg text-text-primary placeholder-text-tertiary focus:outline-none focus:ring-2 focus:ring-accent-primary text-sm"
        />

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-bg-tertiary">
              <tr>
                <th className="px-4 py-2 text-left text-text-primary font-medium">扩展名</th>
                <th className="px-4 py-2 text-left text-text-primary font-medium">MIME 类型</th>
                <th className="px-4 py-2 text-left text-text-primary font-medium">描述</th>
              </tr>
            </thead>
            <tbody>
              {filteredTypes.map((mime, i) => (
                <tr key={i} className="border-b border-border-primary hover:bg-bg-secondary">
                  <td className="px-4 py-2 font-mono text-accent-primary">{mime.extension}</td>
                  <td className="px-4 py-2 font-mono text-text-primary">{mime.mimeType}</td>
                  <td className="px-4 py-2 text-text-secondary">{mime.description}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredTypes.length === 0 && (
          <div className="text-center text-text-tertiary py-8">未找到匹配的 MIME 类型</div>
        )}
      </div>
    </ToolLayout>
  )
}
