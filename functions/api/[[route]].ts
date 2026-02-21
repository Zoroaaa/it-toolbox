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
  ENVIRONMENT: string
  EXCHANGE_API_KEY: string
}

const app = new Hono<{ Bindings: Env }>()

app.use('/api/*', cors())

app.get('/api/health', (c) => c.json({ ok: true, ts: Date.now() }))

app.route('/api/ip', ipRoute)
app.route('/api/dns', dnsRoute)
app.route('/api/ai', aiRoute)

export const onRequest = handle(app)
