import { Clock } from 'lucide-react'
import { ToolCard } from '@/components/ui/ToolCard'
import { useAppStore } from '@/store/app'
import { getToolById } from '@/registry'

export function HistoryPage() {
  const { recentTools } = useAppStore()
  const tools = recentTools.map(id => getToolById(id)).filter(Boolean) as NonNullable<ReturnType<typeof getToolById>>[]

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-text-primary mb-1">最近使用</h1>
        <p className="text-text-secondary text-sm">{tools.length} 个最近使用的工具</p>
      </div>

      {tools.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 gap-3 text-center">
          <div className="w-14 h-14 rounded-2xl bg-bg-surface border border-border-base flex items-center justify-center">
            <Clock className="w-6 h-6 text-text-muted" />
          </div>
          <p className="text-text-secondary font-medium">还没有使用记录</p>
          <p className="text-text-muted text-sm">使用工具后会自动记录在这里</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {tools.map(tool => <ToolCard key={tool.id} tool={tool} />)}
        </div>
      )}
    </div>
  )
}
