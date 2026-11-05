// @vitest-environment node
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { createApp } from '../../functions/app'
import { parseAiJson } from '../../functions/api/routes/ai'
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

describe('WHOIS / RDAP 接口', () => {
  it('非法域名返回 400', async () => {
    const res = await app.request('/api/whois?domain=not%20a%20domain!', {}, env)
    expect(res.status).toBe(400)
  })

  it('RDAP 域名查询映射注册信息', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () =>
        new Response(
          JSON.stringify({
            ldhName: 'example.com',
            status: ['client transfer prohibited'],
            events: [
              { eventAction: 'registration', eventDate: '1995-08-14T04:00:00Z' },
              { eventAction: 'expiration', eventDate: '2026-08-13T04:00:00Z' },
            ],
            nameservers: [{ ldhName: 'a.iana-servers.net' }],
            entities: [
              {
                roles: ['registrar'],
                vcardArray: ['vcard', [['fn', {}, 'text', 'RESERVED-Internet Assigned Numbers Authority']]],
              },
              {
                roles: ['registrant'],
                vcardArray: ['vcard', [['org', {}, 'text', 'Example Org']]],
              },
            ],
          }),
          { status: 200, headers: { 'Content-Type': 'application/rdap+json' } },
        ),
      ),
    )

    const body = await json(await app.request('/api/whois?domain=example.com', {}, env))
    expect(body).toMatchObject({
      mode: 'domain',
      domain: 'example.com',
      registrar: 'RESERVED-Internet Assigned Numbers Authority',
      createdDate: '1995-08-14',
      expiryDate: '2026-08-13',
      source: 'RDAP',
    })
    expect((body.nameservers as string[])[0]).toBe('a.iana-servers.net')
    expect((body.registrant as { organization: string }).organization).toBe('Example Org')
  })

  it('RDAP 404 返回未找到', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response('not found', { status: 404 })))
    const res = await app.request('/api/whois?domain=unregistered-example.com', {}, env)
    expect(res.status).toBe(404)
    expect(String((await json(res)).error)).toContain('未找到')
  })

  it('IP 输入走归属地模式', async () => {
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
            isp: 'Google LLC',
            as: 'AS15169 Google LLC',
          }),
          { status: 200 },
        ),
      ),
    )
    const body = await json(await app.request('/api/whois?domain=8.8.8.8', {}, env))
    expect(body).toMatchObject({ mode: 'ip', ip: '8.8.8.8', country: 'United States', isp: 'Google LLC' })
  })

  it('rdap.org 返回 403 时自动回退到可用 RDAP 源', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async (input: RequestInfo | URL) => {
        const url = String(input)
        if (url.includes('data.iana.org')) {
          return new Response(JSON.stringify({ services: [] }), { status: 200 })
        }
        if (url.includes('rdap.org')) {
          return new Response('<html>403 Forbidden</html>', {
            status: 403,
            headers: { 'Content-Type': 'text/html' },
          })
        }
        return new Response(JSON.stringify({ ldhName: 'example.com', status: ['active'] }), { status: 200 })
      }),
    )

    const res = await app.request('/api/whois?domain=example.com', {}, env)
    expect(res.status).toBe(200)
    expect(await json(res)).toMatchObject({ mode: 'domain', source: 'RDAP' })
  })

  it('全部 RDAP 源不可用时返回结构化 502 而不是抛错', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async (input: RequestInfo | URL) => {
        const url = String(input)
        if (url.includes('data.iana.org')) return new Response('boom', { status: 500 })
        return new Response('<html>blocked</html>', { status: 403, headers: { 'Content-Type': 'text/html' } })
      }),
    )

    const res = await app.request('/api/whois?domain=example.com', {}, env)
    expect(res.status).toBe(502)
    expect(String((await json(res)).error)).toContain('RDAP 查询失败')
  })
})

describe('代理 SSRF 防护', () => {
  it.each([
    'http://127.0.0.1/admin',
    'http://localhost:8080/',
    'http://10.0.0.5/',
    'http://192.168.1.1/',
    'http://169.254.169.254/latest/meta-data/',
    'http://[::1]/',
  ])('拒绝内网地址 %s', async (url) => {
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)
    const res = await app.request('/api/proxy', { method: 'POST', body: JSON.stringify({ url }) }, env)
    expect(res.status).toBe(400)
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('最多跟随 2 次重定向', async () => {
    let calls = 0
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => {
        calls += 1
        return new Response(null, { status: 302, headers: { location: 'https://example.com/next' } })
      }),
    )
    const res = await app.request(
      '/api/proxy',
      { method: 'POST', body: JSON.stringify({ url: 'https://example.com/start' }) },
      env,
    )
    expect(res.status).toBe(400)
    expect(String((await json(res)).error)).toContain('Too many redirects')
    expect(calls).toBe(3)
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

  it('regex 首次非 JSON、重试成功返回 200', async () => {
    ai.run
      .mockResolvedValueOnce({ response: '抱歉我无法完成' })
      .mockResolvedValueOnce({ response: '{"pattern":"\\\\d+","flags":"g","explanation":"数字"}' })

    const body = await json(
      await app.request('/api/ai/regex', { method: 'POST', body: JSON.stringify({ description: '数字' }) }, env),
    )
    expect(body.success).toBe(true)
    expect((body.data as { pattern: string }).pattern).toBe('\\d+')
    expect(ai.run).toHaveBeenCalledTimes(2)
  })

  it('regex 连续两次非 JSON 输出返回 502', async () => {
    ai.run
      .mockResolvedValueOnce({ response: '抱歉我无法完成' })
      .mockResolvedValueOnce({ response: '仍然不是 JSON' })

    const res = await app.request(
      '/api/ai/regex',
      { method: 'POST', body: JSON.stringify({ description: '数字' }) },
      env,
    )
    expect(res.status).toBe(502)
    const body = await json(res)
    expect(body.success).toBe(false)
    expect(String(body.error)).toContain('无法解析')
    expect(ai.run).toHaveBeenCalledTimes(2)
  })

  it('json-schema 将对象 schema 归一化为字符串', async () => {
    ai.run.mockResolvedValueOnce({
      response: '{"schema":{"type":"object","properties":{}},"explanation":"对象"}',
    })

    const body = await json(
      await app.request(
        '/api/ai/json-schema',
        { method: 'POST', body: JSON.stringify({ json: '{"a":1}' }) },
        env,
      ),
    )
    expect(body.success).toBe(true)
    const data = body.data as { schema: string; explanation: string }
    expect(typeof data.schema).toBe('string')
    expect(data.schema).toContain('"type": "object"')
    expect(data.explanation).toBe('对象')
  })

  it('主模型退役报错时自动降级到下一个模型', async () => {
    ai.run
      .mockRejectedValueOnce(new Error('No such model: @cf/meta/llama-3.1-8b-instruct'))
      .mockResolvedValueOnce({ response: '降级后的解释' })

    const body = await json(
      await app.request('/api/ai/explain', { method: 'POST', body: JSON.stringify({ code: 'const a=1' }) }, env),
    )
    expect(body).toMatchObject({ success: true, data: { explanation: '降级后的解释' } })
    expect(ai.run).toHaveBeenCalledTimes(2)
  })

  it('未绑定 AI 时返回可读错误而不是崩溃', async () => {
    const bareEnv = { ...env, AI: undefined } as unknown as Env
    const res = await app.request(
      '/api/ai/explain',
      { method: 'POST', body: JSON.stringify({ code: 'const a=1' }) },
      bareEnv,
    )
    expect(res.status).toBe(502)
    expect(String((await json(res)).error)).toContain('AI 绑定未配置')
  })

  it('全部候选模型不可用时返回 502 JSON 并携带模型原因', async () => {
    ai.run
      .mockRejectedValueOnce(new Error('No such model: fp8'))
      .mockRejectedValueOnce(new Error('No such model: glm'))
      .mockRejectedValueOnce(new Error('No such model: 70b'))

    const res = await app.request(
      '/api/ai/explain',
      { method: 'POST', body: JSON.stringify({ code: 'const a=1' }) },
      env,
    )
    expect(res.status).toBe(502)
    const body = await json(res)
    expect(body.success).toBe(false)
    expect(String(body.error)).toContain('@cf/meta/llama-3.1-8b-instruct-fp8')
    expect(ai.run).toHaveBeenCalledTimes(3)
  })
})

describe('AI JSON 输出解析', () => {
  it('解析纯 JSON', () => {
    expect(parseAiJson('{"pattern":"\\\\d+","flags":"g"}')).toEqual({ pattern: '\\d+', flags: 'g' })
  })

  it('去掉代码围栏', () => {
    expect(parseAiJson('```json\n{"ok":true}\n```')).toEqual({ ok: true })
  })

  it('提取前后夹带说明文字中的 JSON 对象', () => {
    expect(parseAiJson('这是结果：{"a":{"b":1}} 仅供参考')).toEqual({ a: { b: 1 } })
  })

  it('字符串中的括号不会破坏配对', () => {
    expect(parseAiJson('{"s":"a}b{c"}')).toEqual({ s: 'a}b{c' })
  })

  it('提取数组', () => {
    expect(parseAiJson('结果：[{"a":1}]')).toEqual([{ a: 1 }])
  })

  it('解包双重编码的 JSON 字符串', () => {
    expect(parseAiJson('"{\\"a\\":1}"')).toEqual({ a: 1 })
  })

  it('容忍尾逗号', () => {
    expect(parseAiJson('{"a":1,}')).toEqual({ a: 1 })
  })

  it('无法解析时返回 null', () => {
    expect(parseAiJson('抱歉，我无法完成这个请求')).toBeNull()
    expect(parseAiJson('{"a":')).toBeNull()
  })
})
