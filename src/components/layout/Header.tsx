import { useState, useEffect } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { Search, Command } from 'lucide-react'
import { Command as Cmd, CommandInput, CommandList, CommandItem, CommandEmpty, CommandGroup } from 'cmdk'
import { searchTools } from '@/registry'
import type { ToolMeta } from '@toolbox/types/tool'
import { CATEGORY_LABELS } from '@toolbox/types/tool'
import * as Icons from 'lucide-react'

export function Header() {
  const [open, setOpen] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen(o => !o)
      }
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('keydown', down)
    return () => document.removeEventListener('keydown', down)
  }, [])

  const handleSelect = (tool: ToolMeta) => {
    setOpen(false)
    navigate({ to: '/tool/$id', params: { id: tool.id } })
  }

  return (
    <>
      <header className="h-14 border-b border-border-base bg-bg-surface/80 backdrop-blur-sm flex items-center px-4 gap-4 sticky top-0 z-10">
        <button
          onClick={() => setOpen(true)}
          className="flex-1 max-w-md flex items-center gap-2 px-3 py-2 rounded-lg bg-bg-raised border border-border-base text-text-muted text-sm hover:border-border-strong transition-colors duration-150"
        >
          <Search className="w-4 h-4" />
          <span className="flex-1 text-left">搜索工具...</span>
          <kbd className="hidden sm:flex items-center gap-1 px-1.5 py-0.5 rounded bg-bg-overlay text-xs font-mono">
            <Command className="w-3 h-3" />K
          </kbd>
        </button>
      </header>

      {/* Command Palette */}
      {open && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4">
          <div className="fixed inset-0 bg-bg-base/60 backdrop-blur-sm" onClick={() => setOpen(false)} />
          <div className="relative w-full max-w-lg bg-bg-surface border border-border-strong rounded-xl shadow-2xl overflow-hidden animate-slide-up">
            <Cmd className="[&_[cmdk-input-wrapper]]:border-b [&_[cmdk-input-wrapper]]:border-border-base" label="Search tools">
              <div className="flex items-center gap-2 px-4 py-3">
                <Search className="w-4 h-4 text-text-muted flex-shrink-0" />
                <CommandInput
                  placeholder="搜索工具..."
                  className="flex-1 bg-transparent text-text-primary placeholder-text-muted outline-none text-sm"
                  onValueChange={(v) => searchTools(v)}
                />
              </div>
              <CommandList className="max-h-80 overflow-y-auto p-2">
                <CommandEmpty className="py-8 text-center text-text-muted text-sm">
                  没有找到相关工具
                </CommandEmpty>
                <SearchResults onSelect={handleSelect} />
              </CommandList>
            </Cmd>
            <div className="px-4 py-2 border-t border-border-base flex items-center gap-4 text-xs text-text-muted">
              <span className="flex items-center gap-1"><kbd className="font-mono">↑↓</kbd> 导航</span>
              <span className="flex items-center gap-1"><kbd className="font-mono">↵</kbd> 打开</span>
              <span className="flex items-center gap-1"><kbd className="font-mono">Esc</kbd> 关闭</span>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

function SearchResults({ onSelect }: { onSelect: (t: ToolMeta) => void }) {
  const [query, setQuery] = useState('')
  const results = searchTools(query)

  // Group by category
  const grouped = results.reduce<Record<string, ToolMeta[]>>((acc, tool) => {
    if (!acc[tool.category]) acc[tool.category] = []
    acc[tool.category].push(tool)
    return acc
  }, {})

  return (
    <>
      {Object.entries(grouped).slice(0, 5).map(([cat, tools]) => (
        <CommandGroup key={cat} heading={CATEGORY_LABELS[cat as keyof typeof CATEGORY_LABELS]} className="[&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:text-text-muted [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5">
          {tools.slice(0, 4).map(tool => {
            const IconComp = (Icons as Record<string, React.ComponentType<{ className?: string }>>)[tool.icon]
            return (
              <CommandItem
                key={tool.id}
                value={tool.id}
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
                {tool.isNew && <span className="badge text-xs">NEW</span>}
              </CommandItem>
            )
          })}
        </CommandGroup>
      ))}
    </>
  )
}
