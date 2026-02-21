# API 接口文档

本文档详细记录 IT Toolbox 项目所有 API 接口的规范、参数说明、返回值格式及使用示例。

## 基础信息

| 项目 | 说明 |
|------|------|
| 基础路径 | `/api` |
| 协议 | HTTPS |
| 数据格式 | JSON |
| 字符编码 | UTF-8 |
| CORS | 已启用（允许跨域请求） |

## 通用响应格式

所有 API 接口遵循统一的响应格式：

```typescript
interface ApiResponse<T = unknown> {
  success: boolean    // 请求是否成功
  data?: T            // 成功时返回的数据
  error?: string      // 失败时的错误信息
}
```

---

## 接口列表

### 1. 健康检查

检查服务运行状态。

**请求**

```
GET /api/health
```

**参数**

无

**响应**

```json
{
  "ok": true,
  "ts": 1708444800000
}
```

| 字段 | 类型 | 说明 |
|------|------|------|
| ok | boolean | 服务是否正常 |
| ts | number | 当前时间戳（毫秒） |

**示例**

```bash
curl https://your-domain.com/api/health
```

---

### 2. IP 地址查询

查询指定 IP 地址或当前请求的 IP 地址及其地理位置信息。

**请求**

```
GET /api/ip
GET /api/ip?ip={ip}
```

**参数**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| ip | string | 否 | 要查询的 IP 地址，不传则查询当前请求 IP |

**响应**

```json
{
  "success": true,
  "data": {
    "ip": "203.0.113.42",
    "city": "Shanghai",
    "country": "CN",
    "region": "Shanghai",
    "timezone": "Asia/Shanghai",
    "asn": "AS4134",
    "asOrganization": "China Telecom",
    "latitude": 31.2304,
    "longitude": 121.4737
  },
  "cached": false
}
```

| 字段 | 类型 | 说明 |
|------|------|------|
| ip | string | 查询的 IP 地址 |
| city | string | 城市名称 |
| country | string | 国家代码（ISO 3166-1 alpha-2） |
| region | string | 省/州名称 |
| timezone | string | 时区标识 |
| asn | string | 自治系统号 |
| asOrganization | string | ASN 所属组织 |
| latitude | number | 纬度 |
| longitude | number | 经度 |
| cached | boolean | 是否来自缓存（仅查询任意 IP 时返回） |

**实现说明**

- 查询当前请求 IP：使用 Cloudflare 请求头中的地理位置信息
- 查询任意 IP：使用 ip-api.com 免费服务（限制 45 次/分钟）

**缓存策略**

- 缓存时间：1 小时（3600 秒）
- 缓存键：`cache:ip:{ip}`

**示例**

```bash
# 查询当前 IP
curl https://your-domain.com/api/ip

# 查询指定 IP
curl "https://your-domain.com/api/ip?ip=8.8.8.8"
```

```javascript
const response = await fetch('/api/ip')
const { success, data } = await response.json()
console.log(data.ip) // 当前 IP 地址

// 查询指定 IP
const ipResponse = await fetch('/api/ip?ip=1.1.1.1')
const ipData = await ipResponse.json()
console.log(ipData.data.city) // 城市名称
```

---

### 3. DNS 查询

查询指定域名的 DNS 记录。

**请求**

```
GET /api/dns?domain={domain}&type={type}
```

**参数**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| domain | string | 是 | 要查询的域名 |
| type | string | 否 | DNS 记录类型，默认 `A` |

**支持的记录类型**

| 类型 | 说明 |
|------|------|
| A | IPv4 地址记录 |
| AAAA | IPv6 地址记录 |
| MX | 邮件交换记录 |
| TXT | 文本记录 |
| CNAME | 别名记录 |
| NS | 名称服务器记录 |
| SOA | 授权起始记录 |

**响应**

```json
{
  "success": true,
  "data": {
    "domain": "example.com",
    "type": "A",
    "records": [
      {
        "name": "example.com",
        "type": 1,
        "TTL": 3600,
        "data": "93.184.216.34"
      }
    ]
  },
  "cached": false
}
```

| 字段 | 类型 | 说明 |
|------|------|------|
| domain | string | 查询的域名 |
| type | string | 记录类型 |
| records | array | DNS 记录数组 |
| cached | boolean | 是否来自缓存 |

**缓存策略**

- 缓存时间：5 分钟（300 秒）
- 缓存键：`cache:dns:{domain}:{type}`

**错误响应**

```json
{
  "success": false,
  "error": "domain is required"
}
```

**示例**

```bash
# 查询 A 记录
curl "https://your-domain.com/api/dns?domain=google.com&type=A"

# 查询 MX 记录
curl "https://your-domain.com/api/dns?domain=gmail.com&type=MX"
```

```javascript
const queryDns = async (domain, type = 'A') => {
  const url = `/api/dns?domain=${encodeURIComponent(domain)}&type=${type}`
  const response = await fetch(url)
  return response.json()
}

const result = await queryDns('github.com', 'A')
console.log(result.data.records)
```

---

### 4. AI 代码解释

使用 AI 解释代码逻辑。

**请求**

```
POST /api/ai/explain
```

**请求头**

```
Content-Type: application/json
```

**请求体**

```json
{
  "code": "function fibonacci(n) { return n <= 1 ? n : fibonacci(n-1) + fibonacci(n-2); }",
  "language": "javascript"
}
```

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| code | string | 是 | 要解释的代码（最大 4000 字符） |
| language | string | 否 | 编程语言标识，默认 `unknown` |

**响应**

```json
{
  "success": true,
  "data": {
    "explanation": "这是一个计算斐波那契数列的递归函数..."
  }
}
```

**错误响应**

```json
{
  "success": false,
  "error": "code is required"
}
```

```json
{
  "success": false,
  "error": "Code too long (max 4000 chars)"
}
```

**示例**

```bash
curl -X POST https://your-domain.com/api/ai/explain \
  -H "Content-Type: application/json" \
  -d '{"code": "const x = [1,2,3].map(n => n * 2)", "language": "javascript"}'
```

```javascript
const explainCode = async (code, language = 'javascript') => {
  const response = await fetch('/api/ai/explain', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code, language })
  })
  return response.json()
}

const result = await explainCode('const sum = (a, b) => a + b')
console.log(result.data.explanation)
```

---

### 5. AI 生成正则表达式

通过自然语言描述生成正则表达式。

**请求**

```
POST /api/ai/regex
```

**请求头**

```
Content-Type: application/json
```

**请求体**

```json
{
  "description": "匹配中国大陆手机号码"
}
```

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| description | string | 是 | 正则表达式的自然语言描述 |

**响应**

```json
{
  "success": true,
  "data": {
    "pattern": "^1[3-9]\\d{9}$",
    "flags": "g",
    "explanation": "匹配以1开头，第二位为3-9，后面跟着9位数字的中国大陆手机号"
  }
}
```

| 字段 | 类型 | 说明 |
|------|------|------|
| pattern | string | 正则表达式模式 |
| flags | string | 正则标志（如 g, i, m） |
| explanation | string | 正则表达式的中文解释 |

**示例**

```bash
curl -X POST https://your-domain.com/api/ai/regex \
  -H "Content-Type: application/json" \
  -d '{"description": "匹配有效的邮箱地址"}'
```

```javascript
const generateRegex = async (description) => {
  const response = await fetch('/api/ai/regex', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ description })
  })
  return response.json()
}

const result = await generateRegex('匹配18位身份证号码')
if (result.success) {
  const regex = new RegExp(result.data.pattern, result.data.flags)
  console.log(regex.test('11010519900307234X'))
}
```

---

### 6. AI 生成 SQL

通过自然语言描述生成 SQL 查询语句。

**请求**

```
POST /api/ai/sql
```

**请求头**

```
Content-Type: application/json
```

**请求体**

```json
{
  "description": "查询所有活跃用户的订单总数",
  "schema": "CREATE TABLE users (id INT, name VARCHAR(100), status VARCHAR(20)); CREATE TABLE orders (id INT, user_id INT, amount DECIMAL);"
}
```

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| description | string | 是 | SQL 查询的自然语言描述 |
| schema | string | 否 | 数据库 DDL Schema 作为上下文 |

**响应**

```json
{
  "success": true,
  "data": {
    "sql": "SELECT u.id, u.name, COUNT(o.id) as order_count FROM users u LEFT JOIN orders o ON u.id = o.user_id WHERE u.status = 'active' GROUP BY u.id, u.name",
    "explanation": "查询所有活跃用户的订单数量，使用 LEFT JOIN 确保没有订单的用户也会显示"
  }
}
```

**示例**

```bash
curl -X POST https://your-domain.com/api/ai/sql \
  -H "Content-Type: application/json" \
  -d '{
    "description": "查找过去30天内下单金额超过1000元的用户",
    "schema": "CREATE TABLE users (id INT, name VARCHAR(100)); CREATE TABLE orders (id INT, user_id INT, amount DECIMAL, created_at TIMESTAMP);"
  }'
```

```javascript
const generateSql = async (description, schema = null) => {
  const body = { description }
  if (schema) body.schema = schema
  
  const response = await fetch('/api/ai/sql', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  })
  return response.json()
}

const result = await generateSql(
  '统计每个分类下的商品数量',
  'CREATE TABLE products (id INT, name VARCHAR(100), category_id INT); CREATE TABLE categories (id INT, name VARCHAR(50));'
)
```

---

## 错误处理

### HTTP 状态码

| 状态码 | 说明 |
|--------|------|
| 200 | 请求成功 |
| 400 | 请求参数错误 |
| 500 | 服务器内部错误 |
| 502 | 上游服务错误（如 DNS 查询失败） |

### 错误响应格式

```json
{
  "success": false,
  "error": "错误描述信息"
}
```

---

## 速率限制

当前版本为公共服务，暂不实施速率限制。建议合理使用，避免频繁请求。

**注意**：

- IP 查询任意 IP 使用 ip-api.com 服务，限制 45 次/分钟
- AI 功能使用 Workers AI，有每日配额限制

---

## CORS 配置

所有 `/api/*` 接口已启用 CORS，支持跨域请求：

```
Access-Control-Allow-Origin: *
Access-Control-Allow-Methods: GET, POST, OPTIONS
Access-Control-Allow-Headers: Content-Type
```

---

## 技术实现

### 后端框架

- **Hono**：轻量级 Web 框架，运行于 Cloudflare Pages Functions
- **Cloudflare Workers AI**：AI 推理服务，使用 `@cf/meta/llama-3.1-8b-instruct` 模型

### 数据缓存

使用 Cloudflare KV 存储缓存数据：

| 缓存类型 | TTL | Key 格式 |
|----------|-----|----------|
| IP 查询 | 3600s | `cache:ip:{ip}` |
| DNS 查询 | 300s | `cache:dns:{domain}:{type}` |

### 环境变量

| 变量名 | 类型 | 说明 |
|--------|------|------|
| CACHE | KVNamespace | KV 缓存存储绑定 |
| FILES | R2Bucket | R2 文件存储绑定 |
| AI | Ai | Workers AI 绑定 |
| ENVIRONMENT | string | 运行环境标识 |
| EXCHANGE_API_KEY | string | 汇率 API 密钥（可选） |

---

## TypeScript 类型定义

```typescript
// 通用响应类型
export interface ApiResponse<T = unknown> {
  success: boolean
  data?: T
  error?: string
}

// IP 信息类型
export interface IpInfo {
  ip: string
  city: string
  country: string
  region: string
  timezone: string
  asn: string
  asOrganization: string
  latitude: number
  longitude: number
}

// DNS 记录类型
export interface DnsRecord {
  name: string
  type: number
  TTL: number
  data: string
}

// DNS 响应类型
export interface DnsResponse {
  domain: string
  type: string
  records: DnsRecord[]
}

// AI 代码解释响应
export interface AiExplainResponse {
  explanation: string
}

// AI 正则生成响应
export interface AiRegexResponse {
  pattern: string
  flags: string
  explanation: string
}

// AI SQL 生成响应
export interface AiSqlResponse {
  sql: string
  explanation: string
}
```

---

## 更新日志

| 版本 | 日期 | 变更内容 |
|------|------|----------|
| 2.0.0 | 2026-02-21 | 更新 API 文档，补充 IP 查询任意 IP 功能说明 |
| 1.0.0 | 2026-02-20 | 初始版本，包含 IP、DNS、AI 接口 |
