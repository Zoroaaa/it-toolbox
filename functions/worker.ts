import { createApp } from './app'
import type { Env } from './types'

const app = createApp()

// Workers 入口：/api/* 交给 Hono，其余请求读取 [assets] 绑定的静态资源
export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const { pathname } = new URL(request.url)

    if (pathname === '/api' || pathname.startsWith('/api/')) {
      return app.fetch(request, env, ctx)
    }

    return env.ASSETS.fetch(request)
  },
} satisfies ExportedHandler<Env>
