import { test, expect } from '@playwright/test'
import {
  SAMPLE_SVG,
  blockExternal,
  makeJpeg,
  makePng,
  mockApi,
  openTool,
  uploadFile,
} from '../helpers'

test.describe('图片与文件工具交互', () => {
  test.beforeEach(async ({ page }) => {
    await blockExternal(page)
    await mockApi(page)
  })

  test('image-compress 压缩图片', async ({ page }) => {
    await openTool(page, 'image-compress')
    await uploadFile(page, await makeJpeg(), 'sample.jpg', 'image/jpeg')
    await page.getByRole('button', { name: '开始压缩' }).click()
    await expect(page.getByText('总节省空间')).toBeVisible({ timeout: 15_000 })
  })

  test('image-convert 转换格式', async ({ page }) => {
    await openTool(page, 'image-convert')
    await uploadFile(page, await makePng(), 'sample.png', 'image/png')
    await page.getByRole('button', { name: '开始转换' }).click()
    await expect(page.locator('.text-green-400').first()).toBeVisible({ timeout: 15_000 })
  })

  test('image-convert 粘贴 SVG 按 viewBox 与倍率导出', async ({ page }) => {
    await openTool(page, 'image-convert')
    await page.getByRole('button', { name: /粘贴 SVG 代码导出位图/ }).click()
    await page
      .locator('textarea')
      .fill('<svg viewBox="0 0 24 24"><rect width="24" height="24" fill="#ff0000"/></svg>')
    await page.getByRole('button', { name: '加入列表' }).click()
    await page.getByRole('button', { name: '4x', exact: true }).click()
    await page.getByRole('button', { name: '开始转换' }).click()
    await expect(page.getByText('96×96')).toBeVisible({ timeout: 15_000 })
  })

  test('image-diff 同尺寸全异色差异为 100%', async ({ page }) => {
    await openTool(page, 'image-diff')
    const inputs = page.locator('input[type="file"]')
    await inputs.nth(0).setInputFiles({
      name: 'a.png',
      mimeType: 'image/png',
      buffer: await makePng(40, 40, '#ff0000'),
    })
    await inputs.nth(1).setInputFiles({
      name: 'b.png',
      mimeType: 'image/png',
      buffer: await makePng(40, 40, '#00ff00'),
    })

    await expect(page.getByText('差异比例')).toBeVisible()
    await expect(page.getByText('100.00%')).toBeVisible({ timeout: 15_000 })
  })

  test('image-diff 不同尺寸按较大画布计算差异', async ({ page }) => {
    await openTool(page, 'image-diff')
    const inputs = page.locator('input[type="file"]')
    // A 40×40 全红，B 60×30 全红；画布 60×40。
    // 仅重叠区 40×30 相同，其余 1000 像素有差异（其中 200 像素两边都透明，不计）→ 1000/2400
    await inputs.nth(0).setInputFiles({
      name: 'a.png',
      mimeType: 'image/png',
      buffer: await makePng(40, 40, '#ff0000'),
    })
    await inputs.nth(1).setInputFiles({
      name: 'b.png',
      mimeType: 'image/png',
      buffer: await makePng(60, 30, '#ff0000'),
    })

    await expect(page.getByText('60×40').first()).toBeVisible({ timeout: 15_000 })
    await expect(page.getByText('41.67%')).toBeVisible()
    await expect(page.getByText('1,000')).toBeVisible()
  })

  test('image-resize 调整尺寸', async ({ page }) => {
    await openTool(page, 'image-resize')
    await uploadFile(page, await makePng(), 'sample.png', 'image/png')

    const numberInputs = page.locator('input[type="number"]')
    await numberInputs.nth(0).fill('80')
    await numberInputs.nth(1).fill('40')
    await page.getByRole('button', { name: /调整为 80×40/ }).click()
    await expect(page.getByText('80×40px', { exact: true })).toBeVisible({ timeout: 15_000 })
  })

  test('svg-optimizer 优化 SVG', async ({ page }) => {
    await openTool(page, 'svg-optimizer')
    await page.getByPlaceholder('粘贴 SVG 代码，或点击上传文件...').fill(SAMPLE_SVG)
    await page.getByRole('button', { name: '使用 SVGO 优化' }).click()
    await expect(page.getByText('压缩率', { exact: true })).toBeVisible({ timeout: 15_000 })
  })

  test('svg-to-data-uri 生成 Data URI', async ({ page }) => {
    await openTool(page, 'svg-to-data-uri')
    await page.getByPlaceholder('粘贴 SVG 代码...').fill(SAMPLE_SVG)
    await expect(page.getByPlaceholder('Data URI 将显示在这里...')).toHaveValue(/^data:image\/svg\+xml/)
  })

  test('favicon-gen 生成全套图标', async ({ page }) => {
    await openTool(page, 'favicon-gen')
    await uploadFile(page, await makePng(512, 512), 'logo.png', 'image/png')
    await page.getByRole('button', { name: /生成 \d+ 个尺寸/ }).click()
    await expect(page.getByText(/生成结果 \(\d+ 个文件\)/)).toBeVisible({ timeout: 15_000 })
    await expect(page.getByRole('button', { name: 'ZIP 打包下载' })).toBeVisible()
  })

  test('exif-reader 解析图片基础信息', async ({ page }) => {
    await openTool(page, 'exif-reader')
    await uploadFile(page, await makePng(), 'plain.png', 'image/png')
    await expect(page.getByText('图像信息')).toBeVisible()
    await expect(page.getByText('ImageWidth')).toBeVisible()
  })

  test('color-extractor 提取主色', async ({ page }) => {
    await openTool(page, 'color-extractor')
    await uploadFile(page, await makePng(120, 120, '#ff0000'), 'red.png', 'image/png')
    await expect(page.getByText(/^#[0-9A-F]{6}$/).first()).toBeVisible({ timeout: 15_000 })
  })
})
