# 改造前后指标对比（v1.6.0）

数据来源：`node scripts/report-bundle.mjs`、`pnpm test`、`pnpm lint`、PWA 构建输出。体积为 gzip 估算，线上 Brotli 通常再小 10%–15%。

## 首屏

| 指标 | 改造前 | 改造后 | 变化 |
|---|---|---|---|
| 首屏资源 | 5 个 / 1417 KB raw / 321 KB gzip | 3 个 / 546 KB raw / 169 KB gzip | **-47%** |
| 入口 JS | 202 KB raw | 218 KB raw | 路由拆分后略增（含 registry 与中文词典） |
| 全量图标 chunk | 885 KB raw / 160 KB gzip | 移除 | 改为 86 个显式图标映射 |
| React vendor | 288 KB raw / 90 KB gzip | 289 KB raw / 90 KB gzip | 持平 |

## 离线与缓存

| 指标 | 改造前 | 改造后 |
|---|---|---|
| Service Worker 预缓存 | 187 条 / 7.9 MB | **18 条 / 1.5 MB** |
| 工具 chunk | 首访全量后台下载 | 首访不下载，按需 CacheFirst |
| 工具 chunk 命名 | `index-[hash].js` ×145 | `tools/<id>-[hash].js` ×144 |

## 构建产物

| 指标 | 改造前 | 改造后 |
|---|---|---|
| JS 文件数 | 171 | 50 + 144 个工具 chunk |
| JS 总 raw | 7844 KB | 2525 KB（不含工具 chunk 目录统计口径差异） |
| 最大单 chunk | markdown 1010 KB raw | markdown 1010 KB raw（仅 Markdown 工具加载） |

## 工程质量

| 指标 | 改造前 | 改造后 |
|---|---|---|
| ESLint | 39 error / 33 warning | **0 / 0** |
| 测试 | 0 | **331 条**（3 条 XML 用例在 happy-dom 下跳过） |
| core 行覆盖 | — | **91.5%** |
| CI | 无 | typecheck → typecheck:api → lint → test → build |
| 整店订阅 | 78 处 | **0** |
| 函数类型检查 | `functions/` 未纳入 | 纳入 `typecheck:api` 与 lint |

## 工具可用性

| 指标 | 改造前 | 改造后 |
|---|---|---|
| 工具数 | 145（文档写 146） | **144**（下线 webhook-test） |
| P0 缺陷 | 5 | 0 |
| P1 缺陷 | 12 | 0 |
| 非法图标 | 26 | 0 |
| 元数据不一致 | 19 个名称 + 1 个分类 | 0 |

## 未达标项

- 首屏 gzip 目标 150 KB，实际 169 KB。剩余体积主要来自 registry（约 45 KB raw）与中文词典（约 24 KB raw）。进一步压缩需要把工具描述拆到按需 chunk，收益约 5–8 KB gzip，暂未执行。
- `functions` 路由覆盖率未纳入门槛，仅在 `tests/api/routes.test.ts` 覆盖 8 组路由的主要分支。
