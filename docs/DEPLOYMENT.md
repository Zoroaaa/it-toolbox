# 部署文档

本文档描述 IT Toolbox 在 Cloudflare Workers 上的部署流程，包含项目形态、构建配置、绑定资源与常见问题处理。

## 1. 部署概述

IT Toolbox 采用 **Cloudflare Workers（静态资源 + Worker API）** 部署，`wrangler.toml` 是部署配置的唯一来源。

| 特性 | 说明 |
|------|------|
| 部署方式 | GitHub 仓库直连 Cloudflare Workers（Workers Builds） |
| 构建触发 | push 到 main 分支自动构建部署，PR 生成预览版本 |
| 构建工具 | Vite 6.0（`pnpm build` → `dist/`） |
| 运行时 | Cloudflare Workers（workerd） |
| 静态资源 | `dist/` 由 `[assets]` 上传，Cloudflare CDN 直出 |
| 后端 | `functions/worker.ts` 入口，`/api/*` 交给 Hono |

### 1.1 产物形态

本项目不是纯静态站点，产物由两部分组成：

```
pnpm build
  └── dist/                  # Vite 产物：index.html + assets + PWA 文件（静态资源）
functions/worker.ts          # Worker 入口：/api/* 走 Hono，其余请求转发给 ASSETS
```

因此 `wrangler.toml` 同时声明 `main` 与 `[assets]`，缺一不可：

- 只配 `[assets]`（assets-only）：`/api/*` 全部 404，IP/DNS/AI 等接口失效。
- 只配 `main`：前端页面无法访问。

路由分发规则：

| 请求 | 处理方 |
|------|--------|
| `/api/*` | `functions/worker.ts` → Hono（`run_worker_first` 保证优先进入 Worker） |
| 命中 `dist/` 中的文件 | 静态资源直接返回 |
| 其余路径（如 `/tool/json-formatter`） | `not_found_handling = "single-page-application"` 回退 `index.html` |

---

## 2. 环境要求

### 2.1 本地环境

| 工具 | 版本要求 | 说明 |
|------|----------|------|
| Node.js | >= 18.0 | 运行时环境 |
| pnpm | >= 8.0 | 包管理器 |
| wrangler | ^4.0.0 | 已是 devDependency，无需全局安装 |

> wrangler 3.x 会在部署时提示 `npm install --save-dev wrangler@4`，且不识别 `[assets]` 的新配置语义。本项目统一使用 v4。

### 2.2 Cloudflare 资源

| 资源 | 说明 | 免费额度 |
|------|------|----------|
| Cloudflare 账号 | 需注册 | 免费 |
| Workers | 静态资源 + API 运行环境 | 100,000 请求/天 |
| KV Namespace | API 结果缓存（绑定名 `CACHE`） | 100,000 次读取/天 |
| Workers AI | AI 推理（绑定名 `AI`） | 10,000 Neurons/天 |

---

## 3. 首次部署流程

### 3.1 第一步：创建 KV 命名空间

```bash
npx wrangler login
npx wrangler kv namespace create CACHE
```

命令会返回 `id`，填入 `wrangler.toml`：

```toml
[[kv_namespaces]]
binding = "CACHE"
id = "你的 Namespace ID"
```

> 未绑定 KV 时，`/api/ip`、`/api/dns`、`/api/whois` 等带缓存的接口会抛错（`Cannot read properties of undefined (reading 'get')`）。

### 3.2 第二步：连接 GitHub 创建 Worker

1. 进入 Cloudflare Dashboard → **Workers & Pages**
2. 点击 **Create** → **Workers** → **Import a repository**（Connect to Git）
3. 授权 GitHub 并选择 `it-toolbox` 仓库
4. 填写构建配置：

| 配置项 | 值 |
|--------|-----|
| Build command | `pnpm build` |
| Deploy command | `npx wrangler deploy` |
| Root directory | `/` |

5. 若构建环境 Node 版本过低，在 **Settings → Build → Environment variables** 增加 `NODE_VERSION=20`
6. 点击 **Deploy**

部署时 wrangler 读取仓库中的 `wrangler.toml`，完成三件事：打包 Worker 入口、上传 `dist/`、创建配置中声明的绑定。

### 3.3 第三步：确认绑定

部署日志中应出现：

```
env.AI        AI
env.ASSETS    Assets
env.ENVIRONMENT ("production")   Environment Variable
```

KV 需按 3.1 填入 ID 后重新部署才会出现 `env.CACHE`。也可以在 Dashboard 的 **Settings → Bindings** 添加，但 `wrangler.toml` 是配置来源，下次部署会以文件为准，建议统一写在文件里。

### 3.4 第四步：配置 Secrets

汇率换算功能需要 API 密钥，只在 Worker 上加密存储，不写入仓库：

```bash
npx wrangler secret put EXCHANGE_API_KEY
```

或在 Dashboard → Worker → **Settings → Variables and Secrets** 添加 `EXCHANGE_API_KEY`（类型选 Secret）。

---

## 4. 日常部署流程

首次配置完成后，日常只需推送代码：

```bash
git add .
git commit -m "feat: add new tool"
git push origin main
```

Cloudflare 自动执行：

1. 拉取最新代码
2. `pnpm install` + `pnpm build`（含 `tsc --noEmit` 类型检查）
3. `npx wrangler deploy`：打包 `functions/worker.ts`、上传 `dist/`、应用 `wrangler.toml` 中的绑定
4. 新版本全量生效，旧版本立即下线（Workers 不支持 Pages 那样的逐版本预览 URL，回滚见第 11 节）

---

## 5. 本地开发

```bash
pnpm install
```

### 5.1 启动开发服务器

```bash
# 终端1：前端（Vite，端口 5173）
pnpm dev

# 终端2：Workers 本地运行时（端口 8788）
pnpm api:dev
```

Vite 已配置 `/api/*` 代理到 `http://127.0.0.1:8788`，前端直接请求同域 `/api` 即可。

| 命令 | 底层工具 | 用途 |
|------|----------|------|
| `pnpm dev` | Vite | 前端开发，热更新快 |
| `pnpm api:dev` | wrangler dev | 启动 Worker（含静态资源与 `/api/*`） |

### 5.2 本地调试 Worker

```bash
pnpm build      # wrangler dev 直接读取 dist/，改前端后需重新构建
pnpm api:dev
# 页面: http://127.0.0.1:8788
# API : http://127.0.0.1:8788/api/health
```

说明：

- `wrangler dev` 会读取 `wrangler.toml` 的 `[assets]`，不再用 `wrangler pages dev dist` 这种 Pages 写法。
- 本地 KV 使用 miniflare 本地存储，写入不会同步到线上命名空间。
- AI 绑定始终访问远端资源，本地调试会消耗真实配额（wrangler 会打印提示）。

---

## 6. 构建与验证

```bash
pnpm typecheck      # 前端类型检查
pnpm typecheck:api  # Worker / Functions 类型检查
pnpm build          # 完整构建，产物在 dist/
pnpm preview        # Vite 本地预览（不含 API）
pnpm smoke          # 线上接口冒烟
```

仅校验部署配置是否正确（不真正上传）：

```bash
npx wrangler deploy --dry-run
```

---

## 7. wrangler.toml 配置说明

```toml
name = "it-toolbox"                          # Worker 名称，需与 Dashboard 中一致
main = "functions/worker.ts"                 # Worker 入口
compatibility_date = "2024-11-01"
compatibility_flags = ["nodejs_compat"]      # Buffer / crypto / stream

[assets]
directory = "./dist"                         # Vite 构建输出目录
binding = "ASSETS"                           # Worker 内 env.ASSETS.fetch()
not_found_handling = "single-page-application"  # SPA 路由回退 index.html
run_worker_first = ["/api/*"]                # /api 先交给 Worker，不被资源匹配拦截

[vars]
ENVIRONMENT = "production"

[ai]
binding = "AI"                               # 无需 ID，部署自动生效

[[kv_namespaces]]
binding = "CACHE"                            # 需填入自己账号的 id
id = "YOUR_KV_NAMESPACE_ID"
```

关键项说明：

> 仓库中的 `[[kv_namespaces]]` 默认是注释状态，填入自己的 `id` 后取消注释再提交。

| 配置 | 作用 | 漏配后果 |
|------|------|----------|
| `main` | 指定 Worker 入口 | 报 `Missing entry-point to Worker script or to assets directory` |
| `[assets].directory` | 指定静态资源目录 | 前端 404 |
| `run_worker_first` | `/api/*` 优先进入 Worker | API 请求可能被 SPA 回退逻辑吞掉 |
| `[ai]` | Workers AI 绑定 | AI 接口返回 500 |
| `[[kv_namespaces]]` | KV 缓存绑定 | 缓存相关接口 500 |

### 7.1 环境变量与密钥

| 名称 | 来源 | 说明 |
|------|------|------|
| `ENVIRONMENT` | `wrangler.toml` 的 `[vars]` | 运行环境标识 |
| `ASSETS` | `[assets].binding` | 静态资源 Fetcher |
| `CACHE` | `[[kv_namespaces]]` | KV 缓存 |
| `AI` | `[ai]` | Workers AI |
| `EXCHANGE_API_KEY` | Secret（CLI / Dashboard） | 汇率 API 密钥 |

---

## 8. 域名配置

### 8.1 默认域名

部署成功后获得 `https://it-toolbox.<你的子域>.workers.dev`。若子域未启用，在 Dashboard → Workers & Pages → **Your subdomain** 中设置一次。

### 8.2 绑定自定义域名

1. Dashboard → Workers & Pages → `it-toolbox` → **Settings → Domains & Routes**
2. **Add** → **Custom domain**
3. 输入域名，按提示创建 DNS 记录（域名需托管在 Cloudflare）

---

## 9. 监控与日志

| 用途 | 位置 |
|------|------|
| 部署记录 | Worker → **Deployments** |
| 实时日志 | Worker → **Logs** → Begin log stream；或 `npx wrangler tail` |
| 指标 | Worker → **Metrics**：请求数、错误率、CPU 时间 |
| AI 用量 | Dashboard → Workers AI |

---

## 10. 常见问题

### 10.1 `Missing entry-point to Worker script or to assets directory`

原因：构建时找不到 `wrangler.toml`（此前被 `.gitignore` 忽略），wrangler 无从得知 `main` / `[assets]`。

处理：确认 `wrangler.toml` 已提交到仓库根目录且包含 `main` 或 `[assets].directory`。

### 10.2 `Wrangler 版本过旧，提示 npm install --save-dev wrangler@4`

原因：构建环境解析到 wrangler 3.x。

处理：`package.json` 中 `wrangler` 已固定为 `^4.0.0`，执行 `pnpm install` 更新 `pnpm-lock.yaml` 后重新提交；确保 Workers Builds 的 Install 命令为 `pnpm install --frozen-lockfile`。

### 10.3 部署成功但 `/api/*` 返回 404

1. 确认 `wrangler.toml` 中 `main = "functions/worker.ts"`
2. 确认 `run_worker_first = ["/api/*"]`
3. 查看部署日志是否出现 `env.ASSETS` 与 `env.AI` 绑定

### 10.4 API 返回 `Cannot read properties of undefined (reading 'get')`

KV 未绑定。按 3.1 创建命名空间并写入 `wrangler.toml`，重新部署。

### 10.5 构建失败（`tsc --noEmit`）

```bash
pnpm typecheck
pnpm typecheck:api
```

按报错修复后重推。CI 中的 `verify` job 与 Workers Builds 使用同一套命令，可先在本地对齐。

### 10.6 部署后静态资源 404

1. 确认 Build command 产出 `dist/`（`pnpm build`）
2. 确认 `[assets].directory = "./dist"`
3. 刷新 CDN 缓存后重试

### 10.7 CORS 错误

前端与 API 同域部署，正常无需跨域配置；若通过其他域名访问 Worker，检查 Hono 中 `app.use('/api/*', cors())` 是否生效。

---

## 11. 回滚

### 11.1 Dashboard 回滚

Worker → **Deployments** → 选择历史版本 → **Rollback**。

### 11.2 Git 回滚

```bash
git revert HEAD
git push origin main   # 触发一次完整构建部署
```

---

## 12. 成本估算

### 12.1 免费额度

| 资源 | 免费额度 | 说明 |
|------|----------|------|
| Workers 请求 | 100,000 次/天 | 静态资源请求不计入 Worker 请求 |
| Workers 构建 | 3,000 分钟/月 | 单次构建约 1-2 分钟 |
| Workers AI | 10,000 Neurons/天 | 约 1000 次 AI 请求/天 |
| KV 读取 | 100,000 次/天 | 缓存命中均为读操作 |
| KV 写入 | 1,000 次/天 | 实际约 100 次/天 |

### 12.2 预估月费

| 日活用户 | 预估月费 |
|----------|----------|
| < 1 万 | 0 元 |
| 1-5 万 | 0-5 美元 |
| > 5 万 | 需评估付费计划 |

---

## 13. 安全建议

- Secrets（`EXCHANGE_API_KEY` 等）只用 `wrangler secret put` 或 Dashboard 配置，不写入仓库
- `wrangler.toml` 中不放账号级密钥；KV ID 属于资源标识，可提交
- 外发请求统一走 `functions/lib/ssrf.ts` 校验，禁止访问内网地址
- 需要访问控制时可叠加 Cloudflare Access / WAF 速率规则

---

## 14. 附录

### 14.1 常用命令速查

```bash
pnpm install                     # 安装依赖
pnpm dev                         # 前端开发
pnpm api:dev                     # Worker 本地运行（端口 8788）
pnpm typecheck && pnpm typecheck:api
pnpm build                       # 构建 dist/
pnpm deploy                      # 本地完整校验 + 构建 + wrangler deploy
npx wrangler deploy --dry-run    # 只校验部署配置
npx wrangler tail                # 线上实时日志
npx wrangler kv namespace create CACHE
npx wrangler secret put EXCHANGE_API_KEY
```

### 14.2 相关链接

| 资源 | 链接 |
|------|------|
| Cloudflare Dashboard | https://dash.cloudflare.com/ |
| Workers 文档 | https://developers.cloudflare.com/workers/ |
| Workers Builds（GitHub 集成） | https://developers.cloudflare.com/workers/ci-cd/builds/ |
| 静态资源（Assets） | https://developers.cloudflare.com/workers/static-assets/ |
| Workers AI | https://developers.cloudflare.com/workers-ai/ |
| Hono 文档 | https://hono.dev/ |

---

## 更新日志

| 版本 | 日期 | 变更内容 |
|------|------|----------|
| 3.0.0 | 2026-11-11 | 迁移至 Cloudflare Workers + GitHub 集成部署：`main` + `[assets]` 配置、wrangler v4、`/api/*` 走 Worker |
| 2.1.0 | 2026-03-24 | 注释 wrangler.toml 绑定配置，添加 Dashboard 绑定操作指南 |
| 1.6.0 | 2026-11-04 | 更新分包与 Service Worker 策略、构建门禁说明 |
| 1.0.0 | 2026-02-20 | 初始部署文档 |
