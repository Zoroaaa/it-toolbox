import { test, expect } from '@playwright/test'
import { blockExternal, collectPageErrors, getToolIds, mockApi } from './helpers'

const toolIds = getToolIds()

test.describe(`${toolIds.length} 个工具页渲染冒烟`, () => {
  for (const id of toolIds) {
    test(id, async ({ page }) => {
      const pageErrors = collectPageErrors(page)
      await blockExternal(page)
      await mockApi(page)

      await page.goto(`/tool/${id}`)
      const root = page.getByTestId('tool-page')
      await expect(root).toBeVisible()
      await expect(root).toHaveAttribute('data-tool-id', id)

      const heading = root.locator('h1').first()
      await expect(heading).toBeVisible()
      await expect(heading).not.toBeEmpty()

      await expect(page.getByText('工具不存在')).toHaveCount(0)
      await expect(page.getByText('此工具运行出错')).toHaveCount(0)
      await expect(page.getByText('NEW', { exact: true })).toHaveCount(0)

      expect(pageErrors, `工具 ${id} 抛出未捕获异常`).toEqual([])
    })
  }
})
