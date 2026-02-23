# IT Toolbox

<div align="center">

**开发者工具箱** — 72 款实用工具，基于 Cloudflare Pages Functions 全栈部署

[![Version](https://img.shields.io/badge/version-2.0.0-blue.svg)](https://github.com/your-username/it-toolbox)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)
[![Cloudflare](https://img.shields.io/badge/Cloudflare-Pages-orange.svg)](https://pages.cloudflare.com/)

[在线演示](https://ittool.pp.ua) · [快速开始](./docs/QUICKSTART.md) · [API 文档](./docs/API.md) · [部署指南](./docs/DEPLOYMENT.md)

</div>

---

## 项目简介

IT Toolbox 是一款面向开发者的在线工具箱，集成 72 款高频开发工具，覆盖格式化、编码解码、加密安全、网络查询、文本处理、颜色设计等多个类别。

### 核心特性

| 特性 | 说明 |
|------|------|
| 🚀 **零延迟** | 90% 工具在浏览器端运行，无需等待服务器响应 |
| 🔒 **隐私安全** | 敏感数据（密码、密钥）本地处理，不上传服务器 |
| 🌍 **全球加速** | 基于 Cloudflare CDN，全球 300+ 边缘节点 |
| 📱 **响应式设计** | 完美适配桌面端和移动端 |
| 🌙 **深色模式** | 支持亮色/深色/跟随系统三种主题 |
| ⌨️ **快捷操作** | `Ctrl/Cmd + K` 全局搜索，高效访问工具 |

### 技术栈

| 类型 | 技术 |
|------|------|
| 前端框架 | React 18 · TypeScript 5 |
| 路由管理 | TanStack Router |
| 状态管理 | Zustand |
| 样式方案 | Tailwind CSS |
| 后端框架 | Hono |
| 部署平台 | Cloudflare Pages Functions |

---

## 功能概览

### 工具统计

| 分类 | 工具数量 | 说明 |
|------|----------|------|
| 格式化 | 9 | JSON/Markdown/YAML/XML/SQL/CSS/JS/TOML/CSV |
| 编码解码 | 11 | Base64/URL/JWT/HTML实体/Hex/Unicode/摩斯密码等 |
| 加密安全 | 8 | Hash/AES/RSA/HMAC/Bcrypt/SSH/JWT生成/证书解析 |
| 网络 HTTP | 9 | IP查询/DNS/URL解析/HTTP状态码/MIME类型等 |
| 文本处理 | 11 | 命名转换/正则测试/文本统计/Diff/相似度等 |
| 颜色设计 | 7 | 颜色选择器/渐变生成/配色方案/WCAG对比度等 |
| 时间日期 | 5 | 时间戳转换/日期计算/时区转换/时长格式化等 |
| 生成器 | 8 | UUID/NanoID/ULID/ObjectID/密码/假数据/二维码等 |
| 单位换算 | 1 | 进制转换 |
| AI 增强 | 3 | AI代码解释/AI正则生成/AI SQL生成 |

### 已实现工具（v2.0.0）

#### 格式化

| 工具 | 说明 |
|------|------|
| JSON 格式化 | 格式化、压缩、校验 JSON 数据，支持语法高亮 |
| Markdown 预览 | 实时渲染，支持 GFM、数学公式、代码高亮 |
| YAML ↔ JSON | YAML 与 JSON 格式互转 |
| SQL 格式化 | 格式化和美化 SQL 语句，支持多种数据库方言 |
| XML 格式化 | 格式化、压缩、校验 XML 文档 |
| CSS 格式化 | CSS/SCSS/Less 格式化与压缩 |
| JS/TS 格式化 | JavaScript/TypeScript/JSON5 格式化与压缩 |
| TOML ↔ JSON | TOML 与 JSON 格式互转 |
| CSV 查看器 | CSV 数据可视化查看与转换 |

#### 编码解码

| 工具 | 说明 |
|------|------|
| Base64 编解码 | 文本/文件 Base64/Base64URL 编解码 |
| URL 编解码 | encodeURIComponent/完整 URL 编解码与解析 |
| JWT 解析 | 解析 Header/Payload，高亮过期时间 |
| HTML 实体编解码 | HTML 实体编码与解码 |
| Hex 编解码 | 文本与十六进制互转 |
| Unicode 转换 | 字符与 Unicode 码点互转 |
| 摩斯密码 | 文本与摩斯电码互转 |
| 二进制文本 | 文本与二进制字符串互转 |
| ROT13/Caesar | ROT13 及 Caesar 移位密码 |
| Punycode 转换 | 国际化域名 IDN Punycode 编解码 |
| ASCII 码表 | 完整 ASCII/Unicode 字符查询 |

#### 加密安全

| 工具 | 说明 |
|------|------|
| Hash 计算器 | MD5/SHA-1/SHA-256/SHA-384/SHA-512 哈希计算 |
| AES 加密解密 | AES-GCM 对称加密与解密 |
| RSA 密钥生成 | 生成 RSA 密钥对，导出 PEM 格式 |
| HMAC 计算 | HMAC-SHA256/512 签名计算 |
| Bcrypt 哈希 | Bcrypt 密码哈希与验证 |
| SSH 密钥生成 | 生成 Ed25519/RSA SSH 密钥对 |
| JWT 生成 | 填写 Payload/Header，选择算法生成 Token |
| TLS 证书解析 | 解析 PEM 证书，显示域名/有效期/指纹/SAN |

#### 网络 HTTP

| 工具 | 说明 |
|------|------|
| IP 地址查询 | 查询 IP 地理位置、ASN 信息 |
| DNS 查询 | A/AAAA/MX/TXT/CNAME 记录查询 |
| URL 解析 | 解析 URL 的各个组成部分 |
| HTTP 状态码 | 查询 HTTP 状态码的含义和说明 |
| HTTP 请求头 | 常见请求/响应头说明，安全头建议 |
| MIME 类型 | 文件扩展名与 MIME 类型对照查询 |
| IP 子网计算 | CIDR 计算网络地址/广播地址/主机数 |
| UA 解析 | 解析 User-Agent 字符串，识别浏览器/OS/设备 |
| cURL 转换 | cURL 命令转换为 fetch/axios/Python/Go 代码 |

#### 文本处理

| 工具 | 说明 |
|------|------|
| 命名规范转换 | camelCase/snake_case/kebab-case 等 |
| 占位文本生成 | 英文 Lorem/中文乱数假文 |
| 正则表达式测试 | 实时匹配高亮，分组提取 |
| 文本统计 | 字符数/单词数/行数/阅读时间 |
| 文本 Diff | 对比两段文本的差异，高亮显示 |
| 文本变换 | 去重/排序/反转/去空行等批量操作 |
| 字符串转义 | JS/Python/Java/C 字符串转义与反转义 |
| Cron 表达式解析 | 解析和生成 Cron 表达式 |
| 文本相似度 | 计算两段文本的相似度 |
| 行处理工具 | 排序/去重/随机打乱/提取第N行 |
| JSON 转类型定义 | JSON 一键生成 TypeScript/Go/Python/Kotlin 类型 |

#### 颜色设计

| 工具 | 说明 |
|------|------|
| 颜色选择器 | HEX/RGB/HSL/HSV/CMYK 互转 |
| CSS 渐变生成器 | 可视化生成 CSS 渐变代码 |
| 配色方案生成 | 输入主色生成类比/互补/三角配色方案 |
| WCAG 对比度 | 前景/背景色对比度检测 |
| 色盲模拟 | 模拟 8 种色觉缺陷显示效果 |
| Tailwind 色板 | 完整 Tailwind v3/v4 色板 |
| Box Shadow 生成 | 可视化调整 box-shadow |

#### 时间日期

| 工具 | 说明 |
|------|------|
| 时间戳转换 | Unix 时间戳与日期时间互转 |
| 日期计算器 | 日期加减/两日期差值，工作日计算 |
| 时区转换 | 全球时区对照，多时区同屏显示 |
| 时长格式化 | 秒数与 hh:mm:ss/人话描述互转 |
| 日历生成 | 生成指定年月日历，支持导出 iCal |

#### 生成器

| 工具 | 说明 |
|------|------|
| UUID 生成器 | UUID v4 批量生成 |
| 密码生成器 | 可配置字符集，强度可视化 |
| NanoID 生成器 | 自定义字符集和长度，批量生成 |
| ULID 生成器 | 时间有序唯一 ID |
| MongoDB ObjectID | 生成/解析 ObjectID |
| 假数据生成 | 姓名/邮箱/手机/地址等假数据生成 |
| 二维码生成 | 生成二维码，支持文本、URL、WiFi 等格式 |
| 占位图生成 | 生成指定尺寸/颜色/文字的占位图 |

#### 单位换算

| 工具 | 说明 |
|------|------|
| 进制转换 | 二/八/十/十六进制互转 |

#### AI 增强

| 工具 | 说明 |
|------|------|
| AI 代码解释 | 智能解释代码逻辑 |
| AI 生成正则 | 自然语言生成正则表达式 |
| AI 生成 SQL | 自然语言生成 SQL 语句 |

---

## 快速开始

### 环境要求

- Node.js >= 18.0
- pnpm >= 8.0

### 安装与运行

```bash
# 克隆仓库
git clone https://github.com/your-username/it-toolbox.git
cd it-toolbox

# 安装依赖
pnpm install

# 启动开发服务器
pnpm dev

# 访问 http://localhost:5173
```

### 常用命令

```bash
# 前端开发（推荐日常使用）
pnpm dev

# 全栈开发（调试 API 时使用）
pnpm dev          # 终端1：启动 Vite
pnpm pages:dev    # 终端2：启动 Wrangler

# 类型检查
pnpm typecheck

# 构建
pnpm build

# 本地预览
pnpm preview

# 部署到 Cloudflare Pages
pnpm deploy
```

---

## 项目结构

```
it-toolbox/
├── src/                          # 前端源码
│   ├── components/               # React 组件
│   │   ├── layout/               # 布局组件
│   │   │   ├── Header.tsx        # 顶部导航栏
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
│   ├── tools/                    # 工具目录
│   │   ├── json-formatter/       # JSON 格式化工具
│   │   │   ├── meta.ts           # 工具元信息
│   │   │   └── index.tsx         # 工具 UI
│   │   └── ...                   # 其他工具
│   ├── utils/                    # 工具函数
│   │   └── icons.ts              # 图标映射
│   ├── index.css                 # 全局样式
│   ├── main.tsx                  # 应用入口
│   ├── registry.ts               # 工具注册表
│   └── routeTree.tsx             # 路由配置
│
├── functions/                    # Cloudflare Pages Functions
│   └── api/
│       ├── [[route]].ts          # Hono 入口
│       └── routes/               # API 路由模块
│           ├── ip.ts             # IP 查询接口
│           ├── dns.ts            # DNS 查询接口
│           └── ai.ts             # AI 增强接口
│
├── packages/                     # 共享包
│   ├── core/                     # 核心计算逻辑
│   │   ├── index.ts              # 导出入口
│   │   ├── encoding.ts           # 编解码逻辑
│   │   ├── crypto.ts             # 加密逻辑
│   │   ├── format.ts             # 格式化逻辑
│   │   ├── text.ts               # 文本处理逻辑
│   │   ├── color.ts              # 颜色处理逻辑
│   │   ├── datetime.ts           # 时间日期逻辑
│   │   ├── generator.ts          # 生成器逻辑
│   │   └── ...                   # 其他模块
│   └── types/                    # 类型定义
│       ├── api.ts                # API 类型
│       └── tool.ts               # 工具类型
│
├── docs/                         # 文档
│   ├── API.md                    # API 文档
│   ├── ARCHITECTURE.md           # 架构设计
│   ├── DEPLOYMENT.md             # 部署指南
│   ├── QUICKSTART.md             # 快速开始
│   └── changelog/                # 更新日志
│
├── wrangler.toml                 # Cloudflare 配置
├── vite.config.ts                # Vite 配置
├── tailwind.config.js            # Tailwind 配置
└── package.json                  # 项目配置
```

---

## 新增工具

添加新工具只需 5 步：

1. 在 `src/tools/` 下创建新文件夹
2. 创建 `meta.ts`（工具元信息）
3. 创建 `index.tsx`（工具 UI 组件）
4. 在 `src/registry.ts` 中添加注册记录
5. 在 `src/pages/ToolPage.tsx` 添加懒加载映射

详细说明请参考 [架构设计文档](./docs/ARCHITECTURE.md)。

---

## 部署

### 自动部署（推荐）

项目采用 GitHub 直连 Cloudflare Pages，push 到 main 分支自动构建部署：

```bash
git add .
git commit -m "feat: add new tool"
git push origin main
```

### 手动部署

```bash
pnpm build
pnpm deploy
```

详细部署步骤请参考 [部署文档](./docs/DEPLOYMENT.md)。

---

## 文档

| 文档 | 说明 |
|------|------|
| [API 文档](./docs/API.md) | API 接口规范、参数说明、使用示例 |
| [架构设计](./docs/ARCHITECTURE.md) | 系统架构、模块划分、技术选型 |
| [部署指南](./docs/DEPLOYMENT.md) | 环境要求、部署步骤、常见问题 |
| [快速开始](./docs/QUICKSTART.md) | 面向新用户的入门指南 |
| [更新日志](./docs/changelog/) | 版本变更记录 |

---

## 开发路线图

### Phase 1（已完成 ✅）
- 框架搭建
- 15 个核心工具
- 全局搜索
- 收藏与历史
- 主题切换

### Phase 2（已完成 ✅）
- 更多编码工具（HTML 实体、Hex、Unicode、摩斯密码等）
- 更多加密工具（AES、RSA、HMAC、Bcrypt、SSH 密钥等）
- 更多格式化工具（YAML、XML、SQL、CSS、JS、TOML、CSV）
- 更多网络工具（URL 解析、HTTP 状态码、MIME 类型、cURL 转换等）
- 更多文本工具（Diff、相似度、Cron 解析、JSON 转类型等）
- 更多颜色工具（渐变生成、配色方案、WCAG 对比度、色盲模拟等）
- 更多时间工具（日期计算、时区转换、时长格式化、日历生成）
- 更多生成器（NanoID、ULID、ObjectID、假数据、二维码、占位图）

### Phase 3（计划中）
- 图片处理工具
- 开发规范工具
- 单位换算工具扩展

### Phase 4（计划中）
- 用户账号系统
- 云端数据同步
- PWA 离线支持
- 更多 AI 增强功能

---

## 贡献指南

欢迎提交 Issue 和 Pull Request！

1. Fork 本仓库
2. 创建特性分支 (`git checkout -b feature/amazing-feature`)
3. 提交更改 (`git commit -m 'feat: add amazing feature'`)
4. 推送到分支 (`git push origin feature/amazing-feature`)
5. 创建 Pull Request

---

## 许可证

本项目基于 [MIT](LICENSE) 许可证开源。

---

<div align="center">

**IT Toolbox** - 让开发更高效！

[在线使用](https://ittool.pp.ua) · [反馈建议](https://github.com/Zoroaaa/it-toolbox/issues)

</div>
