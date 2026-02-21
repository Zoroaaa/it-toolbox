# 部署文档

本文档详细描述 IT Toolbox 的部署流程，包含环境要求、部署步骤、配置说明及常见问题处理。

## 1. 部署概述

IT Toolbox 采用 Cloudflare Pages Functions 全栈部署方案，具有以下特点：

| 特性 | 说明 |
|------|------|
| 部署方式 | GitHub 直连 Cloudflare Pages |
| 构建触发 | push 到 main 分支自动构建 |
| 构建工具 | Vite 6.0 |
| 运行环境 | Cloudflare Edge Network |
| 部署时间 | 约 1-2 分钟 |

---

## 2. 环境要求

### 2.1 开发环境

| 工具 | 版本要求 | 说明 |
|------|----------|------|
| Node.js | >= 18.0 | 运行时环境 |
| pnpm | >= 8.0 | 包管理器 |
| Git | >= 2.0 | 版本控制 |

### 2.2 Cloudflare 资源

| 资源 | 说明 | 免费额度 |
|------|------|----------|
| Cloudflare 账号 | 需注册 Cloudflare 账号 | 免费 |
| KV Namespace | 缓存存储 | 100,000 次读取/天 |
| R2 Bucket | 文件存储 | 10GB 存储 |
| Workers AI | AI 推理 | 10,000 Neurons/天 |

---

## 3. 首次部署流程

### 3.1 第一步：创建 KV 命名空间

1. 登录 [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. 进入 **Workers & Pages** → **KV**
3. 点击 **Create namespace**
4. 输入名称：`toolbox-cache`
5. 创建后复制 **Namespace ID**

### 3.2 第二步：创建 R2 存储桶

1. 进入 **R2** → **Create bucket**
2. 输入名称：`it-toolbox`
3. 选择位置提示（建议选择自动）
4. 点击 **Create bucket**

### 3.3 第三步：配置 wrangler.toml

更新项目根目录的 `wrangler.toml` 文件：

```toml
name = "it-toolbox"
compatibility_date = "2024-11-01"
compatibility_flags = ["nodejs_compat"]
pages_build_output_dir = "dist"

[vars]
ENVIRONMENT = "production"

[[kv_namespaces]]
binding = "CACHE"
id = "你的KV命名空间ID"  # 替换为实际的 ID

[[r2_buckets]]
binding = "FILES"
bucket_name = "it-toolbox"

[ai]
binding = "AI"
```

### 3.4 第四步：连接 GitHub 创建 Pages 项目

1. 进入 **Workers & Pages** → **Create** → **Pages** → **Connect to Git**
2. 选择 GitHub 并授权
3. 选择 `it-toolbox` 仓库
4. 配置构建设置：

| 配置项 | 值 |
|--------|-----|
| Framework preset | None |
| Build command | `pnpm build` |
| Build output directory | `dist` |
| Root directory | `/` |

5. 点击 **Save and Deploy**

### 3.5 第五步：配置 Secrets（可选）

如果需要使用汇率换算功能，需配置汇率 API 密钥：

1. 进入 **Workers & Pages** → **it-toolbox** → **Settings** → **Environment variables**
2. 添加变量：

| 变量名 | 类型 | 说明 |
|--------|------|------|
| EXCHANGE_API_KEY | Secret | 汇率 API Key |

---

## 4. 日常部署流程

首次配置完成后，日常部署只需推送代码：

```bash
# 日常开发流程
git add .
git commit -m "feat: add new tool"
git push origin main

# Cloudflare 自动执行：
# 1. 拉取最新代码
# 2. 读取 wrangler.toml 确认 Bindings
# 3. 执行 pnpm build（含 tsc 类型检查）
# 4. 部署到全球 CDN 节点
```

部署过程约 1-2 分钟，期间旧版本继续服务，实现零停机部署。

---

## 5. 本地开发

### 5.1 安装依赖

```bash
pnpm install
```

### 5.2 启动开发服务器

```bash
# 前端开发（推荐日常使用）
pnpm dev

# 全栈开发（调试 API 时使用）
# 终端1：启动 Vite
pnpm dev

# 终端2：启动 Wrangler Pages Dev
pnpm pages:dev
```

| 命令 | 底层工具 | 用途 |
|------|----------|------|
| `pnpm dev` | Vite | 前端开发，热更新快 |
| `pnpm pages:dev` | wrangler pages dev | 全栈开发，包含 API |

### 5.3 本地调试 Pages Functions

```bash
# 首次使用需登录
npx wrangler login

# 启动全栈本地开发（需要两个终端）
# 终端1
pnpm dev

# 终端2
pnpm pages:dev

# 访问
# 前端: http://localhost:5173
# API:  http://localhost:5173/api/ip
```

---

## 6. 构建与验证

### 6.1 类型检查

```bash
pnpm typecheck
```

### 6.2 构建

```bash
pnpm build
```

构建产物位于 `dist/` 目录。

### 6.3 本地预览

```bash
pnpm preview
```

### 6.4 手动部署

```bash
pnpm deploy
```

---

## 7. 配置说明

### 7.1 wrangler.toml 完整配置

```toml
# 项目名称
name = "it-toolbox"

# 兼容性日期
compatibility_date = "2024-11-01"

# Node.js 兼容标志
compatibility_flags = ["nodejs_compat"]

# 构建输出目录
pages_build_output_dir = "dist"

# 环境变量
[vars]
ENVIRONMENT = "production"

# KV 缓存绑定
[[kv_namespaces]]
binding = "CACHE"
id = "你的KV-ID"

# R2 文件存储绑定
[[r2_buckets]]
binding = "FILES"
bucket_name = "it-toolbox"

# Workers AI 绑定
[ai]
binding = "AI"

# Secrets 通过 Dashboard 配置，不写入文件
# EXCHANGE_API_KEY
```

### 7.2 环境变量说明

| 变量名 | 来源 | 说明 |
|--------|------|------|
| ENVIRONMENT | wrangler.toml | 运行环境标识 |
| CACHE | KV Binding | KV 命名空间绑定 |
| FILES | R2 Binding | R2 存储桶绑定 |
| AI | AI Binding | Workers AI 绑定 |
| EXCHANGE_API_KEY | Dashboard Secret | 汇率 API 密钥 |

---

## 8. 域名配置

### 8.1 使用 Cloudflare 默认域名

部署成功后，项目将获得默认域名：

```
https://it-toolbox.pages.dev
```

### 8.2 绑定自定义域名

1. 进入 **Workers & Pages** → **it-toolbox** → **Settings** → **Domains & functions**
2. 点击 **Set up a custom domain**
3. 输入自定义域名
4. 按提示添加 DNS 记录

---

## 9. 监控与日志

### 9.1 查看部署日志

1. 进入 **Workers & Pages** → **it-toolbox**
2. 点击 **Deployments** 标签
3. 选择具体部署查看日志

### 9.2 查看运行时日志

1. 进入 **Workers & Pages** → **it-toolbox**
2. 点击 **Logs** 标签
3. 选择 **Begin log stream**

### 9.3 查看分析数据

1. 进入 **Workers & Pages** → **it-toolbox**
2. 点击 **Analytics** 标签
3. 查看请求数、错误率、延迟等指标

---

## 10. 常见问题处理

### 10.1 构建失败

**问题**：构建时报错 `tsc --noEmit` 失败

**解决方案**：

```bash
# 本地运行类型检查
pnpm typecheck

# 根据错误信息修复类型问题
```

### 10.2 KV 绑定失败

**问题**：API 返回 `Cannot read properties of undefined (reading 'get')`

**解决方案**：

1. 检查 `wrangler.toml` 中的 KV ID 是否正确
2. 确认 KV 命名空间已创建
3. 重新部署项目

### 10.3 AI 接口调用失败

**问题**：AI 接口返回 500 错误

**解决方案**：

1. 确认 Workers AI 已启用
2. 检查 AI 配额是否用尽
3. 查看 Cloudflare Dashboard 的错误日志

### 10.4 本地开发 API 无法访问

**问题**：本地运行 `pnpm dev` 时 API 返回 404

**解决方案**：

```bash
# 使用全栈开发模式（两个终端）
# 终端1
pnpm dev

# 终端2
pnpm pages:dev
```

Vite 开发服务器会自动代理 `/api/*` 请求到 Wrangler Pages Dev 服务器（端口 8788）。

### 10.5 部署后样式丢失

**问题**：部署后页面样式不正确

**解决方案**：

1. 检查 `tailwind.config.js` 配置
2. 确认 `content` 路径包含所有组件文件
3. 清除 Cloudflare 缓存后重新访问

### 10.6 CORS 错误

**问题**：API 请求返回 CORS 错误

**解决方案**：

1. 确认使用正确的 API 路径 `/api/*`
2. 检查 Hono 路由中的 CORS 配置
3. 确保前端和 API 同域访问

---

## 11. 回滚操作

### 11.1 通过 Dashboard 回滚

1. 进入 **Workers & Pages** → **it-toolbox**
2. 点击 **Deployments** 标签
3. 找到需要回滚的版本
4. 点击 **...** → **Rollback to this deployment**

### 11.2 通过 Git 回滚

```bash
# 回滚到上一个版本
git revert HEAD
git push origin main

# 回滚到指定版本
git revert <commit-hash>
git push origin main
```

---

## 12. 成本估算

### 12.1 Cloudflare 免费计划额度

| 资源 | 免费额度 | 实际用量评估 |
|------|----------|--------------|
| Pages 构建 | 500 次/月 | 日常开发绰绰有余 |
| Pages Functions 请求 | 100,000 次/天 | 日活 <5 万完全免费 |
| Workers AI | 10,000 Neurons/天 | 约 1000 次 AI 请求/天 |
| KV 读取 | 100,000 次/天 | 缓存命中均为读操作 |
| KV 写入 | 1,000 次/天 | 实际约 100 次/天 |
| R2 存储 | 10GB + 10M 操作/月 | 临时文件，远低于限制 |

### 12.2 预估月费

| 日活用户 | 预估月费 |
|----------|----------|
| < 1 万 | 0 元 |
| 1-5 万 | 0-5 美元 |
| > 5 万 | 需评估付费计划 |

---

## 13. 安全建议

### 13.1 Secrets 管理

- 所有敏感信息（API Key、密钥）通过 Cloudflare Dashboard 配置
- 不要将 Secrets 写入代码仓库
- 定期轮换 API Key

### 13.2 访问控制

- 使用 Cloudflare Access 进行访问控制（如需）
- 启用 Cloudflare WAF 防护

### 13.3 监控告警

- 配置 Cloudflare 告警通知
- 监控错误率和响应时间

---

## 14. 附录

### 14.1 常用命令速查

```bash
# 安装依赖
pnpm install

# 本地开发
pnpm dev

# 全栈开发（两个终端）
pnpm dev          # 终端1
pnpm pages:dev    # 终端2

# 类型检查
pnpm typecheck

# 构建
pnpm build

# 本地预览
pnpm preview

# 部署
pnpm deploy

# 部署（自动，通过 Git push）
git push origin main
```

### 14.2 相关链接

| 资源 | 链接 |
|------|------|
| Cloudflare Dashboard | https://dash.cloudflare.com/ |
| Cloudflare Pages 文档 | https://developers.cloudflare.com/pages/ |
| Cloudflare Workers 文档 | https://developers.cloudflare.com/workers/ |
| Hono 文档 | https://hono.dev/ |

---

## 更新日志

| 版本 | 日期 | 变更内容 |
|------|------|----------|
| 2.0.0 | 2026-02-21 | 更新部署文档，反映项目实际配置 |
| 1.0.0 | 2026-02-20 | 初始部署文档 |
