# 贡献指南

## 新增工具

### 1. 创建目录与元信息

```
src/tools/my-tool/
├── meta.ts
└── index.tsx
```

`meta.ts` 的 `id` 必须与目录名一致：

```ts
import type { ToolMeta } from '@toolbox/types/tool'

export const meta: ToolMeta = {
  id: 'my-tool',
  name: '我的工具',
  nameEn: 'My Tool',
  description: '一句话说明工具能做什么',
  category: 'text',
  tags: ['demo'],
  keywords: ['示例'],
  icon: 'Wrench',
}
```

`index.tsx` 默认导出组件，使用 `ToolLayout` 包裹：

```tsx
import { ToolLayout } from '@/components/tool/ToolLayout'
import { meta } from './meta'

export default function MyTool() {
  return <ToolLayout meta={meta}>{/* ... */}</ToolLayout>
}
```

工具页由 `src/lib/tool-loader.ts` 按目录自动懒加载，不需要手工维护映射。

### 2. 无需手工注册

`src/registry.ts` 在构建期用 `import.meta.glob('@/tools/*/meta.ts', { eager: true })` 聚合全部 `meta.ts`，新增目录后自动出现在列表、搜索与分类中。

唯一需要人工维护的是展示顺序：`src/registry.ts` 顶部的 `DISPLAY_ORDER` 数组。不登记也能用，只是会排到列表末尾。`meta.ts` 是元数据的唯一事实源，不要在别处复制 `name`/`description`。

### 3. 生成图标并校验

```bash
pnpm icons:gen          # 依据各 meta.ts 生成 src/utils/icon-map.ts
pnpm audit:meta --check # 目录 ↔ meta 一致性、icon 与 category 合法性
pnpm test               # 元数据测试会再次校验
```

新增工具使用了未注册的图标名时，`icons:check` 与 CI 会失败。

### 4. 按需导入 core

不要从 barrel 导入（CI 会检查）：

```ts
// 错误
import { yamlToJson } from '@core'

// 正确
import { yamlToJson } from '@core/format-yaml'
```

重依赖模块与对应子路径：

| 依赖 | 子路径 |
|---|---|
| js-yaml | `@core/format-yaml` |
| diff | `@core/text-diff` |
| cron-parser / cronstrue | `@core/text-cron` |
| @faker-js/faker | `@core/generator-fake` |
| ua-parser-js | `@core/network-ua` |

### 5. 状态订阅

必须使用字段级 selector：

```ts
const addRecentTool = useAppStore((s) => s.addRecentTool)
```

`useAppStore()` 整店订阅会被 `scripts/check-store-selectors.mjs` 拦截。

敏感工具（密码、密钥、加解密）不要加入 `HISTORY_ENABLED` 白名单。

### 6. 提交前检查

```bash
pnpm check
```

包括：Web 与 Functions 类型检查、ESLint、Vitest、元数据审计、图标同步、整店订阅检查。

## 提交规范

使用 Conventional Commits：

```
feat(tool): 新增 Cookie 解析工具
fix(api): 修正 RDAP 404 分支
perf(bundle): 拆分 core 重依赖模块
docs(release): 收敛版本序列
```

一个提交只做一件事；重构与行为变更分开提交，便于回滚。

## 新增 API 路由

1. 在 `functions/api/routes/` 新建路由，`Env` 类型从 `functions/types.ts` 导入
2. 在 `functions/app.ts` 的 `createApp()` 中挂载
3. 外发请求必须使用 `functions/lib/ssrf.ts` 的 `validatePublicUrl` / `safeFetch`
4. 补 `tests/api/routes.test.ts` 契约用例（成功、参数缺失、上游失败）

## 文档

- 工具变更更新 `docs/changelog/` 对应版本
- 架构或分包调整更新 `docs/ARCHITECTURE.md`
- 新增/删除工具同步 README 工具数与分类统计
