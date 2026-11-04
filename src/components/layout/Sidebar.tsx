import { useMemo, useRef } from 'react'
import { Link, useRouterState } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { Wrench, X } from 'lucide-react'
import { CATEGORY_ICONS, CATEGORY_ORDER } from '@toolbox/types/tool'
import { toolRegistry } from '@/registry'
import { getIconComponent } from '@/utils/icons'
import { useAppStore } from '@/store/app'
import { useFocusTrap } from '@/hooks/useFocusTrap'

function Brand({ onClick }: { onClick?: () => void }) {
  return (
    <Link to="/" onClick={onClick} className="flex items-center gap-2.5 group">
      <div className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center">
        <Wrench className="w-4 h-4 text-bg-base" />
      </div>
      <span className="font-semibold text-text-primary font-mono tracking-tight">IT Toolbox</span>
    </Link>
  )
}

function SidebarNav({
  pathname,
  favoritesCount,
  onNavigate,
}: {
  pathname: string
  favoritesCount: number
  onNavigate: () => void
}) {
  const { t } = useTranslation()
  const counts = useMemo(() => {
    const map = new Map<string, number>()
    for (const tool of toolRegistry) {
      map.set(tool.category, (map.get(tool.category) ?? 0) + 1)
    }
    return map
  }, [])

  return (
    <nav className="flex-1 px-2 py-3 space-y-0.5 overflow-y-auto">
      <NavItem to="/" label={t('sidebar.allTools')} icon="LayoutGrid" active={pathname === '/'} count={toolRegistry.length} onClick={onNavigate} />
      <NavItem to="/favorites" label={t('sidebar.favorites')} icon="Star" active={pathname === '/favorites'} count={favoritesCount} onClick={onNavigate} />
      <NavItem to="/history" label={t('sidebar.recent')} icon="Clock" active={pathname === '/history'} onClick={onNavigate} />

      <div className="pt-3 pb-1">
        <p className="px-3 text-xs font-medium text-text-muted uppercase tracking-wider">{t('nav.allTools')}</p>
      </div>

      {CATEGORY_ORDER.map((category) => {
        const IconComp = getIconComponent(CATEGORY_ICONS[category])
        const isActive = pathname === `/category/${category}`
        return (
          <Link
            key={category}
            to="/category/$name"
            params={{ name: category }}
            onClick={onNavigate}
            className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-all duration-100 group
              ${isActive ? 'bg-accent/10 text-accent' : 'text-text-secondary hover:text-text-primary hover:bg-bg-raised'}`}
          >
            <IconComp className="w-4 h-4 flex-shrink-0" />
            <span className="flex-1 truncate">{t(`categories.${category}`)}</span>
            <span className={`text-xs tabular-nums ${isActive ? 'text-accent/60' : 'text-text-muted'}`}>
              {counts.get(category) ?? 0}
            </span>
          </Link>
        )
      })}
    </nav>
  )
}

function SidebarFooter() {
  const { t } = useTranslation()
  return (
    <div className="px-4 py-3 border-t border-border-base">
      <p className="text-xs text-text-muted">
        {toolRegistry.length} {t('nav.allTools').toLowerCase()}
      </p>
    </div>
  )
}

export function Sidebar() {
  const { t } = useTranslation()
  const routerState = useRouterState()
  const pathname = routerState.location.pathname
  const favorites = useAppStore((state) => state.favorites)
  const mobileMenuOpen = useAppStore((state) => state.mobileMenuOpen)
  const setMobileMenuOpen = useAppStore((state) => state.setMobileMenuOpen)

  const drawerRef = useRef<HTMLElement>(null)
  useFocusTrap(mobileMenuOpen, drawerRef, () => setMobileMenuOpen(false))

  const handleNavClick = () => {
    if (window.innerWidth < 1024) setMobileMenuOpen(false)
  }

  return (
    <>
      <aside className="hidden lg:flex w-56 flex-shrink-0 flex-col bg-bg-surface border-r border-border-base h-screen sticky top-0 overflow-y-auto">
        <div className="px-4 py-5 border-b border-border-base">
          <Brand />
        </div>
        <SidebarNav pathname={pathname} favoritesCount={favorites.length} onNavigate={handleNavClick} />
        <SidebarFooter />
      </aside>

      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-40">
          <div
            className="absolute inset-0 bg-bg-base/60 backdrop-blur-sm"
            onClick={() => setMobileMenuOpen(false)}
          />
          <aside
            ref={drawerRef}
            role="dialog"
            aria-modal="true"
            aria-label={t('sidebar.allTools')}
            tabIndex={-1}
            className="absolute left-0 top-0 bottom-0 w-72 max-w-[85vw] bg-bg-surface border-r border-border-base flex flex-col animate-slide-in-left shadow-theme-lg"
          >
            <div className="px-4 py-5 border-b border-border-base flex items-center justify-between">
              <Brand onClick={handleNavClick} />
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center justify-center w-8 h-8 rounded-lg text-text-secondary hover:text-text-primary hover:bg-bg-raised transition-colors"
                aria-label={t('common.close')}
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <SidebarNav pathname={pathname} favoritesCount={favorites.length} onNavigate={handleNavClick} />
            <SidebarFooter />
          </aside>
        </div>
      )}
    </>
  )
}

function NavItem({
  to, label, icon, active, count, onClick,
}: {
  to: string; label: string; icon: string; active: boolean; count?: number; onClick?: () => void
}) {
  const IconComp = getIconComponent(icon)
  return (
    <Link
      to={to}
      onClick={onClick}
      className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-all duration-100
        ${active ? 'bg-accent/10 text-accent' : 'text-text-secondary hover:text-text-primary hover:bg-bg-raised'}`}
    >
      <IconComp className="w-4 h-4 flex-shrink-0" />
      <span className="flex-1">{label}</span>
      {count !== undefined && count > 0 && (
        <span className={`text-xs tabular-nums ${active ? 'text-accent/60' : 'text-text-muted'}`}>
          {count}
        </span>
      )}
    </Link>
  )
}
