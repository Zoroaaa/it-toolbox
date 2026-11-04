import { describe, it, expect } from 'vitest'
import * as lucide from 'lucide-react'
import { toolRegistry } from '@/registry'
import type { ToolMeta } from '@toolbox/types/tool'

const metaModules = import.meta.glob<{ meta: ToolMeta }>('../../src/tools/*/meta.ts', { eager: true })
const metas = Object.entries(metaModules).map(([path, mod]) => ({
  dir: path.match(/tools\/([^/]+)\/meta\.ts$/)?.[1] ?? '',
  meta: mod.meta,
}))

describe('工具注册表一致性', () => {
  it('registry 中的 id 唯一', () => {
    const ids = toolRegistry.map((t) => t.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('每个 meta.ts 都在 registry 中注册，且 id 与目录名一致', () => {
    const registryIds = new Set(toolRegistry.map((t) => t.id))
    const missing = metas.filter(({ dir, meta }) => !registryIds.has(dir) || meta.id !== dir)
    expect(missing.map((m) => m.dir)).toEqual([])
  })

  it('每条 registry 都有对应目录', () => {
    const dirs = new Set(metas.map((m) => m.dir))
    const orphans = toolRegistry.filter((t) => !dirs.has(t.id))
    expect(orphans.map((t) => t.id)).toEqual([])
  })

  it('registry 的 icon 都是合法 lucide 导出', () => {
    const invalid = toolRegistry.filter((t) => !(t.icon in lucide))
    expect(invalid.map((t) => `${t.id}:${t.icon}`)).toEqual([])
  })

  it('meta 的 icon 都是合法 lucide 导出', () => {
    const invalid = metas.filter(({ meta }) => !(meta.icon in lucide))
    expect(invalid.map(({ dir, meta }) => `${dir}:${meta.icon}`)).toEqual([])
  })
})
