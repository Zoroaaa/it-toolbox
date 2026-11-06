import { describe, it, expect } from 'vitest'
import { analyzeHar, harEntriesToCsv, type HarReport } from '@core/har'

const HAR = {
  log: {
    version: '1.2',
    creator: { name: 'test', version: '1' },
    startedDateTime: '2026-11-06T10:00:00.000Z',
    entries: [
      {
        startedDateTime: '2026-11-06T10:00:00.000Z',
        time: 100,
        request: { method: 'GET', url: 'https://a.example.com/index.html' },
        response: {
          status: 200,
          content: { size: 1000, mimeType: 'text/html; charset=utf-8' },
        },
      },
      {
        startedDateTime: '2026-11-06T10:00:01.000Z',
        time: 300,
        request: { method: 'POST', url: 'https://api.example.com/v1/users?page=1' },
        response: { status: 201, content: { size: 200, mimeType: 'application/json' } },
      },
      {
        startedDateTime: '2026-11-06T10:00:02.000Z',
        time: 50,
        request: { method: 'GET', url: 'https://cdn.example.com/img.png' },
        response: { status: 404, content: { size: 0, mimeType: 'image/png' } },
      },
      {
        startedDateTime: '2026-11-06T10:00:03.000Z',
        time: 20,
        request: { method: 'GET', url: 'https://api.example.com/v1/ping' },
        response: { status: 0, bodySize: -1, content: { size: -1, mimeType: 'application/json' } },
      },
    ],
  },
}

const analyze = (input: unknown): HarReport => {
  const result = analyzeHar(JSON.stringify(input))
  if (!result.ok) throw new Error(result.error)
  return result.value
}

describe('analyzeHar — 汇总', () => {
  it('统计请求数与总量', () => {
    const report = analyze(HAR)
    expect(report.entryCount).toBe(4)
    expect(report.totalSizeBytes).toBe(1200)
    expect(report.totalTimeMs).toBe(470)
  })

  it('墙钟跨度取首尾时间差', () => {
    const report = analyze(HAR)
    // 10:00:00.000 开始，最后一个 10:00:03.000 + 20ms 结束
    expect(report.wallTimeMs).toBe(3020)
  })

  it('按状态码分组，0 计入 failed', () => {
    const report = analyze(HAR)
    expect(report.statusGroups).toEqual({ '2xx': 2, '3xx': 0, '4xx': 1, '5xx': 0, failed: 1 })
  })

  it('域名聚合按体积降序', () => {
    const report = analyze(HAR)
    expect(report.domains[0]).toMatchObject({ host: 'a.example.com', count: 1, sizeBytes: 1000 })
    expect(report.domains.map((d) => d.host)).toEqual([
      'a.example.com',
      'api.example.com',
      'cdn.example.com',
    ])
    const api = report.domains.find((d) => d.host === 'api.example.com')
    expect(api).toMatchObject({ count: 2, sizeBytes: 200 })
  })

  it('MIME 去掉 charset 参数后再聚合', () => {
    const report = analyze(HAR)
    expect(report.mimeTypes[0]).toMatchObject({ mimeType: 'application/json', count: 2 })
    expect(report.mimeTypes.some((m) => m.mimeType === 'text/html')).toBe(true)
  })

  it('方法分布按次数降序', () => {
    const report = analyze(HAR)
    expect(report.methods[0]).toEqual({ method: 'GET', count: 3 })
    expect(report.methods[1]).toEqual({ method: 'POST', count: 1 })
  })

  it('慢请求取前 10 并按耗时降序', () => {
    const report = analyze(HAR)
    expect(report.slowest[0].timeMs).toBe(300)
    expect(report.slowest.map((e) => e.timeMs)).toEqual([300, 100, 50, 20])
  })

  it('失败请求包含 4xx/5xx 与 status=0', () => {
    const report = analyze(HAR)
    expect(report.failures.map((e) => e.status)).toEqual([404, 0])
  })

  it('路径保留查询串', () => {
    const report = analyze(HAR)
    const api = report.entries.find((e) => e.url.includes('/v1/users'))
    expect(api?.path).toBe('/v1/users?page=1')
  })

  it('size 未知时按 0 计，不回退成 -1', () => {
    const report = analyze(HAR)
    const ping = report.entries.find((e) => e.url.includes('/v1/ping'))
    expect(ping?.sizeBytes).toBe(0)
  })
})

describe('analyzeHar — time 缺失时用 timings 求和', () => {
  it('time 为 -1 时回退到 timings', () => {
    const report = analyze({
      log: {
        entries: [
          {
            time: -1,
            timings: { blocked: 5, dns: 10, connect: 20, ssl: 0, send: 1, wait: 30, receive: 4 },
            request: { method: 'GET', url: 'https://x.test/' },
            response: { status: 200, content: { size: 1, mimeType: 'text/plain' } },
          },
        ],
      },
    })
    expect(report.totalTimeMs).toBe(70)
  })
})

describe('analyzeHar — 异常输入', () => {
  it('空字符串报错', () => {
    expect(analyzeHar('   ').ok).toBe(false)
  })

  it('非法 JSON 报错', () => {
    const result = analyzeHar('{oops')
    expect(result).toEqual({ ok: false, error: '不是合法 JSON，请确认导出的是 HAR 文件' })
  })

  it('缺少 log.entries 报错', () => {
    const result = analyzeHar(JSON.stringify({ log: {} }))
    expect(result).toEqual({ ok: false, error: '不是有效的 HAR：缺少 log.entries' })
  })

  it('entries 为空报错', () => {
    const result = analyzeHar(JSON.stringify({ log: { entries: [] } }))
    expect(result).toEqual({ ok: false, error: 'HAR 中没有可分析的请求' })
  })
})

describe('harEntriesToCsv', () => {
  it('输出表头与逐行数据', () => {
    const report = analyze(HAR)
    const csv = harEntriesToCsv(report.entries)
    const lines = csv.split('\n')
    expect(lines[0]).toBe('序号,方法,状态,域名,路径,大小(B),耗时(ms),类型,URL')
    expect(lines[1]).toBe('0,GET,200,a.example.com,/index.html,1000,100,text/html,https://a.example.com/index.html')
  })

  it('含逗号与引号的字段会被转义', () => {
    const csv = harEntriesToCsv([
      {
        index: 0,
        method: 'GET',
        url: 'https://x.test/a?b=1,2',
        host: 'x.test',
        path: '/a?b=1,2',
        status: 200,
        mimeType: 'text/plain',
        timeMs: 1,
        sizeBytes: 2,
        startedAt: '',
      },
    ])
    expect(csv.split('\n')[1]).toContain('"/a?b=1,2"')
    expect(csv.split('\n')[1]).toContain('"https://x.test/a?b=1,2"')
  })
})
