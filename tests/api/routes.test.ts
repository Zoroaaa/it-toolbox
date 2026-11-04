// @vitest-environment node
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { createApp } from '../../functions/app'
import type { Env } from '../../functions/types'

const kv = {
  store: new Map<string, string>(),
  get: vi.fn(async (key: string) => kv.store.get(key) ?? null),
  put: vi.fn(async (key: string, value: string) => {
    kv.store.set(key, value)
  }),
}

const ai = {
  run: vi.fn(async () => ({ response: '{"pattern":"\\\\d+","flags":"g","explanation":"数字"}' })),
}

const env = {
  CACHE: kv,
  AI: ai,
  ENVIRONMENT: 'test',
  EXCHANGE_API_KEY: 'test-key',
} as unknown as Env

const app = createApp()

const json = async (res: Response) => (await res.json()) as Record<string, unknown>

beforeEach(() => {
  kv.store.clear()
  kv.get.mockClear()
  kv.put.mockClear()
  ai.run.mockClear()
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('健康检查', () => {
  it('返回 ok', async () => {
    const res = await app.request('/api/health', {}, env)
    expect(res.status).toBe(200)
    expect(await json(res)).toMatchObject({ ok: true })
  })
})

describe('DNS 接口', () => {
  it('缺少 domain 返回 400', async () => {
    const res = await app.request('/api/dns', {}, env)
    expect(res.status).toBe(400)
    expect(await json(res)).toMatchObject({ success: false })
  })

  it('查询成功并映射 records', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response(JSON.stringify({ Answer: [{ name: 'a.com', data: '1.2.3.4' }] }), { status: 200 })),
    )
    const res = await app.request('/api/dns?domain=a.com&type=A', {}, env)
    expect(res.status).toBe(200)
    const body = await json(res)
    expect(body.success).toBe(true)
    expect((body.data as { records: unknown[] }).records).toHaveLength(1)
    expect(kv.put).toHaveBeenCalled()
  })

  it('命中缓存时不再请求上游', async () => {
    kv.store.set('cache:dns:a.com:A', JSON.stringify({ domain: 'a.com', type: 'A', records: [] }))
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)
    const body = await json(await app.request('/api/dns?domain=a.com&type=A', {}, env))
    expect(body.cached).toBe(true)
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('上游失败返回 502', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response('bad', { status: 500 })))
    const res = await app.request('/api/dns?domain=a.com', {}, env)
    expect(res.status).toBe(502)
  })
})

describe('IP 接口', () => {
  it('查询指定 IP 并映射字段', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () =>
        new Response(
          JSON.stringify({
            status: 'success',
            query: '8.8.8.8',
            country: 'United States',
            regionName: 'California',
            city: 'Mountain View',
            timezone: 'America/Los_Angeles',
            as: 'AS15169',
            org: 'Google',
            lat: 37.4,
            lon: -122.1,
          }),
          { status: 200 },
        ),
      ),
    )
    const res = await app.request('/api/ip?ip=8.8.8.8', {}, env)
    const body = await json(res)
    expect(body.success).toBe(true)
    expect(body.data).toMatchObject({ ip: '8.8.8.8', country: 'United States', asn: 'AS15169' })
  })

  it('上游返回失败状态时透传错误', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response(JSON.stringify({ status: 'fail', message: 'reserved range' }), { status: 200 })),
    )
    const res = await app.request('/api/ip?ip=10.0.0.1', {}, env)
    expect(res.status).toBe(400)
    expect(await json(res)).toMatchObject({ success: false, error: 'reserved range' })
  })
})

describe('代理接口', () => {
  it('缺少 url 返回 400', async () => {
    const res = await app.request('/api/proxy', { method: 'POST', body: '{}' }, env)
    expect(res.status).toBe(400)
  })

  it('拒绝非 HTTP 协议', async () => {
    const res = await app.request(
      '/api/proxy',
      { method: 'POST', body: JSON.stringify({ url: 'file:///etc/passwd' }) },
      env,
    )
    expect(res.status).toBe(400)
  })

  it('成功转发并返回状态与 body', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response('{"ok":true}', { status: 201, statusText: 'Created' })),
    )
    const res = await app.request(
      '/api/proxy',
      {
        method: 'POST',
        body: JSON.stringify({ url: 'https://api.example.com/x', method: 'POST', headers: {}, body: '{}' }),
      },
      env,
    )
    const body = await json(res)
    expect(body).toMatchObject({ success: true, status: 201, statusText: 'Created', body: '{"ok":true}' })
  })
})

describe('汇率接口', () => {
  it('拒绝非法金额', async () => {
    const res = await app.request('/api/exchange?amount=-1', {}, env)
    expect(res.status).toBe(400)
  })

  it('查询成功并计算换算结果', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () =>
        new Response(JSON.stringify({ rates: { CNY: 7 }, time_last_update_unix: 1700000000 }), { status: 200 }),
      ),
    )
    const body = await json(await app.request('/api/exchange?from=USD&to=CNY&amount=10', {}, env))
    expect(body.success).toBe(true)
    expect((body.data as { result: number }).result).toBe(70)
  })
})

describe('AI 接口契约', () => {
  it('explain 缺少 code 返回 400', async () => {
    const res = await app.request('/api/ai/explain', { method: 'POST', body: '{}' }, env)
    expect(res.status).toBe(400)
  })

  it('explain 超长返回 400', async () => {
    const res = await app.request(
      '/api/ai/explain',
      { method: 'POST', body: JSON.stringify({ code: 'a'.repeat(4001) }) },
      env,
    )
    expect(res.status).toBe(400)
  })

  it('explain 成功返回解释文本', async () => {
    ai.run.mockResolvedValueOnce({ response: '这段代码做了 X' })
    const body = await json(
      await app.request('/api/ai/explain', { method: 'POST', body: JSON.stringify({ code: 'const a=1' }) }, env),
    )
    expect(body).toMatchObject({ success: true, data: { explanation: '这段代码做了 X' } })
  })

  it('regex 缺少 description 返回 400', async () => {
    const res = await app.request('/api/ai/regex', { method: 'POST', body: '{}' }, env)
    expect(res.status).toBe(400)
  })

  it('regex 解析 AI JSON 输出', async () => {
    const body = await json(
      await app.request('/api/ai/regex', { method: 'POST', body: JSON.stringify({ description: '数字' }) }, env),
    )
    expect(body.success).toBe(true)
    expect((body.data as { pattern: string }).pattern).toBe('\\d+')
  })

  it('regex 遇到非 JSON 输出返回 500', async () => {
    ai.run.mockResolvedValueOnce({ response: '抱歉我无法完成' })
    const res = await app.request(
      '/api/ai/regex',
      { method: 'POST', body: JSON.stringify({ description: '数字' }) },
      env,
    )
    expect(res.status).toBe(500)
    expect(await json(res)).toMatchObject({ success: false })
  })
})
