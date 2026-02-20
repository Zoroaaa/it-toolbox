import { Link, useRouterState } from '@tanstack/react-router'
import { Wrench } from 'lucide-react'
import type { Category } from '@toolbox/types/tool'
import { CATEGORY_LABELS, CATEGORY_ICONS } from '@toolbox/types/tool'
import { toolRegistry } from '@/registry'
import { getIconComponent } from '@/utils/icons'
import { useAppStore } from '@/store/app'

const categories = Object.keys(CATEGORY_LABELS) as Category[]

export function Sidebar() {
  const routerState = useRouterState()
  const pathname = routerState.location.pathname
  const { favorites } = useAppStore()

  return (
    <aside className="w-56 flex-shrink-0 flex flex-col bg-bg-surface border-r border-border-base h-screen sticky top-0 overflow-y-auto">
      <div className="px-4 py-5 border-b border-border-base">
        <Link to="/" className="flex items-center gap-2.5 group">
          <div className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center">
            <Wrench className="w-4 h-4 text-bg-base" />
          </div>
          <span className="font-semibold text-text-primary font-mono tracking-tight">
            IT Toolbox
          </span>
        </Link>
      </div>

      <nav className="flex-1 px-2 py-3 space-y-0.5">
        <NavItem to="/" label="所有工具" icon="LayoutGrid" active={pathname === '/'} count={toolRegistry.length} />
        <NavItem to="/favorites" label="收藏夹" icon="Star" active={pathname === '/favorites'} count={favorites.length} />
        <NavItem to="/history" label="最近使用" icon="Clock" active={pathname === '/history'} />

        <div className="pt-3 pb-1">
          <p className="px-3 text-xs font-medium text-text-muted uppercase tracking-wider">分类</p>
        </div>

        {categories.map(cat => {
          const IconComp = getIconComponent(CATEGORY_ICONS[cat])
          const count = toolRegistry.filter(t => t.category === cat).length
          const isActive = pathname === `/category/${cat}`
          return (
            <Link
              key={cat}
              to="/category/$name"
              params={{ name: cat }}
              className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-all duration-100 group
                ${isActive
                  ? 'bg-accent/10 text-accent'
                  : 'text-text-secondary hover:text-text-primary hover:bg-bg-raised'
                }`}
            >
              {IconComp && <IconComp className="w-4 h-4 flex-shrink-0" />}
              <span className="flex-1 truncate">{CATEGORY_LABELS[cat]}</span>
              <span className={`text-xs tabular-nums ${isActive ? 'text-accent/60' : 'text-text-muted'}`}>
                {count}
              </span>
            </Link>
          )
        })}
      </nav>

      <div className="px-4 py-3 border-t border-border-base">
        <p className="text-xs text-text-muted">
          {toolRegistry.length} 个工具
        </p>
      </div>
    </aside>
  )
}

function NavItem({
  to, label, icon, active, count
}: {
  to: string; label: string; icon: string; active: boolean; count?: number
}) {
  const IconComp = getIconComponent(icon)
  return (
    <Link
      to={to}
      className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-all duration-100
        ${active
          ? 'bg-accent/10 text-accent'
          : 'text-text-secondary hover:text-text-primary hover:bg-bg-raised'
        }`}
    >
      {IconComp && <IconComp className="w-4 h-4 flex-shrink-0" />}
      <span className="flex-1">{label}</span>
      {count !== undefined && count > 0 && (
        <span className={`text-xs tabular-nums ${active ? 'text-accent/60' : 'text-text-muted'}`}>
          {count}
        </span>
      )}
    </Link>
  )
}
