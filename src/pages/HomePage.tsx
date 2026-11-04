import { useState, useMemo } from 'react'
import { Link } from '@tanstack/react-router'
import { Search, ChevronRight } from 'lucide-react'
import { toolRegistry, searchTools, getToolsByCategory } from '@/registry'
import { CATEGORY_LABELS, CATEGORY_ORDER, CATEGORY_ICONS } from '@toolbox/types/tool'
import { getIconComponent } from '@/utils/icons'
import { ToolCard } from '@/components/ui/ToolCard'
import { preloadTools } from '@/lib/tool-loader'

export function HomePage() {
  const [query, setQuery] = useState('')

  const results = useMemo(() => (query.trim() ? searchTools(query) : null), [query])

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
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
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
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {categories.map(cat => {
            const tools = getToolsByCategory(cat)
            const IconComp = getIconComponent(CATEGORY_ICONS[cat])
            return (
              <Link
                key={cat}
                to="/category/$name"
                params={{ name: cat }}
                onMouseEnter={() => preloadTools(tools.map((tool) => tool.id), 3)}
                onTouchStart={() => preloadTools(tools.map((tool) => tool.id), 3)}
                className="card p-5 group hover:border-accent/30 transition-all duration-200"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="w-10 h-10 rounded-xl bg-accent/8 border border-accent/15 flex items-center justify-center group-hover:bg-accent/15 transition-colors">
                    {IconComp && <IconComp className="w-5 h-5 text-accent" />}
                  </div>
                  <ChevronRight className="w-4 h-4 text-text-muted group-hover:text-accent group-hover:translate-x-0.5 transition-all" />
                </div>
                <h3 className="text-sm font-medium text-text-primary group-hover:text-accent transition-colors">
                  {CATEGORY_LABELS[cat]}
                </h3>
                <p className="text-xs text-text-muted mt-1">
                  {tools.length} 个工具
                </p>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
