import { describe, it, expect } from 'vitest'
import {
  parseTimestamp,
  dateToTimestamp,
  dateDifference,
  addDays,
  addMonths,
  addYears,
  formatDuration,
  parseDuration,
  humanizeDuration,
  generateCalendar,
  getTimeZoneOffset,
  zonedWallTimeToUtc,
  formatInTimeZone,
} from '@core/datetime'

const ok = <T,>(r: { ok: true; value: T } | { ok: false; error: string }): T => {
  if (!r.ok) throw new Error(r.error)
  return r.value
}

describe('时间戳解析', () => {
  it('秒级时间戳', () => {
    const result = ok(parseTimestamp(1700000000))
    expect(result.unix).toBe(1700000000)
    expect(result.unixMs).toBe(1700000000000)
    expect(result.iso).toBe('2023-11-14T22:13:20.000Z')
  })

  it('毫秒级时间戳', () => {
    expect(ok(parseTimestamp(1700000000000)).unix).toBe(1700000000)
  })

  it('字符串数字按秒处理', () => {
    expect(ok(parseTimestamp('1700000000')).unix).toBe(1700000000)
  })

  it('ISO 字符串解析', () => {
    expect(ok(parseTimestamp('2026-01-01T00:00:00.000Z')).iso).toBe('2026-01-01T00:00:00.000Z')
  })

  it.each(['', 'not-a-date', '2026-13-45'])('非法输入 %s 返回错误', (input) => {
    expect(parseTimestamp(input).ok).toBe(false)
  })

  it('dateToTimestamp 支持秒与毫秒', () => {
    const date = new Date(1700000000000)
    expect(dateToTimestamp(date)).toBe(1700000000)
    expect(dateToTimestamp(date, 'ms')).toBe(1700000000000)
  })
})

describe('日期计算', () => {
  it('计算年月日与总量', () => {
    const diff = dateDifference(new Date(2020, 0, 1), new Date(2021, 2, 15))
    expect(diff.years).toBe(1)
    expect(diff.months).toBe(2)
    expect(diff.days).toBe(14)
    expect(diff.totalDays).toBe(439)
  })

  it('跨月按整月与剩余天数计算', () => {
    const diff = dateDifference(new Date(2026, 0, 15), new Date(2026, 2, 20))
    expect(diff.months).toBe(2)
    expect(diff.days).toBe(5)
    expect(diff.totalDays).toBe(64)
  })

  it('日期加减', () => {
    const base = new Date(2026, 0, 31)
    expect(addDays(base, 1).getDate()).toBe(1)
    expect(addMonths(base, 1).getMonth()).toBe(2)
    expect(addYears(base, 1).getFullYear()).toBe(2027)
  })

  it('不修改原日期', () => {
    const base = new Date(2026, 0, 1)
    addDays(base, 10)
    expect(base.getDate()).toBe(1)
  })
})

describe('时长格式化', () => {
  it.each([
    [0, '0:00'],
    [61, '1:01'],
    [3661, '1:01:01'],
    [86399, '23:59:59'],
  ])('formatDuration(%i)', (seconds, expected) => {
    expect(formatDuration(seconds)).toBe(expected)
  })

  it.each([
    ['90', 90],
    ['01:02:00', 3720],
    ['01:02:03', 3723],
    ['0:00:00', 0],
  ])('parseDuration(%s)', (input, expected) => {
    expect(ok(parseDuration(input))).toBe(expected)
  })

  it.each(['abc', '1:2:3:4', '-5'])('parseDuration 非法输入 %s', (input) => {
    expect(parseDuration(input).ok).toBe(false)
  })

  it.each([
    [30, '30 秒'],
    [90, '1 分钟'],
    [3600, '1 小时'],
    [86400, '1 天'],
    [2592000, '1 个月'],
    [31536000, '1 年'],
  ])('humanizeDuration(%i)', (seconds, expected) => {
    expect(humanizeDuration(seconds)).toBe(expected)
  })
})

describe('时区换算', () => {
  it('北京时间 08:00 对应 UTC 00:00', () => {
    const instant = zonedWallTimeToUtc('2026-01-01T08:00', 'Asia/Shanghai')
    expect(instant.toISOString()).toBe('2026-01-01T00:00:00.000Z')
  })

  it('纽约冬令时偏移 -5 小时，夏令时 -4 小时', () => {
    const winter = getTimeZoneOffset(new Date('2026-01-15T12:00:00Z'), 'America/New_York')
    const summer = getTimeZoneOffset(new Date('2026-07-15T12:00:00Z'), 'America/New_York')
    expect(winter).toBe(-5 * 3600 * 1000)
    expect(summer).toBe(-4 * 3600 * 1000)
  })

  it('夏令时切换当天仍能换算', () => {
    const instant = zonedWallTimeToUtc('2026-03-08T12:00', 'America/New_York')
    expect(formatInTimeZone(instant, 'America/New_York')).toContain('12:00')
  })

  it('目标时区格式化', () => {
    const instant = new Date('2026-01-01T00:00:00Z')
    expect(formatInTimeZone(instant, 'Asia/Shanghai')).toContain('08:00')
    expect(formatInTimeZone(instant, 'UTC')).toContain('00:00')
  })
})

describe('日历生成', () => {
  it('固定 6 行 × 7 列', () => {
    const weeks = generateCalendar(2026, 0)
    expect(weeks).toHaveLength(6)
    expect(weeks.every((w) => w.length === 7)).toBe(true)
  })

  it('当前月天数与首尾填充正确', () => {
    const weeks = generateCalendar(2026, 0)
    const days = weeks.flat()
    expect(days.filter((d) => d.isCurrentMonth)).toHaveLength(31)
    expect(days[0].isCurrentMonth).toBe(false)
    expect(days[0].date.getMonth()).toBe(11)
    expect(days[days.length - 1].date.getMonth()).toBe(1)
  })

  it('闰年二月 29 天', () => {
    expect(generateCalendar(2024, 1).flat().filter((d) => d.isCurrentMonth)).toHaveLength(29)
    expect(generateCalendar(2026, 1).flat().filter((d) => d.isCurrentMonth)).toHaveLength(28)
  })

  it('周末标记正确', () => {
    const days = generateCalendar(2026, 0).flat()
    for (const day of days) {
      expect(day.isWeekend).toBe(day.date.getDay() === 0 || day.date.getDay() === 6)
    }
  })
})
