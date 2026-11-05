import { useState, useEffect, useRef } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { Search, Command, Menu } from 'lucide-react'
import { Command as Cmd, CommandInput, CommandList, CommandItem, CommandEmpty, CommandGroup } from 'cmdk'
import { searchTools } from '@/registry'
import type { ToolMeta } from '@toolbox/types/tool'
import { getIconComponent } from '@/utils/icons'
import { ThemeToggle } from '@/components/ui/ThemeToggle'
import { LanguageToggle } from '@/components/ui/LanguageToggle'
import { useAppStore } from '@/store/app'
import { useFocusTrap } from '@/hooks/useFocusTrap'

export function Header() {
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const navigate = useNavigate()
  const dialogRef = useRef<HTMLDivElement>(null)
  const toggleMobileMenu = useAppStore((s) => s.toggleMobileMenu)

  useEffect(() => {
    const isEditable = (target: EventTarget | null) =>
      target instanceof HTMLElement &&
      (['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName) || target.isContentEditable)

    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen(o => !o)
      }
      if (e.key === '/' && !isEditable(e.target)) {
        e.preventDefault()
        setOpen(true)
      }
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('keydown', down)
    return () => document.removeEventListener('keydown', down)
  }, [])

  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen)
    if (!nextOpen) setQuery('')
  }

  const handleSelect = (tool: ToolMeta) => {
    handleOpenChange(false)
    navigate({ to: '/tool/$id', params: { id: tool.id } })
  }

  useFocusTrap(open, dialogRef, () => handleOpenChange(false))

  return (
    <>
      <header className="h-14 border-b border-border-base bg-bg-surface/80 backdrop-blur-sm flex items-center px-4 gap-3 sticky top-0 z-10">
        <button
          onClick={toggleMobileMenu}
          className="lg:hidden flex items-center justify-center w-9 h-9 rounded-lg text-text-secondary hover:text-text-primary hover:bg-bg-raised transition-colors"
          aria-label={t('header.openMenu')}
        >
          <Menu className="w-5 h-5" />
        </button>

        <button
          onClick={() => setOpen(true)}
          aria-expanded={open}
          aria-controls="command-palette"
          aria-label={t('app.searchPlaceholder')}
          className="flex-1 max-w-md flex items-center gap-2 px-3 py-2 rounded-lg bg-bg-raised border border-border-base text-text-muted text-sm hover:border-border-strong transition-colors duration-150"
        >
          <Search className="w-4 h-4" />
          <span className="flex-1 text-left truncate">{t('app.searchPlaceholder')}</span>
          <kbd className="hidden sm:flex items-center gap-1 px-1.5 py-0.5 rounded bg-bg-overlay text-xs font-mono">
            <Command className="w-3 h-3" />K
          </kbd>
        </button>

        <div className="flex items-center gap-1">
          <a
            href="https://github.com/Zoroaaa/it-toolbox"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center w-9 h-9 rounded-lg text-text-secondary hover:text-text-primary hover:bg-bg-raised transition-colors"
            aria-label={t('header.github')}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4"/>
              <path d="M9 18c-4.51 2-5-2-7-2"/>
            </svg>
          </a>
          <LanguageToggle />
          <ThemeToggle />
        </div>
      </header>

      {open && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4">
          <div className="fixed inset-0 bg-bg-base/60 backdrop-blur-sm" onClick={() => handleOpenChange(false)} />
          <div
            ref={dialogRef}
            id="command-palette"
            role="dialog"
            aria-modal="true"
            aria-labelledby="command-palette-title"
            tabIndex={-1}
            className="relative w-full max-w-lg bg-bg-surface border border-border-strong rounded-xl shadow-theme-lg overflow-hidden animate-slide-up"
          >
            <span id="command-palette-title" className="sr-only">{t('search.placeholder')}</span>
            <Cmd shouldFilter={false} className="[&_[cmdk-input-wrapper]]:border-b [&_[cmdk-input-wrapper]]:border-border-base" label="Search tools">
              <div className="flex items-center gap-2 px-4 py-3">
                <Search className="w-4 h-4 text-text-muted flex-shrink-0" />
                <CommandInput
                  placeholder={t('search.placeholder')}
                  className="flex-1 bg-transparent text-text-primary placeholder-text-muted outline-none text-sm"
                  value={query}
                  onValueChange={setQuery}
                />
              </div>
              <CommandList className="max-h-80 overflow-y-auto p-2">
                <CommandEmpty className="py-8 text-center text-text-muted text-sm">
                  {t('search.noResults')}
                </CommandEmpty>
                <SearchResults query={query} onSelect={handleSelect} />
              </CommandList>
            </Cmd>
            <div className="px-4 py-2 border-t border-border-base flex items-center gap-4 text-xs text-text-muted">
              <span className="flex items-center gap-1"><kbd className="font-mono">↑↓</kbd> {t('search.shortcuts.navigate')}</span>
              <span className="flex items-center gap-1"><kbd className="font-mono">↵</kbd> {t('search.shortcuts.open')}</span>
              <span className="flex items-center gap-1"><kbd className="font-mono">Esc</kbd> {t('search.shortcuts.close')}</span>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

function SearchResults({ query, onSelect }: { query: string; onSelect: (t: ToolMeta) => void }) {
  const { t } = useTranslation()
  const results = searchTools(query)

  const grouped = results.reduce<Record<string, ToolMeta[]>>((acc, tool) => {
    if (!acc[tool.category]) acc[tool.category] = []
    acc[tool.category].push(tool)
    return acc
  }, {})

  return (
    <>
      {Object.entries(grouped).map(([cat, tools]) => (
        <CommandGroup key={cat} heading={t(`categories.${cat}`)} className="[&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:text-text-muted [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5">
          {tools.map(tool => {
            const IconComp = getIconComponent(tool.icon)
            return (
              <CommandItem
                key={tool.id}
                value={`${tool.name} ${tool.nameEn} ${tool.id}`}
                onSelect={() => onSelect(tool)}
                className="flex items-center gap-3 px-2 py-2 rounded-lg cursor-pointer
                           text-text-secondary hover:text-text-primary
                           aria-selected:bg-accent/10 aria-selected:text-accent
                           transition-colors duration-100"
              >
                {IconComp && <IconComp className="w-4 h-4 flex-shrink-0" />}
                <div className="flex-1 min-w-0">
                  <span className="text-sm font-medium">{tool.name}</span>
                  <p className="text-xs text-text-muted truncate">{tool.description}</p>
                </div>
              </CommandItem>
            )
          })}
        </CommandGroup>
      ))}
    </>
  )
}
