import { test, expect } from '@playwright/test'
import { blockExternal, mockApi, openTool, uploadFile } from '../helpers'

test.describe('加密与数据工具交互', () => {
  test.beforeEach(async ({ page }) => {
    await blockExternal(page)
    await mockApi(page)
  })

  test('hash-calculator 计算 MD5 与 SHA-256', async ({ page }) => {
    await openTool(page, 'hash-calculator')
    await page.getByPlaceholder('输入要计算哈希的文本...').fill('hello')
    await page.getByRole('button', { name: '计算', exact: true }).click()
    await expect(page.getByText('5d41402abc4b2a76b9719d911017c592')).toBeVisible()
    await expect(page.getByText('2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824')).toBeVisible()
  })

  test('aes-encrypt 加密后解密回原文', async ({ page }) => {
    await openTool(page, 'aes-encrypt')
    await page.getByPlaceholder('输入密码...').fill('secret-key')
    await page.getByPlaceholder('输入要加密的文本...').fill('hello world')
    await page.locator('button.btn-primary').click()

    const output = page.getByPlaceholder('结果将在这里显示...')
    await expect(output).not.toHaveValue('', { timeout: 15_000 })
    const cipher = await output.inputValue()
    expect(cipher.length).toBeGreaterThan(8)

    await page.getByRole('button', { name: '解密', exact: true }).last().click()
    await page.getByPlaceholder('输入 Base64 密文...').fill(cipher)
    await page.locator('button.btn-primary').click()
    await expect(page.getByPlaceholder('结果将在这里显示...')).toHaveValue('hello world')
  })

  test('hmac 计算签名', async ({ page }) => {
    await openTool(page, 'hmac')
    await page.getByPlaceholder('输入要计算 HMAC 的消息...').fill('hello')
    await page.getByPlaceholder('输入密钥...').fill('secret')
    await page.getByRole('button', { name: '计算 HMAC' }).click()
    await expect(page.getByText(/^[a-f0-9]{64}$/)).toBeVisible()
  })

  test('bcrypt 生成哈希', async ({ page }) => {
    await openTool(page, 'bcrypt')
    await page.getByPlaceholder('密码...').fill('hello-world')
    await page.locator('button.btn-primary').click()
    await expect(page.getByPlaceholder('结果将在这里显示...')).toHaveValue(/^\$2[aby]\$/, { timeout: 15_000 })
  })

  test('jwt-generator 生成三段式 JWT', async ({ page }) => {
    await openTool(page, 'jwt-generator')
    await page.getByPlaceholder('JWT Payload...').fill('{"sub":"123"}')
    await page.getByPlaceholder('输入密钥...').fill('secret')
    await page.getByRole('button', { name: '生成 JWT' }).click()
    await expect(page.getByText(/eyJ[\w-]+\.[\w-]+\.[\w-]+/)).toBeVisible()
  })

  test('password-strength 弱密码判定', async ({ page }) => {
    await openTool(page, 'password-strength')
    await page.getByPlaceholder('输入要分析的密码...').fill('123456')
    await expect(page.getByText('非常弱')).toBeVisible()
  })

  test('hash-verify 上传文件计算哈希', async ({ page }) => {
    await openTool(page, 'hash-verify')
    await uploadFile(page, Buffer.from('hello'), 'hello.txt', 'text/plain')
    await expect(page.getByText('SHA-256', { exact: true })).toBeVisible()
    await expect(page.getByText(/^[a-f0-9]{64}$/)).toBeVisible({ timeout: 15_000 })
  })

  test('json-formatter 格式化 JSON', async ({ page }) => {
    await openTool(page, 'json-formatter')
    await page.locator('textarea').first().fill('{"a":1,"b":[2,3]}')
    await page.getByRole('button', { name: '格式化' }).click()
    const output = await page.locator('textarea').nth(1).inputValue()
    expect(output).toContain('"a": 1')
    expect(output).toContain('\n')
  })

  test('base64 编码文本', async ({ page }) => {
    await openTool(page, 'base64')
    await page.locator('textarea').first().fill('hello')
    await page.locator('button.btn-primary').click()
    await expect(page.locator('textarea').nth(1)).toHaveValue('aGVsbG8=')
  })

  test('regex-tester 实时匹配', async ({ page }) => {
    await openTool(page, 'regex-tester')
    await page.getByPlaceholder('输入正则表达式...').fill('\\d+')
    await page.getByPlaceholder('输入要测试的文本...').fill('abc 123 def 456')
    await expect(page.getByText('2 个匹配')).toBeVisible()
  })

  test('text-diff 展示差异', async ({ page }) => {
    await openTool(page, 'text-diff')
    await page.getByPlaceholder('输入原始文本...').fill('hello\nworld')
    await page.getByPlaceholder('输入新文本...').fill('hello\nworld2')
    await expect(page.locator('[class*="bg-green-500"]').first()).toBeVisible()
  })

  test('csv-viewer 渲染表格', async ({ page }) => {
    await openTool(page, 'csv-viewer')
    await page.getByPlaceholder('输入 CSV 数据或上传文件...').fill('name,age\nAlice,30')
    await expect(page.getByRole('cell', { name: 'Alice' })).toBeVisible()
  })

  test('json-schema-verify 验证通过与失败', async ({ page }) => {
    await openTool(page, 'json-schema-verify')
    await page.getByPlaceholder('输入JSON Schema...').fill(
      '{"type":"object","properties":{"a":{"type":"string"}},"required":["a"]}',
    )
    await page.getByPlaceholder('输入要验证的JSON...').fill('{"a":123}')
    await expect(page.getByText(/验证失败/)).toBeVisible()

    await page.getByPlaceholder('输入要验证的JSON...').fill('{"a":"x"}')
    await expect(page.getByText('验证通过')).toBeVisible()
  })
})
