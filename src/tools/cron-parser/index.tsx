import { useState, useCallback } from 'react'
import { Clock, AlertCircle } from 'lucide-react'
import { ToolLayout } from '@/components/tool/ToolLayout'
import { meta } from './meta'
import { parseCron, type CronResult } from '@it-toolbox/core'
import { useAppStore } from '@/store/app'

const COMMON_EXPRESSIONS = [
  { label: '每分钟', value: '* * * * *' },
  { label: '每小时', value: '0 * * * *' },
  { label: '每天零点', value: '0 0 * * *' },
  { label: '每天中午12点', value: '0 12 * * *' },
  { label: '每周一零点', value: '0 0 * * 1' },
  { label: '每月1号零点', value: '0 0 1 * *' },
  { label: '工作日早9点', value: '0 9 * * 1-5' },
  { label: '每5分钟', value: '*/5 * * * *' },
  { label: '每30分钟', value: '*/30 * * * *' },
  { label: '每2小时', value: '0 */2 * * *' },
]

export default function CronParser() {
  const [expression, setExpression] = useState('0 9 * * 1-5')
  const [result, setResult] = useState<CronResult | null>(null)
  const [error, setError] = useState('')
  const { addRecentTool } = useAppStore()

  const handleParse = useCallback(() => {
    setError('')
    if (!expression.trim()) {
      setResult(null)
      return
    }
    addRecentTool(meta.id)
    const parseResult = parseCron(expression, 5)
    if (parseResult.ok) {
      setResult(parseResult.value)
    } else {
      setError(parseResult.error)
      setResult(null)
    }
  }, [expression, addRecentTool])

  const reset = () => {
    setExpression('0 9 * * 1-5')
    setResult(null)
    setError('')
  }

  const formatDate = (date: Date) => {
    return date.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    })
  }

  return (
    <ToolLayout meta={meta} onReset={reset}>
      <div className="flex items-center gap-2 mb-4 flex-wrap">
        <button onClick={handleParse} className="btn-primary">
          <Clock className="w-4 h-4" />
          解析
        </button>
      </div>

      <div className="space-y-4">
        <div>
          <label className="text-xs font-medium text-text-muted uppercase tracking-wider block mb-2">Cron 表达式</label>
          <input
            type="text"
            value={expression}
            onChange={(e) => setExpression(e.target.value)}
            placeholder="输入 Cron 表达式..."
            className="tool-input font-mono"
          />
        </div>

        <div>
          <label className="text-xs font-medium text-text-muted uppercase tracking-wider block mb-2">常用表达式</label>
          <div className="flex flex-wrap gap-2">
            {COMMON_EXPRESSIONS.map((item) => (
              <button
                key={item.value}
                onClick={() => {
                  setExpression(item.value)
                }}
                className="px-3 py-1.5 bg-bg-surface text-text-secondary rounded-lg text-sm hover:bg-bg-raised border border-border-base transition-colors"
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        {error && (
          <div className="flex items-start gap-3 bg-rose-500/10 border border-rose-500/30 rounded-lg p-4">
            <AlertCircle className="w-4 h-4 text-rose-500 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-rose-400">{error}</p>
          </div>
        )}

        {result && (
          <div className="space-y-4">
            <div className="p-4 bg-bg-surface border border-border-base rounded-lg">
              <div className="text-xs font-medium text-text-muted uppercase tracking-wider mb-1">描述</div>
              <div className="text-lg text-text-primary">{result.description}</div>
            </div>

            <div className="p-4 bg-bg-surface border border-border-base rounded-lg">
              <div className="text-xs font-medium text-text-muted uppercase tracking-wider mb-2">字段解析</div>
              <div className="grid grid-cols-5 gap-2 text-center">
                <div>
                  <div className="text-xs text-text-muted">分钟</div>
                  <div className="font-mono text-text-primary">{result.fields.minute}</div>
                </div>
                <div>
                  <div className="text-xs text-text-muted">小时</div>
                  <div className="font-mono text-text-primary">{result.fields.hour}</div>
                </div>
                <div>
                  <div className="text-xs text-text-muted">日</div>
                  <div className="font-mono text-text-primary">{result.fields.dayOfMonth}</div>
                </div>
                <div>
                  <div className="text-xs text-text-muted">月</div>
                  <div className="font-mono text-text-primary">{result.fields.month}</div>
                </div>
                <div>
                  <div className="text-xs text-text-muted">周</div>
                  <div className="font-mono text-text-primary">{result.fields.dayOfWeek}</div>
                </div>
              </div>
            </div>

            <div className="p-4 bg-bg-surface border border-border-base rounded-lg">
              <div className="text-xs font-medium text-text-muted uppercase tracking-wider mb-2">接下来 5 次执行时间</div>
              <div className="space-y-1">
                {result.nextDates.map((date, i) => (
                  <div key={i} className="font-mono text-sm text-text-primary">
                    {formatDate(date)}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </ToolLayout>
  )
}
