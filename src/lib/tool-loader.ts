import { lazy, type LazyExoticComponent } from 'react'

type ToolModule = { default: () => JSX.Element }
export type ToolComponent = LazyExoticComponent<() => JSX.Element>

const toolModules = import.meta.glob<ToolModule>('@/tools/*/index.tsx')

const toolPath = (id: string) => `/src/tools/${id}/index.tsx`

export const availableToolIds = Object.keys(toolModules)
  .map((path) => path.match(/\/tools\/([^/]+)\/index\.tsx$/)?.[1] ?? '')
  .filter(Boolean)

const componentCache = new Map<string, ToolComponent>()
const inflight = new Set<string>()

export function getToolComponent(toolId: string): ToolComponent | null {
  const cached = componentCache.get(toolId)
  if (cached) return cached

  const loader = toolModules[toolPath(toolId)]
  if (!loader) return null

  const component = lazy(loader)
  componentCache.set(toolId, component)
  return component
}

/** 预加载单个工具 chunk；重复调用与并发调用都会去重 */
export function preloadTool(toolId: string): void {
  if (inflight.has(toolId)) return
  const loader = toolModules[toolPath(toolId)]
  if (!loader) return

  inflight.add(toolId)
  loader()
    .catch(() => {
      // 预加载失败不阻塞交互，首次访问时会重新请求
    })
    .finally(() => inflight.delete(toolId))
}

/** 按需预加载前 N 个工具，避免 hover 分类时一次性拉取整类 */
export function preloadTools(toolIds: string[], limit = 3): void {
  toolIds.slice(0, limit).forEach(preloadTool)
}
