import { test, expect } from '@playwright/test'
import { blockExternal, mockApi, openTool } from '../helpers'

test.describe('国内日常场景工具', () => {
  test.beforeEach(async ({ page }) => {
    await blockExternal(page)
    await mockApi(page)
  })

  test('cookie-parser 解析 Set-Cookie 并生成请求头', async ({ page }) => {
    await openTool(page, 'cookie-parser')
    await page
      .locator('textarea')
      .fill('Set-Cookie: sid=abc123; Domain=example.com; Path=/; Max-Age=3600; SameSite=Lax; HttpOnly; Secure')

    await expect(page.getByText('Domain=example.com', { exact: true })).toBeVisible()
    await expect(page.getByText('SameSite=Lax', { exact: true })).toBeVisible()
    await expect(page.locator('pre')).toHaveText('Cookie: sid=abc123')
  })

  test('cookie-parser 请求头多值并支持取消勾选', async ({ page }) => {
    await openTool(page, 'cookie-parser')
    await page.locator('textarea').fill('Cookie: a=1; b=2')
    await expect(page.locator('pre')).toHaveText('Cookie: a=1; b=2')

    await page.getByLabel('启用 a').uncheck()
    await expect(page.locator('pre')).toHaveText('Cookie: b=2')
  })

  test('rmb-uppercase 金额转大写', async ({ page }) => {
    await openTool(page, 'rmb-uppercase')
    await page.getByPlaceholder('1234.56').fill('1000000.99')
    await expect(page.getByText('壹佰万元玖角玖分')).toBeVisible()

    await page.getByPlaceholder('1234.56').fill('107.05')
    await expect(page.getByText('壹佰零柒元零伍分')).toBeVisible()
  })

  test('rmb-uppercase 拒绝三位小数', async ({ page }) => {
    await openTool(page, 'rmb-uppercase')
    await page.getByPlaceholder('1234.56').fill('1.234')
    await expect(page.getByText('只支持数字金额，且最多两位小数')).toBeVisible()
  })
})
