import { Link } from '@tanstack/react-router'
import { Star } from 'lucide-react'
import type { ToolMeta } from '@toolbox/types/tool'
import { useAppStore } from '@/store/app'
import * as Icons from 'lucide-react'

interface ToolCardProps {
  tool: ToolMeta
}

export function ToolCard({ tool }: ToolCardProps) {
  const { isFavorited, toggleFavorite } = useAppStore()
  const favorited = isFavorited(tool.id)
  const IconComp = (Icons as Record<string, React.ComponentType<{ className?: string }>>)[tool.icon]

  return (
    <Link
      to="/tool/$id"
      params={{ id: tool.id }}
      className="card p-4 group flex flex-col gap-3 cursor-pointer"
    >
      <div className="flex items-start justify-between">
        <div className="w-9 h-9 rounded-lg bg-accent/8 border border-accent/15 flex items-center justify-center group-hover:bg-accent/15 transition-colors duration-150">
          {IconComp && <IconComp className="w-4 h-4 text-accent" />}
        </div>
        <div className="flex items-center gap-1.5">
          {tool.isNew && <span className="badge text-xs">NEW</span>}
          <button
            onClick={e => { e.preventDefault(); toggleFavorite(tool.id) }}
            className="opacity-0 group-hover:opacity-100 transition-opacity duration-150 p-1 rounded hover:bg-bg-overlay"
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
