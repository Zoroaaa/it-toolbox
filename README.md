# IT Toolbox

开发者工具箱 — 150+ 实用工具，基于 Cloudflare Pages Functions 全栈部署。

**技术栈**：React 18 · TypeScript 5 · Hono · TanStack Router · Zustand · Tailwind CSS · Cloudflare Pages Functions

---

## 快速开始

```bash
# 安装依赖
pnpm install

# 本地开发（前端 + API 一体）
pnpm dev

# 类型检查
pnpm typecheck

# 构建
pnpm build

# 部署
pnpm deploy
```

## 初始化 Cloudflare 资源

```bash
# 登录
wrangler login

# 创建 KV（缓存）
wrangler kv:namespace create CACHE
# 将生成的 id 填入 wrangler.toml

# 创建 R2（文件存储）
wrangler r2 bucket create toolbox-files

# 设置 Secrets
wrangler secret put EXCHANGE_API_KEY
```

## 新增工具

1. 在 `src/tools/` 下创建新文件夹，例如 `src/tools/base64/`
2. 创建 `meta.ts`（工具元信息）
3. 创建 `index.tsx`（工具 UI 组件）
4. 在 `src/registry.ts` 中添加一条注册记录
5. 在 `src/pages/ToolPage.tsx` 的 `toolComponents` 中添加懒加载映射
6. 如有纯计算逻辑，添加到 `packages/core/src/index.ts`
7. 如需后端 API，在 `functions/api/routes/` 中添加路由

## 项目结构

```
it-toolbox/
├── src/
│   ├── components/
│   │   ├── layout/      # Sidebar, Header (Cmd+K)
│   │   ├── tool/        # ToolLayout 通用容器
│   │   └── ui/          # ToolCard 等
│   ├── tools/           # 每个工具一个文件夹
│   │   └── json-formatter/
│   │       ├── meta.ts
│   │       └── index.tsx
│   ├── pages/           # 路由页面
│   ├── store/           # Zustand 全局状态
│   ├── hooks/           # useClipboard 等
│   └── registry.ts      # 工具注册表（核心）
├── functions/
│   └── api/
│       ├── [[route]].ts # Hono 入口
│       └── routes/      # ip, dns, ai
├── packages/
│   ├── core/            # 纯计算逻辑（前后端共用）
│   └── types/           # 共享类型定义
└── wrangler.toml        # 统一配置
```

## 已实现工具

- ✅ **JSON 格式化** — 格式化、压缩、校验

## 待实现（按优先级）

- 🔲 Base64 编解码
- 🔲 JWT 解析
- 🔲 UUID 生成器
- 🔲 时间戳转换
- 🔲 Hash 计算（SHA-256/512）
- 🔲 密码生成器
- 🔲 颜色格式转换
- 🔲 正则测试
- 🔲 文本 Diff
- 🔲 URL 编解码
- 🔲 IP 查询（API）
- 🔲 DNS 查询（API）
- ...（共 30+ 工具规划中）
