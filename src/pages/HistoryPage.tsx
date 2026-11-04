import { useState } from 'react'
import { Clock, Trash2, X, Copy } from 'lucide-react'
import { ToolCard } from '@/components/ui/ToolCard'
import { useAppStore } from '@/store/app'
import { getToolById } from '@/registry'
import { toast } from '@/lib/toast'

export function HistoryPage() {
  const recentTools = useAppStore((s) => s.recentTools)
  const history = useAppStore((s) => s.history)
  const removeHistory = useAppStore((s) => s.removeHistory)
  const clearHistory = useAppStore((s) => s.clearHistory)
  const [expanded, setExpanded] = useState<string | null>(null)

  const tools = recentTools.map((id) => getToolById(id)).filter(Boolean) as NonNullable<ReturnType<typeof getToolById>>[]
  const groups = Object.entries(history).flatMap(([toolId, records]) => {
    const tool = getToolById(toolId)
    return tool && records.length > 0 ? [{ tool, records }] : []
  })

  const copyInput = async (value: string) => {
    try {
      await navigator.clipboard.writeText(value)
      toast.success('已复制')
    } catch {
      toast.error('复制失败，请手动选择文本')
    }
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="mb-8 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-text-primary mb-1">最近使用</h1>
          <p className="text-text-secondary text-sm">{tools.length} 个最近使用的工具</p>
        </div>
        {groups.length > 0 && (
          <button onClick={() => clearHistory()} className="btn-ghost text-xs gap-1.5">
            <Trash2 className="w-3.5 h-3.5" />
            清空输入历史
          </button>
        )}
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
          {tools.map((tool) => <ToolCard key={tool.id} tool={tool} />)}
        </div>
      )}

      {groups.length > 0 && (
        <section className="mt-10">
          <h2 className="text-sm font-medium text-text-primary mb-3">输入历史</h2>
          <p className="text-xs text-text-muted mb-4">仅记录非敏感工具，数据保存在本机浏览器</p>
          <div className="space-y-2">
            {groups.map(({ tool, records }) => {
              const isOpen = expanded === tool.id
              return (
                <div key={tool.id} className="rounded-lg border border-border-base bg-bg-surface">
                  <button
                    onClick={() => setExpanded(isOpen ? null : tool.id)}
                    aria-expanded={isOpen}
                    className="w-full flex items-center gap-2 px-3 py-2.5 text-left"
                  >
                    <span className="text-sm text-text-primary flex-1">{tool.name}</span>
                    <span className="text-xs text-text-muted">{records.length} 条</span>
                    <span className="text-xs text-text-muted">{isOpen ? '收起' : '展开'}</span>
                  </button>

                  {isOpen && (
                    <ul className="border-t border-border-base divide-y divide-border-base">
                      {records.map((record) => (
                        <li key={record.timestamp} className="flex items-start gap-2 px-3 py-2">
                          <code className="flex-1 text-xs font-mono text-text-secondary break-all line-clamp-2">
                            {record.input.length > 200 ? `${record.input.slice(0, 200)}…` : record.input}
                          </code>
                          <span className="text-[11px] text-text-muted whitespace-nowrap">
                            {new Date(record.timestamp).toLocaleString()}
                          </span>
                          <button
                            onClick={() => copyInput(record.input)}
                            className="p-1 rounded hover:bg-bg-raised text-text-muted"
                            aria-label="复制"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => removeHistory(tool.id, record.timestamp)}
                            className="p-1 rounded hover:bg-bg-raised text-text-muted"
                            aria-label="删除该条"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )
            })}
          </div>
        </section>
      )}
    </div>
  )
}
