import { Hono } from 'hono'
import { handle } from 'hono/cloudflare-pages'
import { cors } from 'hono/cors'
import { ipRoute } from './routes/ip'
import { dnsRoute } from './routes/dns'
import { aiRoute } from './routes/ai'

export interface Env {
  CACHE: KVNamespace
  FILES: R2Bucket
  AI: Ai
  RATE_LIMITER: DurableObjectNamespace
  ENVIRONMENT: string
  EXCHANGE_API_KEY: string
}

const app = new Hono<{ Bindings: Env }>()

app.use('/api/*', cors())

app.get('/api/health', (c) => c.json({ ok: true, ts: Date.now() }))

app.route('/api/ip', ipRoute)
app.route('/api/dns', dnsRoute)
app.route('/api/ai', aiRoute)

// Durable Object export for rate limiter
export class RateLimiterDO {
  private requests: number[] = []

  async fetch(request: Request): Promise<Response> {
    const now = Date.now()
    const windowMs = 60_000
    this.requests = this.requests.filter(t => now - t < windowMs)

    const url = new URL(request.url)
    const limit = url.searchParams.get('limit') === 'ai' ? 10 : 60

    if (this.requests.length >= limit) {
      return new Response(JSON.stringify({ error: 'Rate limit exceeded' }), {
        status: 429,
        headers: {
          'Content-Type': 'application/json',
          'Retry-After': '60',
        }
      })
    }
    this.requests.push(now)
    return new Response('OK')
  }
}

export const onRequest = handle(app)
