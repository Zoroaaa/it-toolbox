#!/usr/bin/env node
/**
 * 线上冒烟测试：覆盖全部 /api/* 接口与静态入口。
 * 用法：
 *   node scripts/smoke.mjs                        # 默认 https://ittool.wort.uk
 *   node scripts/smoke.mjs https://xxx.pages.dev   # 指定环境
 *   SMOKE_BASE=https://xxx.pages.dev node scripts/smoke.mjs
 *
 * 退出码：0 全部通过；1 存在失败。
 */

const BASE = (process.argv[2] || process.env.SMOKE_BASE || 'https://ittool.wort.uk').replace(/\/$/, '')
const DEFAULT_TIMEOUT = 20_000

/** @typedef {{ name: string, method?: string, path: string, body?: unknown, timeout?: number, check: (res: Response, json: any, text: string) => string | null }} Case */

/** @type {Case[]} */
const cases = [
  {
    name: '首页',
    path: '/',
    check: (_res, _json, text) =>
      text.includes('<div id="root"') || text.includes('<script') ? null : '返回内容不是应用页面',
  },
  {
    name: 'health',
    path: '/api/health',
    check: (res, json) => (res.ok && json?.ok === true ? null : 'ok 不为 true'),
  },
  {
    name: 'ip',
    path: '/api/ip',
    check: (_res, json) => (json?.success && json?.data?.ip ? null : '缺少 data.ip'),
  },
  {
    name: 'dns',
    path: '/api/dns?domain=example.com&type=A',
    check: (_res, json) =>
      json?.success && Array.isArray(json?.data?.records) && json.data.records.length > 0
        ? null
        : '未返回 A 记录',
  },
  {
    name: 'whois-域名',
    path: '/api/whois?domain=example.com',
    check: (_res, json) =>
      json?.mode === 'domain' && json?.source === 'RDAP' ? null : `mode=${json?.mode} source=${json?.source}`,
  },
  {
    name: 'whois-IP',
    path: '/api/whois?domain=8.8.8.8',
    check: (_res, json) => (json?.mode === 'ip' && json?.country ? null : '缺少 IP 归属地字段'),
  },
  {
    name: 'exchange',
    path: '/api/exchange?from=USD&to=CNY&amount=100',
    check: (_res, json) => (json?.success && Number(json?.data?.rate) > 0 ? null : '汇率无效'),
  },
  {
    name: 'ssl-check',
    path: '/api/ssl-check?domain=example.com',
    check: (_res, json) => (typeof json?.valid === 'boolean' ? null : '缺少 valid 字段'),
  },
  {
    name: 'headers-check',
    path: '/api/headers-check?url=https://example.com',
    check: (_res, json) => (Array.isArray(json?.headers) ? null : '缺少 headers 数组'),
  },
  {
    name: 'proxy',
    method: 'POST',
    path: '/api/proxy',
    body: { url: 'https://example.com' },
    check: (_res, json) => (json?.success === true ? null : '转发失败'),
  },
  {
    name: 'ai-explain',
    method: 'POST',
    path: '/api/ai/explain',
    body: { code: 'const a = 1', language: 'javascript' },
    timeout: 20_000,
    check: (_res, json) =>
      json?.success === true && typeof json?.data?.explanation === 'string' && json.data.explanation.length > 0
        ? null
        : `AI 未返回内容（${json?.error ?? '空响应'}）`,
  },
  {
    name: 'ai-regex',
    method: 'POST',
    path: '/api/ai/regex',
    body: { description: '匹配 3 位数字' },
    timeout: 20_000,
    check: (_res, json) => (json?.success === true && json?.data?.pattern ? null : `AI 未返回 pattern（${json?.error ?? '空响应'}）`),
  },
  {
    name: 'ai-sql',
    method: 'POST',
    path: '/api/ai/sql',
    body: { description: '查询 id 为 1 的用户' },
    timeout: 20_000,
    check: (_res, json) => (json?.success === true && json?.data?.sql ? null : `AI 未返回 sql（${json?.error ?? '空响应'}）`),
  },
  {
    name: 'ai-review',
    method: 'POST',
    path: '/api/ai/review',
    body: { code: 'function add(a, b) { return a + b }', language: 'javascript' },
    timeout: 20_000,
    check: (_res, json) => (json?.success === true && json?.data?.security ? null : `AI 未返回 review 结构（${json?.error ?? '空响应'}）`),
  },
  {
    name: 'ai-json-schema',
    method: 'POST',
    path: '/api/ai/json-schema',
    body: { json: '{"id":1,"name":"x"}' },
    timeout: 20_000,
    check: (_res, json) => (json?.success === true && json?.data?.schema ? null : `AI 未返回 schema（${json?.error ?? '空响应'}）`),
  },
  {
    name: 'ai-commit-msg',
    method: 'POST',
    path: '/api/ai/commit-msg',
    body: { diff: '+const a = 1' },
    timeout: 20_000,
    check: (_res, json) => (json?.success === true && json?.data?.message ? null : `AI 未返回提交信息（${json?.error ?? '空响应'}）`),
  },
  {
    name: 'ai-extract',
    method: 'POST',
    path: '/api/ai/extract',
    body: { text: '张三 13800138000 北京' },
    timeout: 20_000,
    check: (_res, json) => (json?.success === true && json?.data?.data ? null : `AI 未返回提取结果（${json?.error ?? '空响应'}）`),
  },
  {
    name: 'ai-translate',
    method: 'POST',
    path: '/api/ai/translate',
    body: { text: 'hello world', sourceLang: 'auto', targetLang: 'zh' },
    timeout: 20_000,
    check: (_res, json) => (json?.success === true && json?.data?.translation ? null : `AI 未返回翻译（${json?.error ?? '空响应'}）`),
  },
  {
    name: 'ai-error-explain',
    method: 'POST',
    path: '/api/ai/error-explain',
    body: { errorText: 'TypeError: x is undefined' },
    timeout: 20_000,
    check: (_res, json) => (json?.success === true && json?.data?.cause ? null : `AI 未返回错误原因（${json?.error ?? '空响应'}）`),
  },
  {
    name: 'ai-naming',
    method: 'POST',
    path: '/api/ai/naming',
    body: { description: '用户 ID', style: 'camelCase', type: 'variable' },
    timeout: 20_000,
    check: (_res, json) => (json?.success === true && Array.isArray(json?.data?.suggestions) ? null : `AI 未返回命名建议（${json?.error ?? '空响应'}）`),
  },
  {
    name: 'ai-mock-data',
    method: 'POST',
    path: '/api/ai/mock-data',
    body: { description: '用户列表', count: 2 },
    timeout: 20_000,
    check: (_res, json) => (json?.success === true && Array.isArray(json?.data?.data) ? null : `AI 未返回 Mock 数据（${json?.error ?? '空响应'}）`),
  },
  {
    name: 'ai-shell-cmd',
    method: 'POST',
    path: '/api/ai/shell-cmd',
    body: { description: '列出当前目录文件' },
    timeout: 20_000,
    check: (_res, json) => (json?.success === true && json?.data?.bash ? null : `AI 未返回命令（${json?.error ?? '空响应'}）`),
  },
]

async function runOne(testCase) {
  const started = Date.now()
  const url = `${BASE}${testCase.path}`
  const init = { method: testCase.method ?? 'GET', headers: {} }

  if (testCase.body !== undefined) {
    init.headers['Content-Type'] = 'application/json'
    init.body = JSON.stringify(testCase.body)
  }

  try {
    const res = await fetch(url, { ...init, signal: AbortSignal.timeout(testCase.timeout ?? DEFAULT_TIMEOUT) })
    const text = await res.text()
    const elapsed = Date.now() - started

    // 边缘 502：Worker 自身崩溃，响应是纯文本错误页而不是业务 JSON
    if (/^error code: \d+/.test(text.trim())) {
      return { name: testCase.name, ok: false, status: res.status, elapsed, reason: `边缘错误页：${text.trim()}` }
    }

    // 边缘 5xx：Cloudflare 返回 HTML 错误页，说明请求没有走到业务代码
    const contentType = res.headers.get('content-type') ?? ''
    if (res.status >= 500 && contentType.includes('text/html') && !/^\s*[[{]/.test(text)) {
      return {
        name: testCase.name,
        ok: false,
        status: res.status,
        elapsed,
        reason: `边缘错误页（HTTP ${res.status}，非业务 JSON），Worker 未返回响应`,
      }
    }

    if (!res.ok) {
      let message = text.slice(0, 160)
      try {
        const parsed = JSON.parse(text)
        message = parsed?.error ?? parsed?.message ?? message
      } catch {
        /* 非 JSON 直接截断展示 */
      }
      return { name: testCase.name, ok: false, status: res.status, elapsed, reason: message }
    }

    let json = null
    try {
      json = JSON.parse(text)
    } catch {
      json = null
    }

    const problem = testCase.check(res, json, text)
    return { name: testCase.name, ok: problem === null, status: res.status, elapsed, reason: problem }
  } catch (e) {
    const elapsed = Date.now() - started
    const err = /** @type {Error} */ (e)
    const reason = err.name === 'TimeoutError' ? `超时（>${(testCase.timeout ?? DEFAULT_TIMEOUT) / 1000}s）` : err.message
    return { name: testCase.name, ok: false, status: 0, elapsed, reason }
  }
}

const pad = (value, width) => String(value).padEnd(width, ' ')
const width = Math.max(...cases.map((c) => c.name.length)) + 2

console.log(`\n冒烟测试目标：${BASE}\n${'-'.repeat(width + 34)}`)

const results = []
for (const testCase of cases) {
  const result = await runOne(testCase)
  results.push(result)
  const flag = result.ok ? 'PASS' : 'FAIL'
  const detail = result.ok ? '' : `  ← ${result.reason}`
  console.log(`${flag}  ${pad(result.name, width)} ${pad(result.status, 4)} ${result.elapsed}ms${detail}`)
}

const failed = results.filter((r) => !r.ok)
console.log(`${'-'.repeat(width + 34)}`)
console.log(`结果：${results.length - failed.length}/${results.length} 通过`)

if (failed.length) {
  console.log(`失败项：${failed.map((f) => f.name).join('、')}\n`)
  process.exit(1)
}

console.log('全部通过\n')
