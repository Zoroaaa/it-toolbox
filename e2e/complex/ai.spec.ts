import { test, expect } from '@playwright/test'
import { blockExternal, mockApi, openTool } from '../helpers'

test.describe('AI 工具交互', () => {
  test.beforeEach(async ({ page }) => {
    await blockExternal(page)
    await mockApi(page)
  })

  test('ai-code-explain 解释代码', async ({ page }) => {
    await openTool(page, 'ai-code-explain')
    await page.getByPlaceholder('粘贴要解释的代码...').fill('const a = 1')
    await page.getByRole('button', { name: '解释代码' }).click()
    await expect(page.getByText('这段代码声明了常量 a')).toBeVisible()
  })

  test('ai-regex 生成正则', async ({ page }) => {
    await openTool(page, 'ai-regex')
    await page.getByPlaceholder('例如：匹配所有以 .com 或 .cn 结尾的域名').fill('匹配数字')
    await page.getByRole('button', { name: 'AI 生成' }).click()
    await expect(page.getByText('/\\d+/g', { exact: true })).toBeVisible()
    await expect(page.getByText(/匹配数字/)).toBeVisible()
  })

  test('ai-sql 生成 SQL', async ({ page }) => {
    await openTool(page, 'ai-sql')
    await page.getByPlaceholder(/查询上个月销售额最高的前 10 个商品/).fill('查询用户')
    await page.getByRole('button', { name: 'AI 生成 SQL' }).click()
    await expect(page.getByText('SELECT * FROM users')).toBeVisible()
  })

  test('ai-code-review 输出评审结果', async ({ page }) => {
    await openTool(page, 'ai-code-review')
    await page.getByPlaceholder('粘贴要进行 Code Review 的代码...').fill('function add(a, b) { return a + b }')
    await page.getByRole('button', { name: '开始 Review' }).click()
    await expect(page.getByText('整体良好')).toBeVisible()
  })

  test('ai-json-schema 生成 Schema', async ({ page }) => {
    await openTool(page, 'ai-json-schema')
    await page.getByPlaceholder('粘贴JSON数据，AI将自动生成对应的JSON Schema...').fill('{"id":1}')
    await page.getByRole('button', { name: 'AI生成Schema' }).click()
    await expect(page.getByText('对象结构')).toBeVisible()
  })

  test('ai-commit-msg 生成提交信息', async ({ page }) => {
    await openTool(page, 'ai-commit-msg')
    await page.getByPlaceholder('粘贴 git diff 输出内容，AI将生成符合 Conventional Commits 规范的提交信息...').fill('+const a = 1')
    await page.getByRole('button', { name: 'AI生成提交信息' }).click()
    await expect(page.getByText('feat: 添加常量')).toBeVisible()
  })

  test('ai-text-extract 结构化提取', async ({ page }) => {
    await openTool(page, 'ai-text-extract')
    await page.getByPlaceholder('粘贴需要提取信息的文本...').fill('张三 13800138000')
    await page.getByRole('button', { name: 'AI 提取' }).click()
    const result = page.locator('pre').first()
    await expect(result).toContainText('张三')
    await expect(result).toContainText('13800138000')
  })

  test('ai-translate 翻译文本', async ({ page }) => {
    await openTool(page, 'ai-translate')
    await page.getByPlaceholder('输入需要翻译的文本...').fill('hello world')
    await page.getByRole('button', { name: 'AI 翻译' }).click()
    await expect(page.getByText('你好，世界')).toBeVisible()
  })

  test('ai-error-explain 解释报错', async ({ page }) => {
    await openTool(page, 'ai-error-explain')
    await page.getByPlaceholder('粘贴完整的错误堆栈或错误信息...').fill('TypeError: x is undefined')
    await page.getByRole('button', { name: 'AI 解释' }).click()
    await expect(page.getByText('变量未定义')).toBeVisible()
  })

  test('ai-naming 生成命名建议', async ({ page }) => {
    await openTool(page, 'ai-naming')
    await page.getByPlaceholder('例如：获取用户列表数据').fill('用户 ID')
    await page.getByRole('button', { name: 'AI 生成命名' }).click()
    await expect(page.getByText('userId')).toBeVisible()
  })

  test('ai-mock-data 生成 Mock 数据', async ({ page }) => {
    await openTool(page, 'ai-mock-data')
    await page.getByPlaceholder('例如：用户信息，包含姓名、邮箱、手机号、年龄').fill('用户列表')
    await page.getByRole('button', { name: 'AI 生成 Mock 数据' }).click()
    await expect(page.getByText('张三')).toBeVisible()
  })

  test('ai-shell-cmd 生成命令并提示风险', async ({ page }) => {
    await openTool(page, 'ai-shell-cmd')
    await page.getByPlaceholder('例如：查找当前目录下所有超过 100MB 的文件').fill('列出当前目录文件')
    await page.getByRole('button', { name: 'AI 生成命令' }).click()
    await expect(page.getByText('ls -la')).toBeVisible()
    await expect(page.getByText('删除操作需谨慎')).toBeVisible()
  })
})
