import { useState, useCallback } from 'react'
import { Calculator, ArrowRightLeft } from 'lucide-react'
import { ToolLayout } from '@/components/tool/ToolLayout'
import { meta } from './meta'
import { dateDifference, addDays, addMonths, addYears, type DateDiff } from '@it-toolbox/core'
import { useAppStore } from '@/store/app'

type Mode = 'diff' | 'add'

export default function DateCalcTool() {
  const [mode, setMode] = useState<Mode>('diff')
  const [date1, setDate1] = useState(new Date().toISOString().split('T')[0])
  const [date2, setDate2] = useState(new Date().toISOString().split('T')[0])
  const [baseDate, setBaseDate] = useState(new Date().toISOString().split('T')[0])
  const [addDays_, setAddDays] = useState(0)
  const [addMonths_, setAddMonths] = useState(0)
  const [addYears_, setAddYears] = useState(0)
  const [diffResult, setDiffResult] = useState<DateDiff | null>(null)
  const [addResult, setAddResult] = useState<Date | null>(null)
  const { addRecentTool } = useAppStore()

  const handleDiff = useCallback(() => {
    addRecentTool(meta.id)
    const d1 = new Date(date1)
    const d2 = new Date(date2)
    setDiffResult(dateDifference(d1, d2))
  }, [date1, date2, addRecentTool])

  const handleAdd = useCallback(() => {
    addRecentTool(meta.id)
    let result = new Date(baseDate)
    result = addDays(result, addDays_)
    result = addMonths(result, addMonths_)
    result = addYears(result, addYears_)
    setAddResult(result)
  }, [baseDate, addDays_, addMonths_, addYears_, addRecentTool])

  const reset = () => {
    setMode('diff')
    setDate1(new Date().toISOString().split('T')[0])
    setDate2(new Date().toISOString().split('T')[0])
    setBaseDate(new Date().toISOString().split('T')[0])
    setAddDays(0)
    setAddMonths(0)
    setAddYears(0)
    setDiffResult(null)
    setAddResult(null)
  }

  return (
    <ToolLayout meta={meta} onReset={reset}>
      <div className="flex items-center gap-2 mb-4 flex-wrap">
        <button onClick={mode === 'diff' ? handleDiff : handleAdd} className="btn-primary">
          <Calculator className="w-4 h-4" />
          计算
        </button>

        <div className="flex items-center gap-1 bg-bg-raised rounded-lg p-1">
          {(['diff', 'add'] as Mode[]).map(m => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors
                ${mode === m ? 'bg-accent text-bg-base' : 'text-text-muted hover:text-text-primary'}`}
            >
              {m === 'diff' ? '日期差值' : '日期加减'}
            </button>
          ))}
        </div>
      </div>

      {mode === 'diff' ? (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-text-muted uppercase tracking-wider block mb-1">开始日期</label>
              <input
                type="date"
                value={date1}
                onChange={(e) => setDate1(e.target.value)}
                className="tool-input"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-text-muted uppercase tracking-wider block mb-1">结束日期</label>
              <input
                type="date"
                value={date2}
                onChange={(e) => setDate2(e.target.value)}
                className="tool-input"
              />
            </div>
          </div>

          {diffResult && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-4 bg-bg-surface border border-border-base rounded-lg">
                <div className="text-xs font-medium text-text-muted uppercase tracking-wider mb-1">年</div>
                <div className="text-2xl font-bold text-text-primary">{diffResult.years}</div>
              </div>
              <div className="p-4 bg-bg-surface border border-border-base rounded-lg">
                <div className="text-xs font-medium text-text-muted uppercase tracking-wider mb-1">月</div>
                <div className="text-2xl font-bold text-text-primary">{diffResult.months}</div>
              </div>
              <div className="p-4 bg-bg-surface border border-border-base rounded-lg">
                <div className="text-xs font-medium text-text-muted uppercase tracking-wider mb-1">日</div>
                <div className="text-2xl font-bold text-text-primary">{diffResult.days}</div>
              </div>
              <div className="p-4 bg-bg-surface border border-border-base rounded-lg">
                <div className="text-xs font-medium text-text-muted uppercase tracking-wider mb-1">总天数</div>
                <div className="text-2xl font-bold text-text-primary">{diffResult.totalDays}</div>
              </div>
              <div className="p-4 bg-bg-surface border border-border-base rounded-lg">
                <div className="text-xs font-medium text-text-muted uppercase tracking-wider mb-1">周</div>
                <div className="text-2xl font-bold text-text-primary">{diffResult.weeks}</div>
              </div>
              <div className="p-4 bg-bg-surface border border-border-base rounded-lg">
                <div className="text-xs font-medium text-text-muted uppercase tracking-wider mb-1">小时</div>
                <div className="text-2xl font-bold text-text-primary">{diffResult.hours}</div>
              </div>
              <div className="p-4 bg-bg-surface border border-border-base rounded-lg">
                <div className="text-xs font-medium text-text-muted uppercase tracking-wider mb-1">分钟</div>
                <div className="text-2xl font-bold text-text-primary">{diffResult.minutes}</div>
              </div>
              <div className="p-4 bg-bg-surface border border-border-base rounded-lg">
                <div className="text-xs font-medium text-text-muted uppercase tracking-wider mb-1">秒</div>
                <div className="text-2xl font-bold text-text-primary">{diffResult.seconds}</div>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          <div>
            <label className="text-xs font-medium text-text-muted uppercase tracking-wider block mb-1">基准日期</label>
            <input
              type="date"
              value={baseDate}
              onChange={(e) => setBaseDate(e.target.value)}
              className="tool-input"
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="text-xs font-medium text-text-muted uppercase tracking-wider block mb-1">加年</label>
              <input
                type="number"
                value={addYears_}
                onChange={(e) => setAddYears(Number(e.target.value))}
                className="tool-input"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-text-muted uppercase tracking-wider block mb-1">加月</label>
              <input
                type="number"
                value={addMonths_}
                onChange={(e) => setAddMonths(Number(e.target.value))}
                className="tool-input"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-text-muted uppercase tracking-wider block mb-1">加日</label>
              <input
                type="number"
                value={addDays_}
                onChange={(e) => setAddDays(Number(e.target.value))}
                className="tool-input"
              />
            </div>
          </div>

          {addResult && (
            <div className="p-4 bg-bg-surface border border-border-base rounded-lg">
              <div className="text-xs font-medium text-text-muted uppercase tracking-wider mb-1">结果日期</div>
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
    </ToolLayout>
  )
}
