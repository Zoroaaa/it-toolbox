import { Result } from './common'

export interface TimestampResult {
  unix: number
  unixMs: number
  iso: string
  utc: string
  local: string
  date: Date
}

export function parseTimestamp(input: string | number): Result<TimestampResult> {
  try {
    let date: Date
    const raw = typeof input === 'number' ? String(input) : input.trim()
    // 仅当整串都是数字时才按时间戳处理，避免把 ISO 日期中的年份当成秒
    const num = typeof input === 'number' ? input : /^\d+$/.test(raw) ? parseInt(raw, 10) : NaN

    if (isNaN(num)) {
      date = new Date(raw)
    } else {
      if (num > 1e12) {
        date = new Date(num)
      } else {
        date = new Date(num * 1000)
      }
    }

    if (isNaN(date.getTime())) {
      return { ok: false, error: 'Invalid timestamp or date' }
    }

    return {
      ok: true,
      value: {
        unix: Math.floor(date.getTime() / 1000),
        unixMs: date.getTime(),
        iso: date.toISOString(),
        utc: date.toUTCString(),
        local: date.toLocaleString(),
        date,
      }
    }
  } catch (e) {
    return { ok: false, error: (e as Error).message }
  }
}

export function nowTimestamp(): TimestampResult {
  const date = new Date()
  return {
    unix: Math.floor(date.getTime() / 1000),
    unixMs: date.getTime(),
    iso: date.toISOString(),
    utc: date.toUTCString(),
    local: date.toLocaleString(),
    date,
  }
}

export function dateToTimestamp(date: Date, unit: 's' | 'ms' = 's'): number {
  return unit === 's' ? Math.floor(date.getTime() / 1000) : date.getTime()
}

export interface DateDiff {
  years: number
  months: number
  days: number
  totalDays: number
  weeks: number
  hours: number
  minutes: number
  seconds: number
}

export function dateDifference(date1: Date, date2: Date): DateDiff {
  const ms = Math.abs(date2.getTime() - date1.getTime())
  const seconds = Math.floor(ms / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  const totalDays = Math.floor(hours / 24)
  const weeks = Math.floor(totalDays / 7)
  
  let years = date2.getFullYear() - date1.getFullYear()
  let months = date2.getMonth() - date1.getMonth()
  let days = date2.getDate() - date1.getDate()
  
  if (days < 0) {
    months--
    const prevMonth = new Date(date2.getFullYear(), date2.getMonth(), 0)
    days += prevMonth.getDate()
  }
  if (months < 0) {
    years--
    months += 12
  }
  
  return { years, months, days, totalDays, weeks, hours, minutes, seconds }
}

export function addDays(date: Date, days: number): Date {
  const result = new Date(date)
  result.setDate(result.getDate() + days)
  return result
}

export function addMonths(date: Date, months: number): Date {
  const result = new Date(date)
  result.setMonth(result.getMonth() + months)
  return result
}

export function addYears(date: Date, years: number): Date {
  const result = new Date(date)
  result.setFullYear(result.getFullYear() + years)
  return result
}

export function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60
  
  if (h > 0) {
    return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
  }
  return `${m}:${s.toString().padStart(2, '0')}`
}

export function parseDuration(input: string): Result<number> {
  try {
    if (/^\d+$/.test(input)) {
      return { ok: true, value: parseInt(input, 10) }
    }
    
    const match = input.match(/^(\d+):(\d+)(?::(\d+))?$/)
    if (match) {
      const h = parseInt(match[1], 10)
      const m = parseInt(match[2], 10)
      const s = match[3] ? parseInt(match[3], 10) : 0
      return { ok: true, value: h * 3600 + m * 60 + s }
    }
    
    return { ok: false, error: 'Invalid duration format' }
  } catch (e) {
    return { ok: false, error: (e as Error).message }
  }
}

export function humanizeDuration(seconds: number): string {
  if (seconds < 60) return `${seconds} 秒`
  if (seconds < 3600) return `${Math.floor(seconds / 60)} 分钟`
  if (seconds < 86400) return `${Math.floor(seconds / 3600)} 小时`
  if (seconds < 2592000) return `${Math.floor(seconds / 86400)} 天`
  if (seconds < 31536000) return `${Math.floor(seconds / 2592000)} 个月`
  return `${Math.floor(seconds / 31536000)} 年`
}

export interface CalendarDay {
  date: Date
  day: number
  isToday: boolean
  isCurrentMonth: boolean
  isWeekend: boolean
}

export function generateCalendar(year: number, month: number): CalendarDay[][] {  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  
  const days: CalendarDay[] = []
  
  const startPadding = firstDay.getDay()
  const prevMonth = new Date(year, month, 0)
  for (let i = startPadding - 1; i >= 0; i--) {
    const date = new Date(year, month - 1, prevMonth.getDate() - i)
    days.push({
      date,
      day: date.getDate(),
      isToday: false,
      isCurrentMonth: false,
      isWeekend: date.getDay() === 0 || date.getDay() === 6,
    })
  }
  
  for (let i = 1; i <= lastDay.getDate(); i++) {
    const date = new Date(year, month, i)
    days.push({
      date,
      day: i,
      isToday: date.getTime() === today.getTime(),
      isCurrentMonth: true,
      isWeekend: date.getDay() === 0 || date.getDay() === 6,
    })
  }
  
  const endPadding = 42 - days.length
  for (let i = 1; i <= endPadding; i++) {
    const date = new Date(year, month + 1, i)
    days.push({
      date,
      day: i,
      isToday: false,
      isCurrentMonth: false,
      isWeekend: date.getDay() === 0 || date.getDay() === 6,
    })
  }
  
  const weeks: CalendarDay[][] = []
  for (let i = 0; i < days.length; i += 7) {
    weeks.push(days.slice(i, i + 7))
  }
  
  return weeks
}

/** 取指定时区在某一时刻相对 UTC 的偏移（毫秒） */
export function getTimeZoneOffset(date: Date, timeZone: string): number {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    hour12: false,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).formatToParts(date)

  const map: Record<string, string> = {}
  for (const part of parts) {
    if (part.type !== 'literal') map[part.type] = part.value
  }

  const hour = map.hour === '24' ? '00' : map.hour
  const asUtc = Date.UTC(
    Number(map.year),
    Number(map.month) - 1,
    Number(map.day),
    Number(hour),
    Number(map.minute),
    Number(map.second),
  )
  return asUtc - date.getTime()
}

/**
 * 把「某时区的墙上时间」转成真实时刻。
 * 输入格式：YYYY-MM-DDTHH:mm；两轮偏移计算以覆盖夏令时切换。
 */
export function zonedWallTimeToUtc(local: string, timeZone: string): Date {
  const [datePart, timePart = '00:00'] = local.split('T')
  const [year, month, day] = datePart.split('-').map(Number)
  const [hour, minute] = timePart.split(':').map(Number)
  const wallAsUtc = Date.UTC(year, month - 1, day, hour, minute)

  const firstOffset = getTimeZoneOffset(new Date(wallAsUtc), timeZone)
  const firstGuess = wallAsUtc - firstOffset
  const secondOffset = getTimeZoneOffset(new Date(firstGuess), timeZone)
  return new Date(wallAsUtc - secondOffset)
}

/** 按目标时区格式化某一时刻 */
export function formatInTimeZone(date: Date, timeZone: string, locale = 'zh-CN'): string {
  return date.toLocaleString(locale, { timeZone, hour12: false })
}
