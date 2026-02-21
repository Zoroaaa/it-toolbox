import { useState, useMemo } from 'react'
import { ToolLayout } from '@/components/tool/ToolLayout'
import { meta } from './meta'
import { HTTP_STATUS_CODES, searchHttpStatus } from '@it-toolbox/core'

const CATEGORY_COLORS: Record<string, string> = {
  'informational': 'bg-blue-500/20 text-blue-400',
  'success': 'bg-green-500/20 text-green-400',
  'redirection': 'bg-yellow-500/20 text-yellow-400',
  'client-error': 'bg-orange-500/20 text-orange-400',
  'server-error': 'bg-red-500/20 text-red-400',
}

const CATEGORY_LABELS: Record<string, string> = {
  'informational': '信息响应',
  'success': '成功响应',
  'redirection': '重定向',
  'client-error': '客户端错误',
  'server-error': '服务器错误',
}

export default function HttpStatusTool() {
  const [search, setSearch] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)

  const filteredStatus = useMemo(() => {
    let result = HTTP_STATUS_CODES
    if (search) {
      result = searchHttpStatus(search)
    }
    if (selectedCategory) {
      result = result.filter((s) => s.category === selectedCategory)
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
          placeholder="搜索状态码或描述..."
          className="flex-1 min-w-48 tool-input !py-2"
        />

        <select
          value={selectedCategory || ''}
          onChange={(e) => setSelectedCategory(e.target.value || null)}
          className="px-3 py-2 bg-bg-surface border border-border-base rounded-lg text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-accent"
        >
          <option value="">所有类别</option>
          <option value="informational">信息响应 (1xx)</option>
          <option value="success">成功响应 (2xx)</option>
          <option value="redirection">重定向 (3xx)</option>
          <option value="client-error">客户端错误 (4xx)</option>
          <option value="server-error">服务器错误 (5xx)</option>
        </select>
      </div>

      <div className="grid gap-2 overflow-y-auto max-h-[calc(100vh-16rem)]">
        {filteredStatus.map((status) => (
          <div
            key={status.code}
            className="p-3 bg-bg-surface border border-border-base rounded-lg flex items-start gap-3"
          >
            <span className={`px-2 py-0.5 rounded text-sm font-mono font-medium ${CATEGORY_COLORS[status.category]}`}>
              {status.code}
            </span>
            <div className="flex-1 min-w-0">
              <div className="text-text-primary font-medium">{status.message}</div>
              <div className="text-text-secondary text-sm">{status.description}</div>
            </div>
            <span className="text-xs text-text-muted">{CATEGORY_LABELS[status.category]}</span>
          </div>
        ))}
        {filteredStatus.length === 0 && (
          <div className="text-center text-text-muted py-8">未找到匹配的状态码</div>
        )}
      </div>
    </ToolLayout>
  )
}
