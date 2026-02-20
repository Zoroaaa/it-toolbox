import { useState } from 'react'
import { ToolLayout } from '@/components/tool/ToolLayout'
import { meta } from './meta'
import { parseCron, type CronResult } from '@it-toolbox/core'

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

  const handleParse = () => {
    setError('')
    if (!expression.trim()) {
      setResult(null)
      return
    }

    const parseResult = parseCron(expression, 5)
    if (parseResult.ok) {
      setResult(parseResult.value)
    } else {
      setError(parseResult.error)
      setResult(null)
    }
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
    <ToolLayout meta={meta}>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-text-primary mb-2">Cron 表达式</label>
          <div className="flex gap-2">
            <input
              type="text"
              value={expression}
              onChange={(e) => setExpression(e.target.value)}
              placeholder="输入 Cron 表达式..."
              className="flex-1 px-3 py-2 bg-bg-secondary border border-border-primary rounded-lg text-text-primary placeholder-text-tertiary focus:outline-none focus:ring-2 focus:ring-accent-primary font-mono text-sm"
            />
            <button
              onClick={handleParse}
              className="px-4 py-2 bg-accent-primary text-white rounded-lg text-sm font-medium hover:bg-accent-secondary transition-colors"
            >
              解析
            </button>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-text-primary mb-2">常用表达式</label>
          <div className="flex flex-wrap gap-2">
            {COMMON_EXPRESSIONS.map((item) => (
              <button
                key={item.value}
                onClick={() => {
                  setExpression(item.value)
                }}
                className="px-3 py-1.5 bg-bg-secondary text-text-secondary rounded-lg text-sm hover:bg-bg-tertiary transition-colors"
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        {error && (
          <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
            {error}
          </div>
        )}

        {result && (
          <div className="space-y-4">
            <div className="p-4 bg-bg-secondary border border-border-primary rounded-lg">
              <div className="text-sm text-text-secondary mb-1">描述</div>
              <div className="text-lg text-text-primary">{result.description}</div>
            </div>

            <div className="p-4 bg-bg-secondary border border-border-primary rounded-lg">
              <div className="text-sm text-text-secondary mb-2">字段解析</div>
              <div className="grid grid-cols-5 gap-2 text-center">
                <div>
                  <div className="text-xs text-text-tertiary">分钟</div>
                  <div className="font-mono text-text-primary">{result.fields.minute}</div>
                </div>
                <div>
                  <div className="text-xs text-text-tertiary">小时</div>
                  <div className="font-mono text-text-primary">{result.fields.hour}</div>
                </div>
                <div>
                  <div className="text-xs text-text-tertiary">日</div>
                  <div className="font-mono text-text-primary">{result.fields.dayOfMonth}</div>
                </div>
                <div>
                  <div className="text-xs text-text-tertiary">月</div>
                  <div className="font-mono text-text-primary">{result.fields.month}</div>
                </div>
                <div>
                  <div className="text-xs text-text-tertiary">周</div>
                  <div className="font-mono text-text-primary">{result.fields.dayOfWeek}</div>
                </div>
              </div>
            </div>

            <div className="p-4 bg-bg-secondary border border-border-primary rounded-lg">
              <div className="text-sm text-text-secondary mb-2">接下来 5 次执行时间</div>
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
