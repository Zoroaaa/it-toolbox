import { Hono } from 'hono'
import type { Env } from '../../types'
import type { ExchangeRateInfo } from '@toolbox/types/api'

export const exchangeRoute = new Hono<{ Bindings: Env }>()

const EXCHANGE_API_URL = 'https://api.exchangerate-api.com/v4/latest'

exchangeRoute.get('/', async (c) => {
  const from = c.req.query('from')?.toUpperCase() || 'USD'
  const to = c.req.query('to')?.toUpperCase() || 'CNY'
  const amount = parseFloat(c.req.query('amount') || '1')

  if (isNaN(amount) || amount < 0) {
    return c.json({ success: false, error: 'Invalid amount' }, 400)
  }

  const cacheKey = `cache:exchange:${from}:${to}`

  try {
    const cached = await c.env.CACHE.get(cacheKey)
    if (cached) {
      const data = JSON.parse(cached)
      return c.json({
        success: true,
        data: {
          rate: data.rate,
          from,
          to,
          amount,
          result: amount * data.rate,
          timestamp: data.timestamp,
          cached: true,
        },
      })
    }
  } catch { /* 缓存不可用不影响查询 */ }

  try {
    const res = await fetch(`${EXCHANGE_API_URL}/${from}`, { signal: AbortSignal.timeout(8000) })
    if (!res.ok) {
      return c.json({ success: false, error: 'Exchange API request failed' }, 502)
    }

    const json = await res.json() as { rates: Record<string, number>; base: string; time_last_updated: number }
    const rate = json.rates[to]

    if (!rate) {
      return c.json({ success: false, error: `Currency ${to} not found` }, 400)
    }

    const timestamp = json.time_last_updated || Math.floor(Date.now() / 1000)
    const cacheData = { rate, timestamp }

    try {
      await c.env.CACHE.put(cacheKey, JSON.stringify(cacheData), { expirationTtl: 3600 })
    } catch { /* 缓存不可用不影响查询 */ }

    return c.json({
      success: true,
      data: {
        rate,
        from,
        to,
        amount,
        result: amount * rate,
        timestamp,
        cached: false,
      },
    })
  } catch (e) {
    return c.json({ success: false, error: (e as Error).message }, 500)
  }
})

exchangeRoute.get('/rates', async (c) => {
  const base = c.req.query('base')?.toUpperCase() || 'USD'
  const cacheKey = `cache:exchange:rates:${base}`

  try {
    const cached = await c.env.CACHE.get(cacheKey)
    if (cached) {
      return c.json({ success: true, data: JSON.parse(cached), cached: true })
    }
  } catch { /* 缓存不可用不影响查询 */ }

  try {
    const res = await fetch(`${EXCHANGE_API_URL}/${base}`, { signal: AbortSignal.timeout(8000) })
    if (!res.ok) {
      return c.json({ success: false, error: 'Exchange API request failed' }, 502)
    }

    const json = await res.json() as { rates: Record<string, number>; base: string; time_last_updated: number }
    const data: ExchangeRateInfo = {
      base: json.base,
      rates: json.rates,
      timestamp: json.time_last_updated || Math.floor(Date.now() / 1000),
    }

    try {
      await c.env.CACHE.put(cacheKey, JSON.stringify(data), { expirationTtl: 3600 })
    } catch { /* 缓存不可用不影响查询 */ }

    return c.json({ success: true, data, cached: false })
  } catch (e) {
    return c.json({ success: false, error: (e as Error).message }, 500)
  }
})
