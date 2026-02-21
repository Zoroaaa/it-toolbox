## 文档2：IT-Toolbox-技术方案-v3.docx

### IT TOOLBOX
全栈开发工具箱
完整技术实施方案·v3.0
TypeScript·React·Hono·Cloudflare Pages Functions
部署方式:GitHub直连 Cloudflare Pages·无 GitHub Actions·无 Wrangler CLI手动操作
2026年2月

#### 1. v3.0版本变更说明
本版本相对v2.0做了三项核心调整，简化部署和架构复杂度。

| 变更项 | 状态 | 原因 |
| :--- | :--- | :--- |
| Durable Objects限流 | 已移除 | 公共服务不做限流;Pages Functions也无法定义DO类, v2方案存在架构错误 |
| GitHub Actions CI/CD | 已移除 | 改用 Cloudflare Pages直连 GitHub,push即自动构建部 暑,无需Actions |
| Wrangler CLI手动部署 | 已移除 | 不再需要本地执行wrangler deploy,wrangler仅用于本地调 试(可选) |
| wrangler.toml定位 | 已明确 | 同时服务生产配置和本地开发,Cloudflare读取此文件自动 绑定KV/R2/AI |
| KV写入用途 | 仅缓存 | 移除限流计数器后,KV只写缓存数据,日写入量极低,免费 配额绰绰有余 |

#### 2. 项目概述
IT Toolbox是面向开发者的在线工具箱，集成150+高频开发工具。基于Cloudflare Pages Functions全栈部署，前后端同域，无需传统服务器，全球边缘节点低延迟响应。

| 特性 | 说明 |
| :--- | :--- |
| 全栈同城 | Pages Functions架构,前后端同域,天然无跨域问题 |
| 边缘优先 | 全球300+Cloudflare节点,无冷启动,API响应<50ms |
| 零服务器 | 完全Serverless,无购买维护服务器成本 |
| 前端计算 | 90%工具浏览器端运算,隐私安全,无网络往返 |
| Git驱动部署 | push main分支自动构建部署,无Actions,无CLI操作 |
| 弹性成本 | 免费计划覆盖日活万级,初期成本为零 |

#### 3. 整体架构
##### 3.1部署架构
```
[用户浏览器] ←→ [Cloudflare Pages (CDN)] ←→ [Cloudflare Pages Functions (边缘计算)]
         ▲                                   ▲
         │ (前端静态资源)                    │ (API: /api/ip, /api/ai, ...)
         ▼                                   ▼
[GitHub仓库] → (推送代码) → [Cloudflare构建服务] (读取 wrangler.toml 自动绑定 KV/R2/AI)
```
`wrangler.toml`提交到仓库后，Cloudflare在构建时自动读取，KV/R2/AI Bindings无需在 Dashboard手动配置，Secrets除外。

##### 3.2 Monorepo目录结构
```
├── package.json (pnpm workspace root)
├── apps
│   └── web (前端应用)
│       ├── src/
│       │   ├── tools/ (工具目录)
│       │   │   ├── json-formatter/
│       │   │   │   ├── meta.ts
│       │   │   │   └── index.tsx
│       │   │   └── ...
│       │   ├── registry.ts (工具注册表)
│       │   ├── routes/ (路由定义)
│       │   ├── components/
│       │   └── store/
│       └── index.html
├── functions/ (Pages Functions)
│   ├── api/[[route]].ts (Hono统一入口)
│   ├── ip.ts
│   ├── dns.ts
│   ├── ai.ts
│   └── ...
├── packages
│   ├── types/ (共享类型)
│   │   └── api.ts (API请求/响应类型)
└── wrangler.toml (Bindings配置(生产+本地开发共用))
```

#### 4. 部署流程(首次配置,只做一次)
以下步骤只在首次创建项目时执行。配置完成后，日常开发只需push代码，Cloudflare全自动完成构建和部署。

##### 4.1 第一步:创建KV命名空间
Dashboard→Workers& Pages→KV→Create namespace

| 用途 | 建议命名 | 操作 |
| :--- | :--- | :--- |
| 生产环境KV | toolbox-cache | 填入wrangler.toml的`id`字段 |
| Preview环境KV | toolbox-cache-preview | 填入wrangler.toml的`preview_id`字段 |

创建后将 Namespace ID填入 `wrangler.toml`并提交，Cloudflare读取后自动绑定。

##### 4.2 第二步:创建R2存储桶
Dashboard→R2→Create bucket，名称填 `toolbox-files`(与`wrangler.toml`中`bucket_name`一致)。

##### 4.3 第三步:连接GitHub创建Pages项目
Dashboard→Workers& Pages→Create→Pages→Connect to Git

| 配置项 | 值 |
| :--- | :--- |
| Framework preset | None |
| Build command | `pnpm build` |
| Build output directory | `dist` |
| Root directory | `/` (默认) |

点击`Save and Deploy`，Cloudflare拉取仓库代码，读取 `wrangler.toml`，自动绑定KV、R2、Al，首次部署完成。

##### 4.4 第四步:配置Secrets
Dashboard→Workers& Pages→it-toolbox→Settings→Environment variables

| 变量名 | 类型 | 说明 |
| :--- | :--- | :--- |
| EXCHANGE_API_KEY | Secret | 汇率API Key,汇率换算工具需要(可选) |

普通环境变量(如ENVIRONMENT)已在`wrangler.toml`的`[vars]`中定义，无需在Dashboard重复配置。Secrets因含敏感信息，不写入代码文件，仅在Dashboard设置。

##### 4.5 之后的日常部署
```bash
#日常开发流程，无需任何 Cloudflare操作
git add .
git commit -m "feat: add base64 tool"
git push origin main

# Cloudflare自动执行:
# 1.拉取最新代码
# 2.读取 wrangler.toml确认 Bindings
# 3.执行 pnpm build(含 tsc类型检查)
# 4.部署到全球CDN节点
# 全程约1-2分钟，期间旧版本继续服务
```

#### 5. `wrangler.toml`配置详解
`wrangler.toml`是本项目配置的唯一来源(source of truth),同时用于生产部署和本地开发。Cloudflare在构建时自动读取，无需Dashboard手动配置 Bindings。

```toml
# wrangler.toml
name = "it-toolbox"
compatibility_date = "2024-11-01"
compatibility_flags = ["nodejs_compat"]
pages_build_output_dir = "dist"

[vars]
ENVIRONMENT = "production" #普通变量直接写在这里

#KV缓存(汇率、DNS、IP查询结果)
[[kv_namespaces]]
binding = "CACHE" #代码中通过 c.env.CACHE访问
id = "你的真实KV-ID" #在Dashboard创建KV后填入
preview_id = "Preview-KV-ID" #PR预览环境用的 KV

# R2文件存储
[[r2_buckets]]
binding = "FILES"
bucket_name = "toolbox-files"

# Workers AI
[ai]
binding = "AI"

# Secrets不写在此文件，在 Dashboard→ Environment variables配置
# EXCHANGE_API_KEY
```

| 常见误区 | 后果 | 正确做法 |
| :--- | :--- | :--- |
| id填占位符 | 部署会失败 | 必须填真实KV Namespace ID |
| 一旦有wrangler.toml | Dashboard普通变量失效 | vars统一在toml中管理,Secrets仍在Dashboard |
| preview_id留空 | PR预览无KV | Preview环境需要单独的 KV ID |

#### 6. Pages Functions API设计
##### 6.1 Hono入口
所有`/api/*`请求由`functions/api/[[route]].ts`统一处理，通过Hono路由分发。

```typescript
// functions/api/[[route]].ts
import { Hono } from "hono"
import { handle } from "hono/cloudflare-pages"

export interface Env {
  CACHE: KVNamespace
  FILES: R2Bucket
  AI: Ai
  ENVIRONMENT: string
  EXCHANGE_API_KEY: string
}
const app = new Hono<{ Bindings: Env }>()

app.route("/api/ip", ipRoute)
app.route("/api/dns", dnsRoute)
app.route("/api/ai", aiRoute)

export const onRequest = handle(app)
```

##### 6.2 API接口清单

| 接口 | 功能 | 实现说明 |
| :--- | :--- | :--- |
| `GET /api/ip` | IP信息查询 | 读取CF请求对象(城市/国家/ASN),KV缓存1h |
| `GET /api/dns` | DNS查询 | 参数:`domain`,`type`。代理1.1.1.1 DoH,KV缓存5min |
| `GET /api/exchange` | 汇率查询 | 参数:`from`,`to`。代理外部汇率API,KV缓存1h |
| `POST /api/ai/explain` | AI代码解释 | Workers Al Ilama-3.1-8b,输入限4000字符 |
| `POST /api/ai/regex` | AI生成正则 | Few-shot提示词,返回`pattern+explanation` |
| `POST /api/ai/sql` | AI生成SQL | 支持传入DDL Schema作为上下文 |
| `GET /api/health` | 健康检查 | 返回运行时间戳和当前环境 |

##### 6.3 KV缓存策略
移除限流后，KV仅用于缓存外部API调用结果，减少重复请求，降低延迟。

| Key格式 | 用途 | TTL | 说明 |
| :--- | :--- | :--- | :--- |
| `cache:ip:{ip}` | IP查询缓存 | 3600s (1小时) | 同一IP短期不变 |
| `cache:dns:{domain}:{type}` | DNS查询缓存 | 300s (5分钟) | DNS记录可能变化 |
| `cache:exchange:{from}:{to}` | 汇率缓存 | 3600s (1小时) | 汇率实时性要求不高 |

`KV日写入估算`：汇率约24次/天 + DNS约50次/天 + IP约30次/天 = 约100次/天，远低于免费计划1000次/天的上限。

#### 7. 存储架构

| 存储 | 用途 | 生命周期 | 说明 |
| :--- | :--- | :--- | :--- |
| localStorage(浏览器) | 收藏列表、使用历史、主题 偏好 | 永久 | 无需账号,本地持久化 |
| Cloudflare KV | 外部API调用缓存 | TTL自动过期 | 减少重复请求,降延迟 |
| Cloudflare R2 | 临时文件处理 | 24h生命周期 | 大文件哈希计算、图片处理中转 |
| Workers AI | LLM推理 | 无状态 | 代码解释、正则/SQL生成 |
| D1(预留) | 用户账号、使用统计 | 永久 | Phase4引入,当前不需要 |

#### 8. 前端核心设计
##### 8.1技术选型

| 技术 | 说明 |
| :--- | :--- |
| React 18 + TypeScript 5 | 前端框架,严格模式,全链路类型安全 |
| TanStack Router v1 | 类型安全路由,自动按路由懒加载工具组件 |
| Zustand v5 + persist | 全局状态(收藏/历史/主题),localStorage持久化 |
| Tailwind CSS 4 | 原子化样式,工业暗色设计系统 |
| Shadcn/ui + Radix UI | 无运行时UI组件,完全可定制 |
| Fuse.js + cmdk | 模糊搜索引擎+Cmd+K搜索面板 |
| Vite 6 | 构建工具,按路由代码分割,首屏体积最小 |

##### 8.2工具注册表
所有工具通过`src/registry.ts`统一注册，编译时确定，运行时存在内存中，无需任何数据库。

```typescript
// src/registry.ts
export const toolRegistry: ToolMeta[] = [
  {
    id: "json-formatter", // 路由路径 /tool/json-formatter
    name: "JSON格式化",
    category: "format",
    tags: ["json", "format", "validate"],
    icon: "Braces",
    requiresApi: false, // 纯前端计算
  },
  // ... 150+条
]

// 应用启动时一次性构建Fuse.js内存搜索索引
export const searchIndex = new Fuse(toolRegistry, {
  keys: ["name", "nameEn", "tags", "description"],
  threshold: 0.35,
})
```

##### 8.3新增工具步骤
新增工具只需5步，无需改动任何基础设施:

| 步骤 | 操作 |
| :--- | :--- |
| 1 | `src/tools/xxx/`下创建文件夹 |
| 2 | 创建`meta.ts`(`id`/`name`/`category`/`tags`/`icon`) |
| 3 | 创建`index.tsx`(工具UI,使用`ToolLayout`容器) |
| 4 | `registry.ts`添加一条注册记录 |
| 5 | `ToolPage.tsx`的`toolComponents`添加懒加载映射 |

#### 9. 性能目标与成本估算
##### 9.1性能目标

| 指标 | 目标 | 实现策略 |
| :--- | :--- | :--- |
| FCP首屏内容绘制 | <1.2s | 静态资源全球CDN缓存 |
| LCP最大内容绘制 | <2.0s | 关键资源预加载 |
| INP交互延迟 | <100ms | 工具运算异步化 |
| Lighthouse总分 | >95 | 全指标优化 |
| 单工具JS体积 | <50KB gzip | 按路由代码分割 |
| Pages Functions响应 | <50ms | 边缘节点+KV缓存命中 |
| Workers Al响应 | <3s | LLM推理限制,流式输出改善体验 |

##### 9.2成本估算(Cloudflare免费计划)

| 资源 | 免费额度 | 实际用量评估 |
| :--- | :--- | :--- |
| Pages构建 | 500次/月 | 每次push触发一次构建,日常开发绰绰有余 |
| Pages Functions请求 | 100,000次/天 | 日活<5万完全免费 |
| Workers Al | 10,000 Neurons/天 | 约1000次AI请求/天 |
| KV读取 | 100,000次/天 | 缓存命中均为读操作,免费 |
| KV写入 | 1,000次/天 | 实际约100次/天,充裕 |
| R2存储 | 10GB+10M操作/月 | 临时文件小,远低于限制 |
| 预估月费(日活<1万) | 0元 | 全部在免费计划内 |

#### 10. 本地开发指南
##### 10.1启动方式

| 命令 | 底层工具 | 用途 | 建议 |
| :--- | :--- | :--- | :--- |
| `pnpm dev` | vite纯前端 | 日常开发工具UI,热更新快 | 推荐日常使用 |
| `pnpm dev:full` | wrangler pages dev | 调试Pages Functions API | 调试IP/DNS/AI接口时用 |
| `pnpm typecheck` | tsc --noEmit | 全局类型检查 | push前执行 |
| `pnpm build` | tsc+vite build | 完整构建(含类型检查) | 验证最终产物 |

##### 10.2本地调试 Pages Functions
`pnpm dev:full`启动全栈时,wrangler会模拟KV和R2,AI接口需要联网调用真实 Workers AI。

```bash
# 前提:全局安装wrangler(一次性操作)
npm install -g wrangler
wrangler login

# 启动全栈本地开发
pnpm dev:full
# 访问 http://localhost:5173
# API: http://localhost:5173/api/ip
```

#### 11. 开发路线图

| 阶段 | 主题 | 主要工具 |
| :--- | :--- | :--- |
| Phase1(第1-2周) | 框架搭建 | 脚手架、路由、布局、工具注册表、Cmd+K搜索、JSON格式化 (示例工具) |
| Phase2(第3-5周) | 高频工具20+ | Base64、URL、JWT、SHA哈希、AES、UUID、时间戳、Cron、 正则、颜色、YAML→JSON、Markdown、文本Diff、IP/DNS查询 |
| Phase3(第6-8周) | 进阶工具 | 图片处理、HTTP测试、cURL转换、RSA密钥、CSS工具、进制 /单位换算 |
| Phase 4(第9-12 周) | AI增强 | AI代码解释/Review、AI生成正则/SQL、汇率换算、PWA离线、 性能优化 |

#### 12. 安全设计

| 方向 | 措施 |
| :--- | :--- |
| 同域架构 | Pages Functions与前端同域,天然无跨域,无CORS配置负担 |
| 前端隐私计算 | 密码、密钥、敏感数据浏览器端处理,不经过任何服务器 |
| 输入校验 | Hono路由层校验必要参数,AI接口限制输入长度(4000字符) |
| Secrets管理 | API Key存Cloudflare Secrets,不写入代码仓库 |
| 公共服务 | 工具箱定位为公共服务,不做访问限流,依赖Cloudflare基础防护 |
| AI Prompt安全 | 系统Prompt固定角色,输出为结构化JSON,降低注入风险 |
| 依赖安全 | pnpm锁定版本,TypeScript严格模式,定期更新依赖 |