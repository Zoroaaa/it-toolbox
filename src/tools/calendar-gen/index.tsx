import { useState, useMemo } from 'react'
import { ToolLayout } from '@/components/tool/ToolLayout'
import { meta } from './meta'
import { generateCalendar } from '@it-toolbox/core'

const WEEKDAYS = ['日', '一', '二', '三', '四', '五', '六']
const MONTHS = ['一月', '二月', '三月', '四月', '五月', '六月', '七月', '八月', '九月', '十月', '十一月', '十二月']

export default function CalendarGenTool() {
  const today = new Date()
  const [year, setYear] = useState(today.getFullYear())
  const [month, setMonth] = useState(today.getMonth())

  const calendar = useMemo(() => generateCalendar(year, month), [year, month])

  const prevMonth = () => {
    if (month === 0) {
      setYear(year - 1)
      setMonth(11)
    } else {
      setMonth(month - 1)
    }
  }

  const nextMonth = () => {
    if (month === 11) {
      setYear(year + 1)
      setMonth(0)
    } else {
      setMonth(month + 1)
    }
  }

  const goToToday = () => {
    const t = new Date()
    setYear(t.getFullYear())
    setMonth(t.getMonth())
  }

  return (
    <ToolLayout meta={meta}>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <button
            onClick={prevMonth}
            className="px-3 py-1 bg-bg-secondary text-text-secondary rounded hover:bg-bg-tertiary transition-colors"
          >
            ← 上月
          </button>

          <div className="flex items-center gap-4">
            <select
              value={year}
              onChange={(e) => setYear(Number(e.target.value))}
              className="px-3 py-1 bg-bg-secondary border border-border-primary rounded-lg text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-accent-primary"
            >
              {Array.from({ length: 21 }, (_, i) => year - 10 + i).map((y) => (
                <option key={y} value={y}>
                  {y} 年
                </option>
              ))}
            </select>

            <select
              value={month}
              onChange={(e) => setMonth(Number(e.target.value))}
              className="px-3 py-1 bg-bg-secondary border border-border-primary rounded-lg text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-accent-primary"
            >
              {MONTHS.map((m, i) => (
                <option key={i} value={i}>
                  {m}
                </option>
              ))}
            </select>

            <button
              onClick={goToToday}
              className="px-3 py-1 bg-accent-primary text-white rounded text-sm hover:bg-accent-secondary transition-colors"
            >
              今天
            </button>
          </div>

          <button
            onClick={nextMonth}
            className="px-3 py-1 bg-bg-secondary text-text-secondary rounded hover:bg-bg-tertiary transition-colors"
          >
            下月 →
          </button>
        </div>

        <div className="bg-bg-secondary border border-border-primary rounded-lg overflow-hidden">
          <div className="grid grid-cols-7 bg-bg-tertiary">
            {WEEKDAYS.map((day, i) => (
              <div
                key={day}
                className={`p-2 text-center text-sm font-medium ${
                  i === 0 || i === 6 ? 'text-red-400' : 'text-text-primary'
                }`}
              >
                {day}
              </div>
            ))}
          </div>

          {calendar.map((week, weekIndex) => (
            <div key={weekIndex} className="grid grid-cols-7 border-t border-border-primary">
              {week.map((day, dayIndex) => (
                <div
                  key={dayIndex}
                  className={`p-2 text-center text-sm border-r border-border-primary last:border-r-0 ${
                    !day.isCurrentMonth
                      ? 'text-text-tertiary'
                      : day.isToday
                      ? 'bg-accent-primary text-white font-bold'
                      : day.isWeekend
                      ? 'text-red-400'
                      : 'text-text-primary'
                  } ${day.isCurrentMonth && !day.isToday ? 'hover:bg-bg-tertiary cursor-pointer' : ''}`}
                >
                  {day.day}
                </div>
              ))}
            </div>
          ))}
        </div>

        <div className="flex gap-4 text-sm text-text-secondary">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-accent-primary rounded" />
            <span>今天</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-bg-secondary border border-border-primary rounded" />
            <span>工作日</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-bg-secondary border border-border-primary rounded text-red-400" />
            <span>周末</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-bg-secondary border border-border-primary rounded opacity-50" />
            <span>其他月份</span>
          </div>
        </div>
      </div>
    </ToolLayout>
  )
}
