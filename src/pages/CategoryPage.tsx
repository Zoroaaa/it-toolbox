import { useParams } from '@tanstack/react-router'
import { ToolCard } from '@/components/ui/ToolCard'
import { getToolsByCategory } from '@/registry'
import type { Category } from '@toolbox/types/tool'
import { CATEGORY_LABELS } from '@toolbox/types/tool'

export function CategoryPage() {
  const { name } = useParams({ from: '/category/$name' })
  const tools = getToolsByCategory(name)
  const label = CATEGORY_LABELS[name as Category] ?? name

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-text-primary mb-1">{label}</h1>
        <p className="text-text-secondary text-sm">{tools.length} 个工具</p>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {tools.map(tool => <ToolCard key={tool.id} tool={tool} />)}
      </div>
    </div>
  )
}
