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

  const reset = () => {
    setInputTime(new Date().toISOString().slice(0, 16))
    setSourceTz('Asia/Shanghai')
    setTargetTz('America/New_York')
  }

  return (
    <ToolLayout meta={meta} onReset={reset}>
      <div className="space-y-4">
        <div>
          <label className="text-xs font-medium text-text-muted uppercase tracking-wider block mb-1">输入时间</label>
          <input
            type="datetime-local"
            value={inputTime}
            onChange={(e) => setInputTime(e.target.value)}
            className="tool-input"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-medium text-text-muted uppercase tracking-wider block mb-1">源时区</label>
            <select
              value={sourceTz}
              onChange={(e) => setSourceTz(e.target.value)}
              className="tool-input"
            >
              {TIMEZONES.map((tz) => (
                <option key={tz.value} value={tz.value}>
                  {tz.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-text-muted uppercase tracking-wider block mb-1">目标时区</label>
            <select
              value={targetTz}
              onChange={(e) => setTargetTz(e.target.value)}
              className="tool-input"
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
          <div className="p-4 bg-bg-surface border border-border-base rounded-lg">
            <div className="text-xs font-medium text-text-muted uppercase tracking-wider mb-1">
              {TIMEZONES.find((tz) => tz.value === sourceTz)?.label}
            </div>
            <div className="text-xl font-mono text-text-primary">{selectedResult.source}</div>
          </div>
          <div className="p-4 bg-accent/10 border border-accent/20 rounded-lg">
            <div className="text-xs font-medium text-accent mb-1">
              {TIMEZONES.find((tz) => tz.value === targetTz)?.label}
            </div>
            <div className="text-xl font-mono text-accent">{selectedResult.target}</div>
          </div>
        </div>

        <div>
          <label className="text-xs font-medium text-text-muted uppercase tracking-wider block mb-2">所有时区</label>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 overflow-y-auto max-h-[calc(100vh-28rem)]">
            {convertedTimes.map((tz) => (
              <div
                key={tz.value}
                className="p-2 bg-bg-surface border border-border-base rounded-lg cursor-pointer hover:bg-bg-raised transition-colors"
                onClick={() => setTargetTz(tz.value)}
              >
                <div className="text-xs text-text-muted">{tz.label}</div>
                <div className="font-mono text-sm text-text-primary">{tz.time}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </ToolLayout>
  )
}
