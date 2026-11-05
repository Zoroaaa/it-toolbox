import { Link } from '@tanstack/react-router'
import { Star } from 'lucide-react'
import type { ToolMeta } from '@toolbox/types/tool'
import { useAppStore } from '@/store/app'
import { getIconComponent } from '@/utils/icons'
import { preloadTool } from '@/lib/tool-loader'

interface ToolCardProps {
  tool: ToolMeta
}

export function ToolCard({ tool }: ToolCardProps) {
  const isFavorited = useAppStore((s) => s.isFavorited)
const toggleFavorite = useAppStore((s) => s.toggleFavorite)
  const favorited = isFavorited(tool.id)
  const IconComp = getIconComponent(tool.icon)
  const preload = () => preloadTool(tool.id)

  return (
    <Link
      to="/tool/$id"
      params={{ id: tool.id }}
      className="card p-4 group flex flex-col gap-3 cursor-pointer"
      onMouseEnter={preload}
      onTouchStart={preload}
    >
      <div className="flex items-start justify-between">
        <div className="w-9 h-9 rounded-lg bg-accent/8 border border-accent/15 flex items-center justify-center group-hover:bg-accent/15 transition-colors duration-150">
          {IconComp && <IconComp className="w-4 h-4 text-accent" />}
        </div>
        <div className="flex items-center gap-1.5">
          <button
            onClick={e => { e.preventDefault(); toggleFavorite(tool.id) }}
            aria-label={favorited ? '取消收藏' : '收藏'}
            aria-pressed={favorited}
            className="opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity duration-150 p-1 rounded hover:bg-bg-overlay"
          >
            <Star className={`w-3.5 h-3.5 ${favorited ? 'fill-accent text-accent' : 'text-text-muted'}`} />
          </button>
        </div>
      </div>

      <div>
        <h3 className="text-sm font-medium text-text-primary group-hover:text-accent transition-colors duration-150">
          {tool.name}
        </h3>
        <p className="text-xs text-text-muted mt-0.5 line-clamp-2 leading-relaxed">
          {tool.description}
        </p>
      </div>
    </Link>
  )
}
