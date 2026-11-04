import { Hono } from 'hono'
import { cors } from 'hono/cors'
import type { Env } from './types'
import { ipRoute } from './api/routes/ip'
import { dnsRoute } from './api/routes/dns'
import { aiRoute } from './api/routes/ai'
import { exchangeRoute } from './api/routes/exchange'
import { proxyRoute } from './api/routes/proxy'
import { whoisRoute } from './api/routes/whois'
import { sslCheckRoute } from './api/routes/ssl-check'
import { headersCheckRoute } from './api/routes/headers-check'

export function createApp() {
  const app = new Hono<{ Bindings: Env }>()

  app.use('/api/*', cors())

  app.get('/api/health', (c) => c.json({ ok: true, ts: Date.now() }))

  app.route('/api/ip', ipRoute)
  app.route('/api/dns', dnsRoute)
  app.route('/api/ai', aiRoute)
  app.route('/api/exchange', exchangeRoute)
  app.route('/api/proxy', proxyRoute)
  app.route('/api/whois', whoisRoute)
  app.route('/api/ssl-check', sslCheckRoute)
  app.route('/api/headers-check', headersCheckRoute)

  // 兜底：未捕获异常统一转成 JSON，避免边缘直接返回不可读的 "error code: 502"
  app.onError((err, c) => {
    console.error('[api] unhandled error:', err)
    return c.json({ success: false, error: '服务内部错误，请稍后重试' }, 500)
  })

  return app
}
