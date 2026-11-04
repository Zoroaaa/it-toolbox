import { Result } from './common'
import cronParser from 'cron-parser'
import cronstrue from 'cronstrue'

export interface CronResult {
  expression: string
  description: string
  nextDates: Date[]
  fields: {
    minute: string
    hour: string
    dayOfMonth: string
    month: string
    dayOfWeek: string
  }
}

export function parseCron(expression: string, count: number = 5): Result<CronResult> {
  try {
    const interval = cronParser.parseExpression(expression)
    const nextDates: Date[] = []
    for (let i = 0; i < count; i++) {
      nextDates.push(interval.next().toDate())
    }

    const description = cronstrue.toString(expression)

    const parts = expression.split(' ')
    const fields = {
      minute: parts[0] || '*',
      hour: parts[1] || '*',
      dayOfMonth: parts[2] || '*',
      month: parts[3] || '*',
      dayOfWeek: parts[4] || '*',
    }

    return { ok: true, value: { expression, description, nextDates, fields } }
  } catch (e) {
    return { ok: false, error: 'Invalid cron expression: ' + (e as Error).message }
  }
}
