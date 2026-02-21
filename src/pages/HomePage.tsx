import { useState, useMemo } from 'react'
import { Search } from 'lucide-react'
import { toolRegistry, searchTools, getToolsByCategory } from '@/registry'
import { ToolCard } from '@/components/ui/ToolCard'
import { CATEGORY_LABELS, CATEGORY_ORDER } from '@toolbox/types/tool'

export function HomePage() {
  const [query, setQuery] = useState('')
  const results = useMemo(() => query ? searchTools(query) : null, [query])

  const categories = CATEGORY_ORDER

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-text-primary mb-1">
          开发者工具箱
        </h1>
        <p className="text-text-secondary text-sm">
          {toolRegistry.length} 个工具，覆盖开发全场景
        </p>
      </div>

      <div className="relative mb-8">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
        <input
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="搜索工具... (或按 ⌘K)"
          className="tool-input pl-9"
        />
      </div>

      {results ? (
        <div>
          <p className="text-sm text-text-muted mb-4">找到 {results.length} 个工具</p>
          {results.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {results.map(tool => <ToolCard key={tool.id} tool={tool} />)}
            </div>
          ) : (
            <div className="text-center py-16 text-text-muted">
              <p className="text-lg mb-2">没有找到相关工具</p>
              <p className="text-sm">试试其他关键词</p>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-8">
          {categories.map(cat => {
            const tools = getToolsByCategory(cat)
            if (tools.length === 0) return null
            return (
              <section key={cat}>
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-sm font-medium text-text-secondary uppercase tracking-wider">
                    {CATEGORY_LABELS[cat]}
                  </h2>
                  <span className="text-xs text-text-muted">{tools.length} 个</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                  {tools.map(tool => <ToolCard key={tool.id} tool={tool} />)}
                </div>
              </section>
            )
          })}
        </div>
      )}
    </div>
  )
}
