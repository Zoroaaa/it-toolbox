# Changelog - v1.4.0

**发布日期**: 2026-03-25

IT Toolbox v1.4.0 从 v1.3.0 的 116 个工具扩展到 126 款工具，新增 10 个实用工具，Phase 3 全部完成。

---

## 新增工具（10个）

### 浮点数可视化
- IEEE754 单精度/双精度位级展示
- 可视化浮点数存储结构（符号位、阶码、尾数）
- 支持十进制和二进制两种输入模式
- 显示十六进制表示和实际指数
- 自动识别非规格化数、无穷大、NaN

### 扩展进制转换
- 2-36 进制任意互转
- 支持小数部分转换
- 可配置小数精度（1-50位）
- 实时显示常用进制结果
- 支持自定义源进制和目标进制

### JSON 表格视图
- JSON 数组渲染为可排序表格
- 支持关键词搜索过滤
- 点击列头排序（升序/降序/取消）
- 支持嵌套对象扁平化显示
- 一键导出 CSV 文件

### JSON 深度合并
- 两个 JSON 对象深度合并
- 4 种冲突策略可选：
  - 深度合并：递归合并嵌套对象
  - 源优先：冲突时使用源 JSON 值
  - 目标优先：冲突时保留目标 JSON 值
  - 数组合并：数组类型进行拼接
- 一键交换输入源

### JSON Schema 验证
- 输入 JSON + Schema 实时验证
- 完整的错误定位和提示
- 支持常见 Schema 关键字：
  - type、enum、const
  - minLength、maxLength、pattern
  - minimum、maximum、exclusiveMinimum、exclusiveMaximum
  - minItems、maxItems、items
  - required、properties、additionalProperties
- 无需外部依赖，纯前端实现

### CSS clip-path 生成
- 可视化编辑多边形/圆形/椭圆/内边距
- 支持拖拽调整多边形顶点
- 内置 9 种预设形状（三角形、菱形、五边形、六边形、八边形、箭头、星形、圆形、椭圆）
- 实时预览裁剪效果
- 一键复制 CSS 代码

### Flexbox 生成器
- 可视化配置 Flexbox 属性
- 支持 flex-direction、flex-wrap、justify-content、align-items、align-content、gap
- 动态添加/删除子元素
- 单独配置每个子元素的 flex-grow、flex-shrink、flex-basis、align-self、order
- 实时预览布局效果

### 条形码生成
- 支持多种条码格式：EAN-13、EAN-8、UPC-A、Code 128、Code 39、ITF-14、Pharmacode
- 可自定义线条颜色和背景颜色
- 可调整线条宽度和条码高度
- 可选显示/隐藏文本
- 支持 SVG 和 PNG 两种导出格式

### AI 生成 Schema
- 粘贴 JSON 样本，AI 生成带注释的 JSON Schema
- 自动推断字段类型和约束
- 生成中文描述注释
- 提供结构说明

### AI 生成提交信息
- 粘贴 git diff 内容，AI 生成 Conventional Commits 规范的提交信息
- 自动识别变更类型（feat/fix/docs/style/refactor/perf/test/chore）
- 提取变更范围和描述
- 可选生成详细说明

---

## 工具统计

| 分类 | v1.3.0 | v1.4.0 | 新增 |
|------|--------|--------|------|
| 格式化 | 12 | 15 | +3 |
| 编码解码 | 11 | 11 | 0 |
| 加密安全 | 11 | 11 | 0 |
| 网络 HTTP | 15 | 15 | 0 |
| 文本处理 | 13 | 13 | 0 |
| 颜色设计 | 8 | 10 | +2 |
| 时间日期 | 6 | 6 | 0 |
| 生成器 | 11 | 12 | +1 |
| 图片媒体 | 8 | 8 | 0 |
| 开发规范 | 8 | 8 | 0 |
| 单位换算 | 6 | 6 | 0 |
| AI 增强 | 4 | 6 | +2 |
| 数学计算 | 2 | 4 | +2 |
| **总计** | **116** | **126** | **+10** |

---

## 技术亮点

### 纯前端工具（8个）
以下工具采用纯前端实现，无需后端 API 支持：
- float-visualizer（浮点数可视化）
- base-convert-ext（扩展进制转换）
- json-to-table（JSON表格视图）
- json-merge（JSON深度合并）
- json-schema-verify（JSON Schema验证）
- css-clip-path（CSS clip-path生成）
- flexbox-gen（Flexbox生成器）
- barcode-gen（条形码生成）

### AI 工具（2个）
以下工具需要 Workers AI 支持：
- ai-json-schema（AI生成Schema）
- ai-commit-msg（AI生成提交信息）

### 功能特色
- float-visualizer 完整实现 IEEE754 标准，支持单精度和双精度
- json-schema-verify 无需 ajv 依赖，纯前端实现完整验证器
- css-clip-path 支持拖拽编辑多边形顶点
- barcode-gen 使用 JsBarcode 库，支持 7 种条码格式
- 所有工具通过 TypeScript 严格模式检查

### 新增依赖
- jsbarcode ^3.11.6：条形码生成库

---

## 里程碑

### Phase 3 完成 ✅

本版本标志着 Phase 3 全部完成，共实现 51 个进阶工具：

- ✅ 数据生成&测试（6个）：随机JSON生成、SQL测试数据生成、正则从样本生成、文件完整性校验、JWT签名验证、密码强度分析
- ✅ 单位换算扩展（7个）：数字单位换算、数据存储换算、色彩空间换算、多格式时间转换、宽高比计算、CSS单位换算、罗马数字转换
- ✅ 网络进阶（5个）：WHOIS查询、SSL证书检测、HTTP安全头检测、常用端口参考、邮箱格式验证
- ✅ 数字&数学（4个）：质数检测、GCD/LCM计算、浮点数可视化、扩展进制转换
- ✅ JSON&数据工具扩展（3个）：JSON表格视图、JSON深度合并、JSON Schema验证
- ✅ HTML&CSS工具扩展（2个）：CSS clip-path生成、Flexbox生成器
- ✅ 二维码&条形码（1个）：条形码生成

---

## 后续规划

根据开发路线图，后续版本将继续完善 Phase 4：

### Phase 4 待完成工具
- AI 增强工具扩展（6个）：AI结构化提取、AI翻译、AI命名助手、AI报错解释、AI生成Mock数据、AI Shell命令生成
- 效率&协作（7个）：批量处理模式、工具对比模式、快捷键系统、JSON-RPC测试、Webhook测试、环境变量Diff、Changelog生成
- 前端工具扩展（7个）：CSS Grid生成器、CSS动画生成、字体搭配、图标搜索、Sitemap生成、robots.txt生成、.htaccess生成

---

**IT Toolbox v1.4.0** - Phase 3 完成，126 款工具！
