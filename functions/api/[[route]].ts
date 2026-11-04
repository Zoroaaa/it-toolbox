import { handle } from 'hono/cloudflare-pages'
import { createApp } from '../app'

export type { Env } from '../types'

export const onRequest = handle(createApp())
