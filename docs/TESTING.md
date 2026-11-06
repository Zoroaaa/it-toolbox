# 测试指南

## 命令

```bash
pnpm test              # 运行全部用例
pnpm test:watch        # 监听模式
pnpm test:coverage     # 覆盖率（core 行覆盖阈值 85%）
pnpm test:e2e          # Playwright E2E（144 工具页 + 复杂交互）
pnpm test:e2e:install  # 首次安装 Chromium
pnpm check             # typecheck + typecheck:api + lint + test + 元数据/图标/订阅检查
```

## 目录结构

```
tests/
├── setup.ts                 # matchMedia / ResizeObserver / crypto 兜底
├── core/                    # packages/core 纯函数测试
├── api/routes.test.ts       # Hono 路由契约测试（KV / fetch / AI 全 mock）
├── meta/registry.test.ts    # 目录 / meta / registry 三方一致性
├── store/app.test.ts        # 收藏、历史、容量、主题
└── lib/toast.test.ts        # Toast 队列

e2e/
├── helpers.ts               # 工具目录读取、API mock、图片 fixture
├── tools-smoke.spec.ts      # 144 个工具页渲染冒烟
└── complex/
    ├── ai.spec.ts           # 12 个 AI 工具交互
    ├── network.spec.ts      # 8 个网络/后端工具交互
    ├── media.spec.ts        # 8 个图片/文件工具交互
    └── crypto-format.spec.ts # 加密与数据工具交互
```

## 编写约定

### core 纯函数

按模块建文件，使用表驱动减少重复：

```ts
it.each([
  ['abc', '900150983cd24fb0d6963f7d28e17f72'],
  ['', 'd41d8cd98f00b204e9800998ecf8427e'],
])('md5(%s)', (input, expected) => {
  expect(md5(input)).toEqual({ ok: true, value: expected })
})
```

### 后端路由

不要启动 HTTP 服务，直接调用 `createApp()`：

```ts
const app = createApp()
const res = await app.request('/api/dns?domain=a.com', {}, env)
```

- `env` 使用测试内构造的 KV / AI mock
- 外部依赖通过 `vi.stubGlobal('fetch', ...)` 拦截，禁止真实网络
- 断言状态码、`success`、`data` 结构与关键字段

### 元数据

`tests/meta/registry.test.ts` 会遍历 `src/tools/*/meta.ts`，校验：

- 目录名 = `meta.id`，且 registry 覆盖全部 meta（无遗漏无多余）
- `icon` 是合法 lucide 导出
- 每个 registry 条目都能解析到工具组件（`getToolComponent` 非空）

`scripts/audit-meta.mjs` 另会校验 `category` 合法性、`requiresApi` 与 `/api` 调用是否一致。

## 覆盖率

覆盖率只统计 `packages/core`（纯逻辑、可稳定测试）：

| 指标 | 阈值 | 当前 |
|---|---|---|
| 行 | 85% | 91.5% |
| 函数 | 75% | 80.5% |
| 分支 | 70% | 80.8% |

UI 组件与工具页面由 Playwright E2E 覆盖，不在 Vitest 中逐个渲染，避免为 144 个组件维护浏览器 API mock。

## E2E 约定

### 命令

```bash
pnpm test:e2e:install   # 首次安装 Chromium
pnpm test:e2e           # 启动 dev server 并执行全部 E2E
```

`playwright.config.ts` 会自动启动 `pnpm dev --port 5173`；本地已有 dev server 时复用。

### Mock 规则

- `e2e/helpers.ts` 的 `mockApi(page)` 拦截全部 `/api/**`，返回确定性 fixture，禁止 E2E 访问真实网络或消耗 Workers AI 配额。
- `blockExternal(page)` 拦截 Google Fonts，避免外网影响稳定性。
- 图片 fixture 用 `sharp` 运行时生成，不提交二进制文件。
- 工具目录通过 `getToolIds()` 读取 `src/tools`，不解析 TS 别名。

### 断言基线

- 渲染冒烟：`[data-testid="tool-page"]` 可见、`h1` 非空、无"工具不存在"/"此工具运行出错"/NEW 文本、无 `pageerror`。
- 复杂交互：填入最小输入 → 点击主操作 → 断言 mock 结果或确定性计算结果。
- 失败产物：`trace` 与截图仅在失败时保留，见 `test-results/`。

## CI

`.github/workflows/ci.yml` 在 push / PR 到 main 时执行：

```
pnpm install --frozen-lockfile
pnpm typecheck
pnpm typecheck:api
pnpm lint
pnpm test
pnpm build

# e2e job（并行执行）
pnpm exec playwright install --with-deps chromium
pnpm test:e2e
```

构建失败或测试失败即阻断合并。`pnpm check` 额外跑元数据、图标映射与整店订阅检查，建议提交前本地执行。
