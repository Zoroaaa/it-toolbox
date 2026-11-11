# 系统架构设计文档

本文档详细描述 IT Toolbox 的系统架构设计，包括模块划分、组件关系、技术选型及架构图。

## 1. 项目概述

IT Toolbox 是面向开发者的在线工具箱，集成 140+ 款高频开发工具。基于 Cloudflare Workers（静态资源 + Worker API）全栈部署，前后端同域，无需传统服务器，全球边缘节点低延迟响应。

### 核心特性

| 特性 | 说明 |
|------|------|
| 全栈同域 | Workers 架构，静态资源与 API 同一域名，天然无跨域问题 |
| 边缘优先 | 全球 300+ Cloudflare 节点，无冷启动，API 响应 <50ms |
| 零服务器 | 完全 Serverless，无购买维护服务器成本 |
| 前端计算 | 90% 工具浏览器端运算，隐私安全，无网络往返 |
| Git 驱动部署 | push main 分支自动构建部署，部署链路不经 Actions、无 CLI 操作 |
| 弹性成本 | 免费计划覆盖日活万级，初期成本为零 |

---

## 2. 整体架构

### 2.1 部署架构图

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              用户浏览器                                       │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │  React 应用 (SPA)                                                    │    │
│  │  • TanStack Router (路由)                                            │    │
│  │  • Zustand (状态管理)                                                 │    │
│  │  • Tailwind CSS (样式)                                               │    │
│  │  • 工具组件 (按路由懒加载)                                             │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                      Cloudflare Workers                                      │
│  ┌─────────────────────────────┐  ┌─────────────────────────────────────┐  │
│  │  静态资源 (dist/)            │  │  Worker API (边缘计算)               │  │
│  │  • index.html               │  │  • /api/ip      IP 查询              │  │
│  │  • assets/*.js              │  │  • /api/dns     DNS 查询             │  │
│  │  • assets/*.css             │  │  • /api/ai/*    AI 增强              │  │
│  └─────────────────────────────┘  └─────────────────────────────────────┘  │
│                                      │                                        │
│                                      ▼                                        │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │  Cloudflare Bindings                                                 │    │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────────────────┐ │    │
│  │  │ KV       │  │ R2       │  │ Workers  │  │ Environment          │ │    │
│  │  │ (缓存)   │  │ (文件)   │  │ AI       │  │ Variables            │ │    │
│  │  └──────────┘  └──────────┘  └──────────┘  └──────────────────────┘ │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                          GitHub 仓库                                         │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │  it-toolbox/                                                         │    │
│  │  ├── src/           (前端源码)                                        │    │
│  │  ├── functions/     (Worker 入口 + API)                              │    │
│  │  ├── packages/      (共享包)                                          │    │
│  │  └── wrangler.toml  (配置文件)                                        │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                      │                                        │
│                    push → 自动构建 → 自动部署                                  │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 2.2 请求流程

```
用户访问 → Cloudflare CDN (边缘节点)
    │
    ├─ 静态资源请求 → 返回缓存/构建产物
    │
    └─ API 请求 (/api/*)
         │
         ├─ /api/health → 直接响应
         │
         ├─ /api/ip → 读取 CF Headers / ip-api.com → KV 缓存检查 → 返回 IP 信息
         │
         ├─ /api/dns → 参数校验 → KV 缓存检查 → 代理 1.1.1.1 DoH → 缓存结果 → 返回
         │
         └─ /api/ai/* → 参数校验 → 调用 Workers AI → 返回结果
```

---

## 3. 目录结构

```
it-toolbox/
├── src/                          # 前端源码
│   ├── components/               # React 组件
│   │   ├── layout/               # 布局组件
│   │   │   ├── Header.tsx        # 顶部导航栏 (含 Cmd+K 搜索)
│   │   │   └── Sidebar.tsx       # 侧边栏分类导航
│   │   ├── tool/                 # 工具相关组件
│   │   │   └── ToolLayout.tsx    # 工具通用容器
│   │   └── ui/                   # UI 基础组件
│   │       ├── ThemeToggle.tsx   # 主题切换
│   │       └── ToolCard.tsx      # 工具卡片
│   ├── hooks/                    # 自定义 Hooks
│   │   └── useClipboard.ts       # 剪贴板操作
│   ├── pages/                    # 页面组件
│   │   ├── HomePage.tsx          # 首页
│   │   ├── CategoryPage.tsx      # 分类页
│   │   ├── ToolPage.tsx          # 工具页
│   │   ├── FavoritesPage.tsx     # 收藏页
│   │   └── HistoryPage.tsx       # 历史页
│   ├── store/                    # 状态管理
│   │   └── app.ts                # Zustand Store
│   ├── tools/                    # 工具目录 (每个工具一个文件夹)
│   │   ├── json-formatter/
│   │   │   ├── meta.ts           # 工具元信息
│   │   │   └── index.tsx         # 工具 UI 组件
│   │   ├── base64/
│   │   ├── hash-calculator/
│   │   └── ...                   # 其他工具
│   ├── utils/                    # 工具函数
│   │   └── icons.ts              # 图标映射
│   ├── index.css                 # 全局样式
│   ├── main.tsx                  # 应用入口
│   ├── registry.ts               # 工具注册表 (核心)
│   └── routeTree.tsx             # 路由配置
│
├── functions/                    # Cloudflare Workers 后端
│   ├── worker.ts                 # Worker 入口 (createApp + ASSETS 分发)
│   └── api/routes/               # API 路由模块
│       ├── ip.ts                 # IP 查询接口
│       ├── dns.ts                # DNS 查询接口
│       └── ai.ts                 # AI 增强接口
│
├── packages/                     # 共享包
│   ├── core/                     # 核心计算逻辑
│   │   ├── index.ts              # 导出入口
│   │   ├── common.ts             # 通用工具函数
│   │   ├── encoding.ts           # 编解码逻辑
│   │   ├── crypto.ts             # 加密逻辑
│   │   ├── format.ts             # 格式化逻辑
│   │   ├── text.ts               # 文本处理逻辑
│   │   ├── color.ts              # 颜色处理逻辑
│   │   ├── datetime.ts           # 时间日期逻辑
│   │   ├── generator.ts          # 生成器逻辑
│   │   ├── network.ts            # 网络相关逻辑
│   │   └── number.ts             # 数字处理逻辑
│   └── types/                    # 类型定义
│       ├── api.ts                # API 类型
│       └── tool.ts               # 工具类型
│
├── docs/                         # 文档目录
│   ├── API.md
│   ├── ARCHITECTURE.md
│   ├── DEPLOYMENT.md
│   ├── QUICKSTART.md
│   └── changelog/
│
├── wrangler.toml                 # Cloudflare 配置
├── vite.config.ts                # Vite 构建配置
├── tailwind.config.js            # Tailwind 配置
├── tsconfig.json                 # TypeScript 配置
└── package.json                  # 项目配置
```

---

## 4. 技术选型

### 4.1 前端技术栈

| 技术 | 版本 | 用途 | 选型理由 |
|------|------|------|----------|
| React | 18.3 | UI 框架 | 生态成熟，组件化开发 |
| TypeScript | 5.5 | 类型系统 | 全链路类型安全 |
| TanStack Router | 1.58 | 路由管理 | 类型安全，自动按路由懒加载 |
| Zustand | 5.0 | 状态管理 | 轻量，支持持久化 |
| Tailwind CSS | 3.4 | 样式方案 | 原子化 CSS，快速开发 |
| Vite | 6.0 | 构建工具 | 快速 HMR，优化产物 |
| Fuse.js | 7.0 | 模糊搜索 | 轻量级客户端搜索 |
| cmdk | 1.0 | 命令面板 | Cmd+K 搜索体验 |
| marked | 15.0 | Markdown 渲染 | 快速，支持 GFM |
| highlight.js | 11.10 | 代码高亮 | 多语言支持 |
| dayjs | 1.11 | 日期处理 | 轻量，API 友好 |
| chroma-js | 2.6 | 颜色处理 | 全面的颜色空间转换 |
| bcryptjs | 2.4 | Bcrypt 哈希 | 密码哈希计算 |
| jose | 5.9 | JWT 处理 | JWT 生成与验证 |
| sql-formatter | 15.0 | SQL 格式化 | 多方言支持 |
| papaparse | 5.4 | CSV 解析 | 高性能 CSV 处理 |
| cron-parser | 4.9 | Cron 解析 | Cron 表达式处理 |
| nanoid | 5.0 | ID 生成 | 轻量级唯一 ID |
| @faker-js/faker | 9.0 | 假数据生成 | 多语言假数据 |
| ua-parser-js | 1.0 | UA 解析 | User-Agent 解析 |
| ulid | 2.3 | ULID 生成 | 时间有序 ID |
| qrcode | 1.5 | 二维码生成 | QR Code 生成 |

### 4.2 后端技术栈

| 技术 | 版本 | 用途 | 选型理由 |
|------|------|------|----------|
| Hono | 4.6 | Web 框架 | 轻量，边缘运行时友好 |
| Cloudflare KV | - | 缓存存储 | 边缘分布式，低延迟 |
| Cloudflare R2 | - | 文件存储 | 零出口流量费 |
| Workers AI | - | AI 推理 | 边缘运行，无需外部 API |

### 4.3 开发工具

| 工具 | 用途 |
|------|------|
| pnpm | 包管理器 |
| wrangler | Cloudflare CLI |
| ESLint | 代码检查 |
| TypeScript | 类型检查 |

### 4.4 平台能力边界

选型的硬约束来自 Cloudflare Workers 的能力范围。下表是决定「哪些工具能做、怎么做」的依据：

| 能力 / Binding | 支持 | 本项目 | 说明 |
| :--- | :---: | :---: | :--- |
| 浏览器端 Web Crypto API | ✅ | 已用 | SHA/AES-GCM/RSA-OAEP/ECDSA/HMAC，所有加密工具的核心，无需后端 |
| Workers KV | ✅ | 已绑定 `CACHE` | 外部 API 结果缓存，TTL 自动过期，日写入量低于免费配额 |
| Workers AI | ✅ | 已绑定 `AI` | 代码解释、正则/SQL/Shell 生成 |
| fetch() 外部 HTTP | ✅ | 已用 | 汇率、RDAP、证书查询；单个请求内最多 6 个并发连接 |
| `nodejs_compat` | ✅ | 已开启 | Buffer、crypto、stream，用于 UA 与 MIME 解析 |
| Cloudflare D1 | ✅ | 未用 | 只在做账号体系时才需要；当前所有用户态数据存 localStorage |
| Cloudflare R2 | ✅ | 未用 | 图片处理已由前端 Canvas 完成，没有落盘中转需求 |
| Cloudflare Images | ✅ | 未用 | 需绑定 R2 作源，且会引入付费与外部依赖 |
| Analytics Engine | ✅ | 未用 | 可作为后续用量统计的落点，目前无埋点 |
| Service Bindings | ✅ | 未用 | 单 Worker 足够，没有拆分子服务的必要 |
| WebSocket（服务端） | ✅ | 未用 | AI 接口当前为一次性返回，未做流式 |
| Cron Triggers | ✅ | 未用 | Workers 支持定时任务，但汇率缓存采用请求触发的懒刷新，无需常驻调度 |
| Durable Objects（自定义类） | ✅ | 未用 | Workers 可定义 DO 类，限流仍按上层速率规则实现，代码内不维护计数器 |
| Cloudflare Queues | ✅ | 未用 | 可作为 Queue Consumer，当前没有异步任务 |
| TCP Socket | ✅ | 未用 | `connect()` 可直连数据库，但项目不引入外部数据库 |

由此得出两条架构结论：约 90% 的工具是纯前端计算（纯 JS 计算 ~60%、Web Crypto ~15%、Canvas ~5%），不经过后端；后端只承担 IP/DNS/汇率/WHOIS/证书/AI 这六类必须有出网能力的场景。凡是需要常驻状态或定时调度的设计，在选型阶段就直接排除。

---

## 5. 核心模块设计

### 5.1 工具注册表 (Registry)

工具清单的唯一事实源是各工具目录下的 `meta.ts`。`src/registry.ts` 只做构建期聚合与展示排序，不再手写元数据：

```typescript
// src/registry.ts
import Fuse from 'fuse.js'
import type { ToolMeta } from '@toolbox/types/tool'

// 仅维护展示顺序；未登记的 id 按字典序排在末尾
const DISPLAY_ORDER: string[] = [
  'json-formatter', 'markdown-preview', 'base64', /* ... */
]

const metaModules = import.meta.glob<{ meta: ToolMeta }>('@/tools/*/meta.ts', { eager: true })

export const toolRegistry: ToolMeta[] = Object.values(metaModules)
  .map((mod) => mod.meta)
  .sort(/* DISPLAY_ORDER 序 + id 字典序 */)

// 模糊搜索索引
export const searchIndex = new Fuse(toolRegistry, {
  keys: [
    { name: 'name', weight: 0.4 },
    { name: 'nameEn', weight: 0.3 },
    { name: 'tags', weight: 0.2 },
    { name: 'description', weight: 0.05 },
    { name: 'keywords', weight: 0.05 },
  ],
  threshold: 0.35,
})

// 搜索工具
export function searchTools(query: string): ToolMeta[]

// 按分类获取工具
export function getToolsByCategory(category: string): ToolMeta[]

// 按 ID 获取工具
export function getToolById(id: string): ToolMeta | undefined
```

### 5.2 工具分类

```typescript
// packages/types/src/tool.ts
export type Category =
  | 'format'     // 格式化
  | 'encoding'   // 编码解码
  | 'crypto'     // 加密安全
  | 'network'    // 网络 HTTP
  | 'text'       // 文本处理
  | 'color'      // 颜色设计
  | 'generator'  // 数据生成
  | 'converter'  // 单位转换
  | 'datetime'   // 时间日期
  | 'ai'         // AI 增强

export const CATEGORY_LABELS: Record<Category, string> = {
  encoding:  '编码解码',
  crypto:    '加密安全',
  format:    '格式化',
  text:      '文本处理',
  color:     '颜色设计',
  network:   '网络HTTP',
  datetime:  '时间日期',
  generator: '生成器',
  converter: '单位换算',
  ai:        'AI增强',
}
```

### 5.3 状态管理

使用 Zustand 管理全局状态，支持 localStorage 持久化。

```typescript
// src/store/app.ts
interface AppStore {
  // 收藏功能
  favorites: string[]
  toggleFavorite: (id: string) => void
  isFavorited: (id: string) => boolean

  // 使用历史
  history: Record<string, HistoryRecord[]>
  addHistory: (toolId: string, input: string) => void
  getHistory: (toolId: string) => HistoryRecord[]

  // 最近使用
  recentTools: string[]
  addRecentTool: (id: string) => void

  // 主题
  themeMode: ThemeMode
  resolvedTheme: 'dark' | 'light'
  setThemeMode: (mode: ThemeMode) => void
  applyTheme: () => void
}

type ThemeMode = 'dark' | 'light' | 'system'
```

### 5.4 路由设计

使用 TanStack Router 实现类型安全路由，支持按路由懒加载。

```typescript
// 路由结构
/                    → 首页 (工具网格)
/category/:category  → 分类页
/tool/:id            → 工具页 (懒加载组件)
/favorites           → 收藏页
/history             → 历史页
```

### 5.5 核心计算模块

`packages/core` 包含所有纯计算逻辑，前后端共用。

```typescript
// packages/core/src/index.ts

// 通用工具
export * from './common'

// 编解码
export * from './encoding'

// 加密
export * from './crypto'

// 格式化
export * from './format'

// 文本处理
export * from './text'

// 颜色处理
export * from './color'

// 网络相关
export * from './network'

// 时间日期
export * from './datetime'

// 生成器
export * from './generator'

// 数字处理
export * from './number'
```

---

## 6. API 架构

### 6.1 Hono 路由入口

```typescript
// functions/app.ts —— 路由装配
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { ipRoute } from './api/routes/ip'
import { dnsRoute } from './api/routes/dns'
import { aiRoute } from './api/routes/ai'

export function createApp() {
  const app = new Hono<{ Bindings: Env }>()

  app.use('/api/*', cors())
  app.get('/api/health', (c) => c.json({ ok: true, ts: Date.now() }))
  app.route('/api/ip', ipRoute)
  app.route('/api/dns', dnsRoute)
  app.route('/api/ai', aiRoute)

  return app
}

// functions/worker.ts —— Worker 入口，/api/* 交给 Hono，其余读取 ASSETS
const app = createApp()

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext) {
    const { pathname } = new URL(request.url)
    if (pathname === '/api' || pathname.startsWith('/api/')) {
      return app.fetch(request, env, ctx)
    }
    return env.ASSETS.fetch(request)
  },
}
```

### 6.2 API 接口清单

| 接口 | 方法 | 功能 | 实现方式 |
|------|------|------|----------|
| `/api/health` | GET | 健康检查 | 直接响应 |
| `/api/ip` | GET | IP 信息查询 | CF Headers + ip-api.com + KV 缓存 |
| `/api/dns` | GET | DNS 查询 | 代理 1.1.1.1 DoH + KV 缓存 |
| `/api/ai/explain` | POST | AI 代码解释 | Workers AI |
| `/api/ai/regex` | POST | AI 生成正则 | Workers AI |
| `/api/ai/sql` | POST | AI 生成 SQL | Workers AI |

---

## 7. 存储架构

| 存储 | 用途 | 生命周期 | 说明 |
|------|------|----------|------|
| localStorage | 收藏、历史、主题偏好 | 永久 | 无需账号，本地持久化 |
| Cloudflare KV | 外部 API 调用缓存 | TTL 自动过期 | 减少重复请求 |
| Cloudflare R2 | 临时文件处理 | 24h 生命周期 | 大文件处理中转 |
| Workers AI | LLM 推理 | 无状态 | 代码解释、正则/SQL 生成 |

### KV 缓存策略

所有需要外部请求的路由统一走 KV 缓存，键名由「业务前缀 + 规范化后的查询参数」构成（URL 先标准化、域名先去协议与路径并转小写），不使用哈希，便于在 Dashboard 直接检索。

| Key 格式 | 归属路由 | 缓存内容 | TTL |
|----------|----------|----------|-----|
| `cache:ip:{ip}` | `ip.ts` | IP 归属地与 ASN | 3600s |
| `cache:dns:{domain}:{type}` | `dns.ts` | DNS 解析结果 | 300s |
| `cache:headers:{url}` | `headers-check.ts` | HTTP 响应头 | 3600s |
| `cache:ssl:{domain}` | `ssl-check.ts` | 证书链与有效期 | 3600s |
| `cache:whois:{target}` | `whois.ts` | RDAP/WHOIS 记录 | 3600s |
| `cache:exchange:rates:{base}` | `exchange.ts` | 基准货币汇率列表 | 3600s |
| `cache:exchange:{from}:{to}` | `exchange.ts` | 单位汇率换算结果 | 3600s |
| `cache:rdap:bootstrap` | `whois.ts` | IANA RDAP 引导表（全后缀共用） | 86400s |

汇率换算的键里**不含金额**：缓存的是单价换算系数，读取后按实际金额乘算，因此任意金额共享同一条缓存。这是汇率键这样设计的原因，改动缓存策略时不要退化成按金额建键。

缓存行为约定：

- **失败不写缓存**：上游 API 报错时保留旧值，避免把瞬时错误固化一小时。
- **KV 异常降级**：KV 读写失败时直接透传上游请求，工具功能不中断。
- **DNS 例外**：解析结果变化快，TTL 取 300s；其余外部查询统一 1 小时。
- **RDAP 引导表单独长缓存**：引导表按 IANA 发布节奏更新，86400s 足够且能省掉每次查询的额外往返。

KV 命名空间绑定名为 `CACHE`，本地与生产绑定步骤见 [DEPLOYMENT.md](./DEPLOYMENT.md#4-绑定资源操作步骤详解)。

---

## 8. 性能优化

### 8.1 构建优化

```typescript
// vite.config.ts
export default defineConfig({
  build: {
    target: 'esnext',
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom'],
          'router': ['@tanstack/react-router'],
          'crypto-vendor': ['bcryptjs', 'jose'],
          'text-vendor': ['diff', 'fuse.js'],
          'data-vendor': ['papaparse', 'js-yaml', 'sql-formatter'],
        }
      }
    }
  }
})
```

### 8.2 性能目标

| 指标 | 目标 | 实现策略 |
|------|------|----------|
| FCP | <1.2s | 静态资源 CDN 缓存 |
| LCP | <2.0s | 关键资源预加载 |
| INP | <100ms | 工具运算异步化 |
| 单工具 JS | <50KB gzip | 按路由代码分割 |
| API 响应 | <50ms | 边缘节点 + KV 缓存 |

---

## 9. 安全设计

| 方向 | 措施 |
|------|------|
| 同域架构 | Worker 与静态资源同域，天然无跨域 |
| 前端隐私计算 | 密码、密钥、敏感数据浏览器端处理 |
| 输入校验 | Hono 路由层校验参数，AI 接口限制输入长度 |
| Secrets 管理 | API Key 存 Cloudflare Secrets，不写入代码仓库 |
| AI Prompt 安全 | 系统 Prompt 固定角色，输出结构化 JSON |

---

## 10. 扩展设计

### 10.1 新增工具流程

1. 在 `src/tools/<id>/` 下创建目录（目录名即工具 id）
2. 创建 `meta.ts`（工具元信息，唯一事实源）
3. 创建 `index.tsx`（工具 UI 组件，默认导出并用 `ToolLayout` 包裹）
4. 如需纯计算逻辑，添加到 `packages/core/src/`，按 `@core/<module>` 子路径导入
5. 如需后端 API，在 `functions/api/routes/` 中添加路由
6. 运行 `pnpm icons:gen && pnpm check`

`src/registry.ts` 不再需要手工登记：它在构建期用 `import.meta.glob('@/tools/*/meta.ts', { eager: true })` 聚合全部 meta，未列入展示顺序的工具自动排到末尾。`src/lib/tool-loader.ts` 同样基于 glob 自动生成懒加载表，无需改路由或映射。

### 10.2 工具模板

```typescript
// src/tools/xxx/meta.ts
import type { ToolMeta } from '@toolbox/types/tool'

export const meta: ToolMeta = {
  id: 'xxx',
  name: '工具名称',
  nameEn: 'Tool Name',
  description: '工具描述',
  category: 'format',
  tags: ['tag1', 'tag2'],
  icon: 'Tool',
}
```

```typescript
// src/tools/xxx/index.tsx
import { ToolLayout } from '@/components/tool/ToolLayout'
import { meta } from './meta'

export default function XxxTool() {
  return (
    <ToolLayout meta={meta}>
      {/* 工具内容 */}
    </ToolLayout>
  )
}
```

---

## 11. 依赖关系图

```
┌─────────────────────────────────────────────────────────────────┐
│                         前端应用 (src/)                          │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐ │
│  │   pages/    │  │ components/ │  │        tools/           │ │
│  │             │  │             │  │  ┌───────────────────┐  │ │
│  │ HomePage    │←─│ Header      │  │  │ json-formatter/   │  │ │
│  │ ToolPage    │←─│ Sidebar     │←─│  │   meta.ts         │  │ │
│  │ CategoryPage│  │ ToolLayout  │  │  │   index.tsx       │  │ │
│  └──────┬──────┘  └──────┬──────┘  │  └───────────────────┘  │ │
│         │                │         └───────────┬─────────────┘ │
│         │                │                     │               │
│         ▼                ▼                     ▼               │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                    registry.ts                           │  │
│  │  • toolRegistry (工具注册表)                              │  │
│  │  • searchIndex (Fuse.js 搜索索引)                        │  │
│  └──────────────────────────────────────────────────────────┘  │
│         │                                                       │
│         ▼                                                       │
│  ┌─────────────┐  ┌─────────────┐                              │
│  │   store/    │  │   hooks/    │                              │
│  │ app.ts      │  │ useClipboard│                              │
│  │ (Zustand)   │  │             │                              │
│  └─────────────┘  └─────────────┘                              │
└─────────────────────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────────────┐
│                      共享包 (packages/)                          │
│  ┌─────────────────────────┐  ┌─────────────────────────────┐  │
│  │        core/            │  │         types/              │  │
│  │  • encoding.ts          │  │  • ToolMeta 类型            │  │
│  │  • crypto.ts            │  │  • Category 类型            │  │
│  │  • format.ts            │  │  • ApiResponse 类型         │  │
│  │  • text.ts              │  │  • IpInfo 类型              │  │
│  │  • color.ts             │  │  • DnsRecord 类型           │  │
│  │  • datetime.ts          │  │                             │  │
│  │  • generator.ts         │  │                             │  │
│  └─────────────────────────┘  └─────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────────────┐
│                   后端 API (functions/)                           │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                    worker.ts (Worker 入口)                │  │
│  └──────────────────────────────────────────────────────────┘  │
│         │                                                       │
│         ├────────────┬────────────┬────────────┐               │
│         ▼            ▼            ▼            ▼               │
│  ┌───────────┐ ┌───────────┐ ┌───────────┐ ┌───────────┐       │
│  │ routes/   │ │ routes/   │ │ routes/   │ │           │       │
│  │ ip.ts     │ │ dns.ts    │ │ ai.ts     │ │           │       │
│  └───────────┘ └───────────┘ └───────────┘ └───────────┘       │
└─────────────────────────────────────────────────────────────────┘
```

---

## 12. 架构决策记录

记录已定案、且有明确「为什么」的决策。后续方案不与这几条冲突着做。

### 12.1 放弃 Durable Objects 限流

公共服务不做限流。迁移到 Workers 后 DO 已可用，但「不维护服务端计数器」是既定取舍，限流仍交给上层策略（Cloudflare 平台的速率规则），代码内不做计数。

### 12.2 部署走 Workers Builds，Actions 只做质量门禁

早先方案用 Actions 同时做构建、部署。现在职责拆开：

- **部署**：Cloudflare Workers 直连 GitHub（Workers Builds），`push main` 即执行 `pnpm build` + `npx wrangler deploy`，不需要 Actions 参与，也不需要自建部署密钥。
- **校验**：`.github/workflows/ci.yml` 保留两个 job —— `verify`（typecheck → typecheck:api → lint → test → build）与 `e2e`（Playwright），只做挡板，不产出部署物。

这样合并请求有统一门禁，部署链路又只有一条，不会出现 Actions 部署与平台部署互相覆盖的情况。

### 12.3 手写 wrangler 命令只用于应急发布

常规发布由 Workers Builds 执行 `npx wrangler deploy`，部署物始终对应某个提交。本地 `pnpm deploy` 仅用于平台不可用时的应急发布，不作为日常链路。

### 12.4 部署配置入库，账号资源 ID 不入库

`wrangler.toml` 纳入版本管理，声明 `main`、`[assets]`、`[ai]` 等与代码强相关的配置——这些是代码资产，缺了平台就无法判断该部署什么。KV 的 namespace ID 属于账号资源，保持注释状态，由部署者填入自己的 ID。

原因：binding ID 不是代码资产，提交真实 ID 会让 fork 用户继承并误用他人命名空间。代价是首次部署要手动建一次 KV，属于一次性成本。

### 12.5 KV 只做缓存，不做业务状态

移除限流计数器后，KV 只写缓存数据，日写入量远低于免费配额。用户态数据（收藏、历史、主题）全部留在 localStorage，不需要账号与数据库。

---

## 更新日志

| 版本 | 日期 | 变更内容 |
|------|------|----------|
| 1.6.0 | 2026-11-04 | 统一版本序列；补充分包/缓存/状态模型；工具数 144 |
| 1.0.0 | 2026-02-20 | 初始架构设计文档 |
