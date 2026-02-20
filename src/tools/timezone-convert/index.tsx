import { useState, useMemo } from 'react'
import { ToolLayout } from '@/components/tool/ToolLayout'
import { meta } from './meta'
import { TIMEZONES } from '@it-toolbox/core'

export default function TimezoneConvertTool() {
  const [inputTime, setInputTime] = useState(new Date().toISOString().slice(0, 16))
  const [sourceTz, setSourceTz] = useState('Asia/Shanghai')
  const [targetTz, setTargetTz] = useState('America/New_York')

  const convertedTimes = useMemo(() => {
    const date = new Date(inputTime)
    return TIMEZONES.map((tz) => ({
      ...tz,
      time: date.toLocaleString('zh-CN', { timeZone: tz.value, hour12: false }),
    }))
  }, [inputTime])

  const selectedResult = useMemo(() => {
    const date = new Date(inputTime)
    return {
      source: date.toLocaleString('zh-CN', { timeZone: sourceTz, hour12: false }),
      target: date.toLocaleString('zh-CN', { timeZone: targetTz, hour12: false }),
    }
  }, [inputTime, sourceTz, targetTz])

  return (
    <ToolLayout meta={meta}>
      <div className="space-y-4">
        <div>
          <label className="block text-sm text-text-secondary mb-1">输入时间</label>
          <input
            type="datetime-local"
            value={inputTime}
            onChange={(e) => setInputTime(e.target.value)}
            className="w-full px-3 py-2 bg-bg-secondary border border-border-primary rounded-lg text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-accent-primary"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-text-secondary mb-1">源时区</label>
            <select
              value={sourceTz}
              onChange={(e) => setSourceTz(e.target.value)}
              className="w-full px-3 py-2 bg-bg-secondary border border-border-primary rounded-lg text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-accent-primary"
            >
              {TIMEZONES.map((tz) => (
                <option key={tz.value} value={tz.value}>
                  {tz.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm text-text-secondary mb-1">目标时区</label>
            <select
              value={targetTz}
              onChange={(e) => setTargetTz(e.target.value)}
              className="w-full px-3 py-2 bg-bg-secondary border border-border-primary rounded-lg text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-accent-primary"
            >
              {TIMEZONES.map((tz) => (
                <option key={tz.value} value={tz.value}>
                  {tz.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 bg-bg-secondary border border-border-primary rounded-lg">
            <div className="text-sm text-text-secondary mb-1">
              {TIMEZONES.find((tz) => tz.value === sourceTz)?.label}
            </div>
            <div className="text-xl font-mono text-text-primary">{selectedResult.source}</div>
          </div>
          <div className="p-4 bg-accent-primary/10 border border-accent-primary/20 rounded-lg">
            <div className="text-sm text-accent-primary mb-1">
              {TIMEZONES.find((tz) => tz.value === targetTz)?.label}
            </div>
            <div className="text-xl font-mono text-accent-primary">{selectedResult.target}</div>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-text-primary mb-2">所有时区</label>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
            {convertedTimes.map((tz) => (
              <div
                key={tz.value}
                className="p-2 bg-bg-secondary border border-border-primary rounded-lg cursor-pointer hover:bg-bg-tertiary transition-colors"
                onClick={() => setTargetTz(tz.value)}
              >
                <div className="text-xs text-text-tertiary">{tz.label}</div>
                <div className="font-mono text-sm text-text-primary">{tz.time}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </ToolLayout>
  )
}
