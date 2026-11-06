import { describe, it, expect } from 'vitest'
import * as lucide from 'lucide-react'
import { toolRegistry } from '@/registry'
import { getToolComponent } from '@/lib/tool-loader'
import type { ToolMeta } from '@toolbox/types/tool'

const metaModules = import.meta.glob<{ meta: ToolMeta }>('../../src/tools/*/meta.ts', { eager: true })
const metas = Object.entries(metaModules).map(([path, mod]) => ({
  dir: path.match(/tools\/([^/]+)\/meta\.ts$/)?.[1] ?? '',
  meta: mod.meta,
}))

describe('工具注册表', () => {
  it('id 唯一', () => {
    const ids = toolRegistry.map((t) => t.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('registry 恰好覆盖全部 meta.ts，无遗漏无多余', () => {
    expect(toolRegistry.length).toBe(metas.length)
    expect(new Set(toolRegistry.map((t) => t.id))).toEqual(new Set(metas.map((m) => m.dir)))
  })

  it('每个 meta.id 与所在目录名一致', () => {
    const mismatched = metas.filter(({ dir, meta }) => meta.id !== dir)
    expect(mismatched.map((m) => `${m.dir}->${m.meta.id}`)).toEqual([])
  })

  it('registry 的 icon 都是合法 lucide 导出', () => {
    const invalid = toolRegistry.filter((t) => !(t.icon in lucide))
    expect(invalid.map((t) => `${t.id}:${t.icon}`)).toEqual([])
  })

  it('每个 registry 条目都能解析到工具组件', () => {
    const missing = toolRegistry.filter((t) => getToolComponent(t.id) === null)
    expect(missing.map((t) => t.id)).toEqual([])
  })
})
