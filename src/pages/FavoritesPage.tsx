import { Star } from 'lucide-react'
import { ToolCard } from '@/components/ui/ToolCard'
import { useAppStore } from '@/store/app'
import { getToolById } from '@/registry'

export function FavoritesPage() {
  const { favorites } = useAppStore()
  const tools = favorites.map(id => getToolById(id)).filter(Boolean) as ReturnType<typeof getToolById>[]

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-text-primary mb-1">收藏夹</h1>
        <p className="text-text-secondary text-sm">{favorites.length} 个收藏的工具</p>
      </div>

      {tools.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 gap-3 text-center">
          <div className="w-14 h-14 rounded-2xl bg-bg-surface border border-border-base flex items-center justify-center">
            <Star className="w-6 h-6 text-text-muted" />
          </div>
          <p className="text-text-secondary font-medium">还没有收藏的工具</p>
          <p className="text-text-muted text-sm">在任意工具页面点击 ☆ 收藏</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {tools.map(tool => tool && <ToolCard key={tool.id} tool={tool} />)}
        </div>
      )}
    </div>
  )
}
