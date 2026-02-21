import { useState, useMemo } from 'react'
import { ToolLayout } from '@/components/tool/ToolLayout'
import { meta } from './meta'
import { HTTP_HEADERS, searchHttpHeaders } from '@it-toolbox/core'

const CATEGORY_COLORS: Record<string, string> = {
  'request': 'bg-blue-500/20 text-blue-400',
  'response': 'bg-green-500/20 text-green-400',
  'entity': 'bg-purple-500/20 text-purple-400',
  'general': 'bg-gray-500/20 text-gray-400',
}

const CATEGORY_LABELS: Record<string, string> = {
  'request': '请求头',
  'response': '响应头',
  'entity': '实体头',
  'general': '通用头',
}

export default function HttpHeadersTool() {
  const [search, setSearch] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)

  const filteredHeaders = useMemo(() => {
    let result = HTTP_HEADERS
    if (search) {
      result = searchHttpHeaders(search)
    }
    if (selectedCategory) {
      result = result.filter((h) => h.category === selectedCategory)
    }
    return result
  }, [search, selectedCategory])

  return (
    <ToolLayout meta={meta}>
      <div className="flex gap-4 mb-4 flex-wrap">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="搜索请求头名称或描述..."
          className="flex-1 min-w-48 tool-input !py-2"
        />

        <select
          value={selectedCategory || ''}
          onChange={(e) => setSelectedCategory(e.target.value || null)}
          className="px-3 py-2 bg-bg-surface border border-border-base rounded-lg text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-accent"
        >
          <option value="">所有类别</option>
          <option value="request">请求头</option>
          <option value="response">响应头</option>
          <option value="entity">实体头</option>
          <option value="general">通用头</option>
        </select>
      </div>

      <div className="grid gap-2 overflow-y-auto max-h-[calc(100vh-16rem)]">
        {filteredHeaders.map((header) => (
          <div
            key={header.name}
            className="p-3 bg-bg-surface border border-border-base rounded-lg"
          >
            <div className="flex items-center gap-2 mb-1">
              <span className="font-mono font-medium text-text-primary">{header.name}</span>
              <span className={`px-2 py-0.5 rounded text-xs ${CATEGORY_COLORS[header.category]}`}>
                {CATEGORY_LABELS[header.category]}
              </span>
            </div>
            <div className="text-text-secondary text-sm mb-2">{header.description}</div>
            {header.example && (
              <div className="p-2 bg-bg-raised rounded text-xs font-mono text-text-muted overflow-x-auto">
                {header.example}
              </div>
            )}
          </div>
        ))}
        {filteredHeaders.length === 0 && (
          <div className="text-center text-text-muted py-8">未找到匹配的请求头</div>
        )}
      </div>
    </ToolLayout>
  )
}
