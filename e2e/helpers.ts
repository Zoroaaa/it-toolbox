import { readdirSync, existsSync } from 'node:fs'
import { resolve } from 'node:path'
import sharp from 'sharp'
import type { Page } from '@playwright/test'

/** 从磁盘读取工具目录，避免在 Playwright 中解析项目 TS 别名。 */
export function getToolIds(): string[] {
  return readdirSync(resolve('src/tools'), { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .filter(
      (name) =>
        existsSync(resolve('src/tools', name, 'index.tsx')) &&
        existsSync(resolve('src/tools', name, 'meta.ts')),
    )
    .sort()
}

/** 拦截外部字体请求，避免 E2E 依赖外网。 */
export async function blockExternal(page: Page): Promise<void> {
  await page.route(/fonts\.(googleapis|gstatic)\.com/, (route) => route.abort())
}

/** 收集未捕获异常，供断言使用。 */
export function collectPageErrors(page: Page): string[] {
  const errors: string[] = []
  page.on('pageerror', (error) => errors.push(error.message))
  return errors
}

const aiFixtures: Record<string, unknown> = {
  explain: { explanation: '这段代码声明了常量 a' },
  regex: { pattern: '\\d+', flags: 'g', explanation: '匹配数字' },
  sql: { sql: 'SELECT * FROM users', explanation: '查询用户表' },
  review: {
    security: { score: 80, issues: [], suggestions: [] },
    performance: { score: 85, issues: [], suggestions: [] },
    readability: { score: 90, issues: [], suggestions: [] },
    overall: '整体良好',
  },
  'json-schema': { schema: { type: 'object' }, explanation: '对象结构' },
  'commit-msg': {
    message: 'feat: 添加常量',
    type: 'feat',
    scope: 'core',
    description: '添加常量',
    body: '',
  },
  extract: { data: { name: '张三', phone: '13800138000' }, explanation: '已提取字段' },
  translate: { translation: '你好，世界', detectedLanguage: 'en', notes: '' },
  'error-explain': {
    cause: '变量未定义',
    explanation: 'x 没有声明',
    solutions: ['声明变量'],
    relatedDocs: '',
  },
  naming: {
    suggestions: [{ name: 'userId', type: 'variable', style: 'camelCase', explanation: '命名清晰' }],
  },
  'mock-data': { data: [{ id: 1, name: '张三' }], explanation: '已生成数据' },
  'shell-cmd': {
    bash: 'ls -la',
    powershell: 'Get-ChildItem',
    explanation: '列出当前目录文件',
    warnings: ['删除操作需谨慎'],
    isDangerous: true,
  },
}

/** 所有 /api/** 返回确定性 fixture，杜绝真实网络与配额消耗。 */
export async function mockApi(page: Page): Promise<void> {
  await page.route('**/api/**', async (route) => {
    const url = new URL(route.request().url())
    const pathname = url.pathname

    let payload: unknown = { success: true, data: {} }

    if (pathname.startsWith('/api/ai/')) {
      const endpoint = pathname.slice('/api/ai/'.length)
      payload = { success: true, data: aiFixtures[endpoint] ?? { response: 'mock' } }
    } else if (pathname === '/api/ip') {
      payload = {
        success: true,
        data: {
          ip: url.searchParams.get('ip') || '1.2.3.4',
          city: 'Beijing',
          country: 'China',
          region: 'Beijing',
          timezone: 'Asia/Shanghai',
          asn: 'AS12345',
          asOrganization: 'Example ISP',
          latitude: 39.9,
          longitude: 116.4,
        },
      }
    } else if (pathname === '/api/dns') {
      payload = {
        success: true,
        data: {
          domain: url.searchParams.get('domain') || 'example.com',
          type: url.searchParams.get('type') || 'A',
          records: [
            { name: 'example.com', type: 1, TTL: 300, data: '93.184.216.34' },
          ],
        },
      }
    } else if (pathname === '/api/exchange') {
      const amount = Number(url.searchParams.get('amount') || 1)
      payload = {
        success: true,
        data: {
          rate: 7.2,
          from: url.searchParams.get('from') || 'USD',
          to: url.searchParams.get('to') || 'CNY',
          amount,
          result: amount * 7.2,
          timestamp: 1700000000,
          cached: false,
        },
      }
    } else if (pathname === '/api/exchange/rates') {
      payload = { success: true, data: { base: 'USD', rates: { CNY: 7.2, EUR: 0.9 }, timestamp: 1700000000 } }
    } else if (pathname === '/api/ssl-check') {
      payload = {
        domain: url.searchParams.get('domain') || 'example.com',
        valid: true,
        issuer: "Let's Encrypt",
        subject: 'example.com',
        validFrom: '2026-01-01T00:00:00Z',
        validTo: '2027-01-01T00:00:00Z',
        daysRemaining: 30,
        serialNumber: '123456',
        signatureAlgorithm: 'sha256WithRSAEncryption',
        sans: ['example.com', 'www.example.com'],
        source: 'crt.sh (Certificate Transparency)',
      }
    } else if (pathname === '/api/headers-check') {
      payload = {
        url: url.searchParams.get('url') || 'https://example.com',
        headers: [
          {
            name: 'Strict-Transport-Security',
            present: true,
            value: 'max-age=31536000',
            recommendation: '启用 HSTS',
            severity: 'high',
            pass: true,
            scoreModifier: 20,
            result: 'present',
          },
        ],
        score: 80,
        grade: 'B',
        warnings: [],
        source: '本地检测',
        testsFailed: 2,
        testsPassed: 8,
        testsQuantity: 10,
      }
    } else if (pathname === '/api/whois') {
      payload = {
        mode: 'domain',
        domain: url.searchParams.get('domain') || 'example.com',
        registrar: 'Example Registrar',
        createdDate: '1995-08-14',
        updatedDate: '2025-08-14',
        expiryDate: '2026-08-13',
        status: ['active'],
        nameservers: ['ns1.example.com'],
        source: 'RDAP',
      }
    } else if (pathname === '/api/proxy') {
      payload = {
        success: true,
        status: 200,
        statusText: 'OK',
        headers: { 'content-type': 'application/json' },
        body: '{"ok":true}',
        truncated: false,
      }
    } else if (pathname === '/api/health') {
      payload = { ok: true, ts: 1700000000 }
    }

    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(payload),
    })
  })
}

/** 进入工具页并等待渲染完成。 */
export async function openTool(page: Page, id: string): Promise<void> {
  await page.goto(`/tool/${id}`)
  await page.getByTestId('tool-page').waitFor({ state: 'visible' })
}

/** 生成测试图片，避免提交二进制 fixture。 */
export async function makePng(width = 200, height = 100, background = '#ff0000'): Promise<Buffer> {
  return sharp({ create: { width, height, channels: 3, background } }).png().toBuffer()
}

export async function makeJpeg(width = 200, height = 100, background = '#3366ff'): Promise<Buffer> {
  return sharp({ create: { width, height, channels: 3, background } }).jpeg().toBuffer()
}

export const SAMPLE_SVG =
  '<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><rect width="100" height="100" fill="#ff0000"/></svg>'

/** 上传文件到工具页的第一个 file input。 */
export async function uploadFile(
  page: Page,
  buffer: Buffer,
  name = 'sample.png',
  mimeType = 'image/png',
  index = 0,
): Promise<void> {
  await page.locator('input[type="file"]').nth(index).setInputFiles({ name, mimeType, buffer })
}

