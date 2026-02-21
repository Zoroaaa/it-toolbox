# 系统架构设计文档

本文档详细描述 IT Toolbox 的系统架构设计，包括模块划分、组件关系、技术选型及架构图。

## 1. 项目概述

IT Toolbox 是面向开发者的在线工具箱，集成 72 款高频开发工具。基于 Cloudflare Pages Functions 全栈部署，前后端同域，无需传统服务器，全球边缘节点低延迟响应。

### 核心特性

| 特性 | 说明 |
|------|------|
| 全栈同域 | Pages Functions 架构，前后端同域，天然无跨域问题 |
| 边缘优先 | 全球 300+ Cloudflare 节点，无冷启动，API 响应 <50ms |
| 零服务器 | 完全 Serverless，无购买维护服务器成本 |
| 前端计算 | 90% 工具浏览器端运算，隐私安全，无网络往返 |
| Git 驱动部署 | push main 分支自动构建部署，无 Actions，无 CLI 操作 |
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
│                      Cloudflare Pages (CDN)                                  │
│  ┌─────────────────────────────┐  ┌─────────────────────────────────────┐  │
│  │  静态资源 (dist/)            │  │  Pages Functions (边缘计算)          │  │
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
│  │  ├── functions/     (Pages Functions)                                │    │
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
│   │   └── ...                   # 其他工具 (共72个)
│   ├── utils/                    # 工具函数
│   │   └── icons.ts              # 图标映射
│   ├── index.css                 # 全局样式
│   ├── main.tsx                  # 应用入口
│   ├── registry.ts               # 工具注册表 (核心)
│   └── routeTree.tsx             # 路由配置
│
├── functions/                    # Cloudflare Pages Functions
│   └── api/
│       ├── [[route]].ts          # Hono 入口 (统一路由)
│       └── routes/               # API 路由模块
│           ├── ip.ts             # IP 查询接口
│           ├── dns.ts            # DNS 查询接口
│           └── ai.ts             # AI 增强接口
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

---

## 5. 核心模块设计

### 5.1 工具注册表 (Registry)

工具注册表是整个应用的核心，所有工具通过 `src/registry.ts` 统一注册。

```typescript
// src/registry.ts
import Fuse from 'fuse.js'
import type { ToolMeta } from '@toolbox/types/tool'

export const toolRegistry: ToolMeta[] = [
  {
    id: 'json-formatter',        // 唯一标识，用于路由
    name: 'JSON 格式化',          // 显示名称
    nameEn: 'JSON Formatter',    // 英文名称
    description: '格式化、压缩、校验 JSON', // 描述
    category: 'format',          // 分类
    tags: ['json', 'format'],    // 标签 (用于搜索)
    keywords: ['大括号', '对象'], // 中文关键词
    icon: 'Braces',              // 图标名称
    requiresApi: false,          // 是否需要后端 API
    isNew: false,                // 是否新工具
  },
  // ... 更多工具 (共72个)
]

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
// functions/api/[[route]].ts
import { Hono } from 'hono'
import { handle } from 'hono/cloudflare-pages'
import { cors } from 'hono/cors'
import { ipRoute } from './routes/ip'
import { dnsRoute } from './routes/dns'
import { aiRoute } from './routes/ai'

export interface Env {
  CACHE: KVNamespace
  FILES: R2Bucket
  AI: Ai
  ENVIRONMENT: string
  EXCHANGE_API_KEY: string
}

const app = new Hono<{ Bindings: Env }>()

app.use('/api/*', cors())

app.get('/api/health', (c) => c.json({ ok: true, ts: Date.now() }))

app.route('/api/ip', ipRoute)
app.route('/api/dns', dnsRoute)
app.route('/api/ai', aiRoute)

export const onRequest = handle(app)
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

| Key 格式 | 用途 | TTL |
|----------|------|-----|
| `cache:ip:{ip}` | IP 查询缓存 | 3600s |
| `cache:dns:{domain}:{type}` | DNS 查询缓存 | 300s |

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
| 同域架构 | Pages Functions 与前端同域，天然无跨域 |
| 前端隐私计算 | 密码、密钥、敏感数据浏览器端处理 |
| 输入校验 | Hono 路由层校验参数，AI 接口限制输入长度 |
| Secrets 管理 | API Key 存 Cloudflare Secrets，不写入代码仓库 |
| AI Prompt 安全 | 系统 Prompt 固定角色，输出结构化 JSON |

---

## 10. 扩展设计

### 10.1 新增工具流程

1. 在 `src/tools/` 下创建新文件夹
2. 创建 `meta.ts`（工具元信息）
3. 创建 `index.tsx`（工具 UI 组件）
4. 在 `src/registry.ts` 中添加注册记录
5. 在 `src/pages/ToolPage.tsx` 添加懒加载映射
6. 如有纯计算逻辑，添加到 `packages/core/src/`
7. 如需后端 API，在 `functions/api/routes/` 中添加路由

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
│                   后端 API (functions/api/)                      │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                    [[route]].ts (Hono 入口)              │  │
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

## 更新日志

| 版本 | 日期 | 变更内容 |
|------|------|----------|
| 2.0.0 | 2026-02-21 | 更新架构文档，反映 72 款工具的实际状态 |
| 1.0.0 | 2026-02-20 | 初始架构设计文档 |
