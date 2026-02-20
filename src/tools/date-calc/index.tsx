import { useState } from 'react'
import { ToolLayout } from '@/components/tool/ToolLayout'
import { meta } from './meta'
import { dateDifference, addDays, addMonths, addYears, type DateDiff } from '@it-toolbox/core'

export default function DateCalcTool() {
  const [mode, setMode] = useState<'diff' | 'add'>('diff')
  const [date1, setDate1] = useState(new Date().toISOString().split('T')[0])
  const [date2, setDate2] = useState(new Date().toISOString().split('T')[0])
  const [baseDate, setBaseDate] = useState(new Date().toISOString().split('T')[0])
  const [addDays_, setAddDays] = useState(0)
  const [addMonths_, setAddMonths] = useState(0)
  const [addYears_, setAddYears] = useState(0)
  const [diffResult, setDiffResult] = useState<DateDiff | null>(null)
  const [addResult, setAddResult] = useState<Date | null>(null)

  const handleDiff = () => {
    const d1 = new Date(date1)
    const d2 = new Date(date2)
    setDiffResult(dateDifference(d1, d2))
  }

  const handleAdd = () => {
    let result = new Date(baseDate)
    result = addDays(result, addDays_)
    result = addMonths(result, addMonths_)
    result = addYears(result, addYears_)
    setAddResult(result)
  }

  return (
    <ToolLayout meta={meta}>
      <div className="space-y-4">
        <div className="flex gap-2">
          <button
            onClick={() => setMode('diff')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              mode === 'diff'
                ? 'bg-accent-primary text-white'
                : 'bg-bg-secondary text-text-secondary hover:bg-bg-tertiary'
            }`}
          >
            日期差值
          </button>
          <button
            onClick={() => setMode('add')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              mode === 'add'
                ? 'bg-accent-primary text-white'
                : 'bg-bg-secondary text-text-secondary hover:bg-bg-tertiary'
            }`}
          >
            日期加减
          </button>
        </div>

        {mode === 'diff' ? (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-text-secondary mb-1">开始日期</label>
                <input
                  type="date"
                  value={date1}
                  onChange={(e) => setDate1(e.target.value)}
                  className="w-full px-3 py-2 bg-bg-secondary border border-border-primary rounded-lg text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-accent-primary"
                />
              </div>
              <div>
                <label className="block text-sm text-text-secondary mb-1">结束日期</label>
                <input
                  type="date"
                  value={date2}
                  onChange={(e) => setDate2(e.target.value)}
                  className="w-full px-3 py-2 bg-bg-secondary border border-border-primary rounded-lg text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-accent-primary"
                />
              </div>
            </div>

            <button
              onClick={handleDiff}
              className="px-4 py-2 bg-accent-primary text-white rounded-lg text-sm font-medium hover:bg-accent-secondary transition-colors"
            >
              计算
            </button>

            {diffResult && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-4 bg-bg-secondary border border-border-primary rounded-lg">
                  <div className="text-sm text-text-secondary mb-1">年</div>
                  <div className="text-2xl font-bold text-text-primary">{diffResult.years}</div>
                </div>
                <div className="p-4 bg-bg-secondary border border-border-primary rounded-lg">
                  <div className="text-sm text-text-secondary mb-1">月</div>
                  <div className="text-2xl font-bold text-text-primary">{diffResult.months}</div>
                </div>
                <div className="p-4 bg-bg-secondary border border-border-primary rounded-lg">
                  <div className="text-sm text-text-secondary mb-1">日</div>
                  <div className="text-2xl font-bold text-text-primary">{diffResult.days}</div>
                </div>
                <div className="p-4 bg-bg-secondary border border-border-primary rounded-lg">
                  <div className="text-sm text-text-secondary mb-1">总天数</div>
                  <div className="text-2xl font-bold text-text-primary">{diffResult.totalDays}</div>
                </div>
                <div className="p-4 bg-bg-secondary border border-border-primary rounded-lg">
                  <div className="text-sm text-text-secondary mb-1">周</div>
                  <div className="text-2xl font-bold text-text-primary">{diffResult.weeks}</div>
                </div>
                <div className="p-4 bg-bg-secondary border border-border-primary rounded-lg">
                  <div className="text-sm text-text-secondary mb-1">小时</div>
                  <div className="text-2xl font-bold text-text-primary">{diffResult.hours}</div>
                </div>
                <div className="p-4 bg-bg-secondary border border-border-primary rounded-lg">
                  <div className="text-sm text-text-secondary mb-1">分钟</div>
                  <div className="text-2xl font-bold text-text-primary">{diffResult.minutes}</div>
                </div>
                <div className="p-4 bg-bg-secondary border border-border-primary rounded-lg">
                  <div className="text-sm text-text-secondary mb-1">秒</div>
                  <div className="text-2xl font-bold text-text-primary">{diffResult.seconds}</div>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-text-secondary mb-1">基准日期</label>
              <input
                type="date"
                value={baseDate}
                onChange={(e) => setBaseDate(e.target.value)}
                className="w-full px-3 py-2 bg-bg-secondary border border-border-primary rounded-lg text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-accent-primary"
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm text-text-secondary mb-1">加年</label>
                <input
                  type="number"
                  value={addYears_}
                  onChange={(e) => setAddYears(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-bg-secondary border border-border-primary rounded-lg text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-accent-primary"
                />
              </div>
              <div>
                <label className="block text-sm text-text-secondary mb-1">加月</label>
                <input
                  type="number"
                  value={addMonths_}
                  onChange={(e) => setAddMonths(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-bg-secondary border border-border-primary rounded-lg text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-accent-primary"
                />
              </div>
              <div>
                <label className="block text-sm text-text-secondary mb-1">加日</label>
                <input
                  type="number"
                  value={addDays_}
                  onChange={(e) => setAddDays(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-bg-secondary border border-border-primary rounded-lg text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-accent-primary"
                />
              </div>
            </div>

            <button
              onClick={handleAdd}
              className="px-4 py-2 bg-accent-primary text-white rounded-lg text-sm font-medium hover:bg-accent-secondary transition-colors"
            >
              计算
            </button>

            {addResult && (
              <div className="p-4 bg-bg-secondary border border-border-primary rounded-lg">
                <div className="text-sm text-text-secondary mb-1">结果日期</div>
                <div className="text-2xl font-bold text-text-primary">
                  {addResult.toLocaleDateString('zh-CN', { 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric',
                    weekday: 'long'
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </ToolLayout>
  )
}
