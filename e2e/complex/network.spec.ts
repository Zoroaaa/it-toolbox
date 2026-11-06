import { test, expect } from '@playwright/test'
import { blockExternal, mockApi, openTool } from '../helpers'

test.describe('网络与后端工具交互', () => {
  test.beforeEach(async ({ page }) => {
    await blockExternal(page)
    await mockApi(page)
  })

  test('ip-lookup 自动加载与查询', async ({ page }) => {
    await openTool(page, 'ip-lookup')
    await expect(page.getByText('China')).toBeVisible()
    await expect(page.getByText('Beijing').first()).toBeVisible()

    await page.getByPlaceholder('输入 IP 地址查询（留空查询本机 IP）').fill('8.8.8.8')
    await page.getByRole('button', { name: '查询' }).click()
    await expect(page.getByText('8.8.8.8')).toBeVisible()
  })

  test('dns-lookup 查询 A 记录', async ({ page }) => {
    await openTool(page, 'dns-lookup')
    await page.getByPlaceholder('输入域名，如 example.com').fill('example.com')
    await page.getByRole('button', { name: '查询' }).click()
    await expect(page.getByText(/example.com - A 记录 \(1 条\)/)).toBeVisible()
    await expect(page.getByText('93.184.216.34')).toBeVisible()
  })

  test('exchange-rate 自动换算', async ({ page }) => {
    await openTool(page, 'exchange-rate')
    await expect(page.getByText(/1 USD = 7\.2000 CNY/)).toBeVisible()
    await expect(page.getByText('7.2000', { exact: true }).first()).toBeVisible()
  })

  test('ssl-checker 检测证书', async ({ page }) => {
    await openTool(page, 'ssl-checker')
    await page.getByPlaceholder('输入域名，如 example.com').fill('example.com')
    await page.getByRole('button', { name: '检测' }).click()
    await expect(page.getByText("Let's Encrypt")).toBeVisible()
    await expect(page.getByText('剩余天数')).toBeVisible()
  })

  test('headers-check 检测安全头', async ({ page }) => {
    await openTool(page, 'headers-check')
    await page.getByPlaceholder('输入URL，如 https://example.com').fill('https://example.com')
    await page.getByRole('button', { name: '检测' }).click()
    await expect(page.getByText(/测试: 8\/10 通过/)).toBeVisible()
  })

  test('whois-lookup 查询注册商', async ({ page }) => {
    await openTool(page, 'whois-lookup')
    await page.getByPlaceholder('输入域名，如 example.com').fill('example.com')
    await page.getByRole('button', { name: '查询' }).click()
    await expect(page.getByText('Example Registrar')).toBeVisible()
  })

  test('api-playground 发送请求', async ({ page }) => {
    await openTool(page, 'api-playground')
    await page.getByPlaceholder('输入请求 URL (https://api.example.com/endpoint)').fill('https://example.com/api')
    await page.getByRole('button', { name: '发送' }).click()
    await expect(page.getByText('200 OK')).toBeVisible()
  })

  test('json-rpc-test 发送 JSON-RPC 请求', async ({ page }) => {
    await openTool(page, 'json-rpc-test')
    await page.getByPlaceholder('https://api.example.com/rpc').fill('https://example.com/rpc')
    await page.getByPlaceholder('eth_blockNumber').fill('eth_blockNumber')
    await page.getByRole('button', { name: '发送请求' }).click()
    await expect(page.getByText('响应结果')).toBeVisible()
    await expect(page.getByText(/"ok": true/)).toBeVisible()
  })

  test('har-analyzer 解析 HAR 并统计', async ({ page }) => {
    await openTool(page, 'har-analyzer')

    const har = {
      log: {
        version: '1.2',
        entries: [
          {
            startedDateTime: '2026-11-06T10:00:00.000Z',
            time: 100,
            request: { method: 'GET', url: 'https://a.example.com/index.html' },
            response: { status: 200, content: { size: 1000, mimeType: 'text/html' } },
          },
          {
            startedDateTime: '2026-11-06T10:00:01.000Z',
            time: 300,
            request: { method: 'POST', url: 'https://api.example.com/v1/users' },
            response: { status: 201, content: { size: 200, mimeType: 'application/json' } },
          },
          {
            startedDateTime: '2026-11-06T10:00:02.000Z',
            time: 50,
            request: { method: 'GET', url: 'https://cdn.example.com/img.png' },
            response: { status: 404, content: { size: 0, mimeType: 'image/png' } },
          },
        ],
      },
    }

    await page.locator('input[type="file"]').setInputFiles({
      name: 'sample.har',
      mimeType: 'application/json',
      buffer: Buffer.from(JSON.stringify(har)),
    })

    await expect(page.getByText('1.2 KB')).toBeVisible({ timeout: 15_000 })
    await expect(page.getByText('共 3 条 / 第 1 页，共 1 页')).toBeVisible()

    // 状态筛选：只看失败请求
    await page.getByRole('button', { name: '失败', exact: true }).click()
    await expect(page.getByText('共 1 条 / 第 1 页，共 1 页')).toBeVisible()
  })
})
