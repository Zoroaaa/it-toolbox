# 测试指南

## 命令

```bash
pnpm test              # 运行全部用例
pnpm test:watch        # 监听模式
pnpm test:coverage     # 覆盖率（core 行覆盖阈值 85%）
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

- 目录名 = `meta.id` = `registry.ts` 中的 id
- `icon` 是合法 lucide 导出
- 新增工具未同步 registry 时测试直接失败

## 覆盖率

覆盖率只统计 `packages/core`（纯逻辑、可稳定测试）：

| 指标 | 阈值 | 当前 |
|---|---|---|
| 行 | 85% | 91.5% |
| 函数 | 75% | 80.5% |
| 分支 | 70% | 80.8% |

UI 组件与工具页面不做逐个渲染冒烟，避免为 144 个组件维护 mock；关键交互通过手工验收清单覆盖。

## CI

`.github/workflows/ci.yml` 在 push / PR 到 main 时执行：

```
pnpm install --frozen-lockfile
pnpm typecheck
pnpm typecheck:api
pnpm lint
pnpm test
pnpm build
```

构建失败或测试失败即阻断合并。`pnpm check` 额外跑元数据、图标映射与整店订阅检查，建议提交前本地执行。
