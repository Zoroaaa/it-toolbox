import { type ReactNode } from 'react'
import { Star, Copy, Check, RotateCcw } from 'lucide-react'
import type { ToolMeta } from '@toolbox/types/tool'
import { useAppStore } from '@/store/app'
import { useClipboard } from '@/hooks/useClipboard'
import { getIconComponent } from '@/utils/icons'

interface ToolLayoutProps {
  meta: ToolMeta
  children: ReactNode
  onReset?: () => void
  outputValue?: string
}

export function ToolLayout({ meta, children, onReset, outputValue }: ToolLayoutProps) {
  const { toggleFavorite, isFavorited } = useAppStore()
  const { copy, copied } = useClipboard()
  const favorited = isFavorited(meta.id)
  const IconComponent = getIconComponent(meta.icon)

  return (
    <div className="flex flex-col h-full animate-fade-in">
      <div className="flex items-start justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center flex-shrink-0">
            {IconComponent && <IconComponent className="w-5 h-5 text-accent" />}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-semibold text-text-primary">{meta.name}</h1>
              {meta.isNew && (
                <span className="badge">NEW</span>
              )}
              {meta.requiresApi && (
                <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-bg-raised text-text-muted border border-border-base">
                  API
                </span>
              )}
            </div>
            <p className="text-sm text-text-secondary mt-0.5">{meta.description}</p>
          </div>
        </div>

        <div className="flex items-center gap-1 flex-shrink-0 ml-4">
          {outputValue && (
            <button
              onClick={() => copy(outputValue)}
              className="btn-ghost"
              title="复制输出"
            >
              {copied ? <Check className="w-4 h-4 text-accent" /> : <Copy className="w-4 h-4" />}
              <span className="hidden sm:inline">{copied ? '已复制' : '复制'}</span>
            </button>
          )}
          {onReset && (
            <button onClick={onReset} className="btn-ghost" title="重置">
              <RotateCcw className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={() => toggleFavorite(meta.id)}
            className="btn-ghost"
            title={favorited ? '取消收藏' : '收藏'}
          >
            <Star className={`w-4 h-4 ${favorited ? 'fill-accent text-accent' : ''}`} />
          </button>
        </div>
      </div>

      <div className="flex-1 min-h-0">
        {children}
      </div>
    </div>
  )
}
