import { Result } from './common'
import UAParser from 'ua-parser-js'
import * as curlConverter from 'curlconverter'

export interface ParsedUrl {
  href: string
  origin: string
  protocol: string
  username: string
  password: string
  host: string
  hostname: string
  port: string
  pathname: string
  search: string
  hash: string
  params: Record<string, string>
}

export function parseUrl(input: string): Result<ParsedUrl> {
  try {
    const url = new URL(input)
    const params: Record<string, string> = {}
    url.searchParams.forEach((v, k) => { params[k] = v })
    return {
      ok: true,
      value: {
        href: url.href,
        origin: url.origin,
        protocol: url.protocol,
        username: url.username,
        password: url.password,
        host: url.host,
        hostname: url.hostname,
        port: url.port,
        pathname: url.pathname,
        search: url.search,
        hash: url.hash,
        params,
      }
    }
  } catch {
    return { ok: false, error: 'Invalid URL' }
  }
}

export interface HttpStatus {
  code: number
  message: string
  description: string
  category: 'informational' | 'success' | 'redirection' | 'client-error' | 'server-error'
}

export const HTTP_STATUS_CODES: HttpStatus[] = [
  { code: 100, message: 'Continue', description: '服务器已收到请求的初始部分，客户端应继续发送剩余部分', category: 'informational' },
  { code: 101, message: 'Switching Protocols', description: '服务器理解并同意客户端的协议切换请求', category: 'informational' },
  { code: 102, message: 'Processing', description: '服务器已收到请求，但仍在处理中', category: 'informational' },
  { code: 200, message: 'OK', description: '请求成功', category: 'success' },
  { code: 201, message: 'Created', description: '请求成功并创建了新资源', category: 'success' },
  { code: 202, message: 'Accepted', description: '请求已接受，但尚未处理完成', category: 'success' },
  { code: 204, message: 'No Content', description: '请求成功，但无返回内容', category: 'success' },
  { code: 206, message: 'Partial Content', description: '服务器成功处理了部分GET请求', category: 'success' },
  { code: 300, message: 'Multiple Choices', description: '请求有多个可能的响应', category: 'redirection' },
  { code: 301, message: 'Moved Permanently', description: '请求的资源已永久移动到新位置', category: 'redirection' },
  { code: 302, message: 'Found', description: '请求的资源临时从不同的URI响应', category: 'redirection' },
  { code: 304, message: 'Not Modified', description: '资源未修改，使用缓存版本', category: 'redirection' },
  { code: 307, message: 'Temporary Redirect', description: '临时重定向，保持请求方法', category: 'redirection' },
  { code: 308, message: 'Permanent Redirect', description: '永久重定向，保持请求方法', category: 'redirection' },
  { code: 400, message: 'Bad Request', description: '服务器无法理解请求的格式', category: 'client-error' },
  { code: 401, message: 'Unauthorized', description: '请求需要身份验证', category: 'client-error' },
  { code: 403, message: 'Forbidden', description: '服务器拒绝请求', category: 'client-error' },
  { code: 404, message: 'Not Found', description: '请求的资源不存在', category: 'client-error' },
  { code: 405, message: 'Method Not Allowed', description: '请求方法不被允许', category: 'client-error' },
  { code: 408, message: 'Request Timeout', description: '服务器等待请求超时', category: 'client-error' },
  { code: 409, message: 'Conflict', description: '请求与服务器当前状态冲突', category: 'client-error' },
  { code: 410, message: 'Gone', description: '请求的资源已永久删除', category: 'client-error' },
  { code: 413, message: 'Payload Too Large', description: '请求实体过大', category: 'client-error' },
  { code: 414, message: 'URI Too Long', description: '请求的URI过长', category: 'client-error' },
  { code: 415, message: 'Unsupported Media Type', description: '不支持的媒体类型', category: 'client-error' },
  { code: 422, message: 'Unprocessable Entity', description: '请求格式正确，但语义错误', category: 'client-error' },
  { code: 429, message: 'Too Many Requests', description: '请求过于频繁', category: 'client-error' },
  { code: 500, message: 'Internal Server Error', description: '服务器内部错误', category: 'server-error' },
  { code: 501, message: 'Not Implemented', description: '服务器不支持请求的功能', category: 'server-error' },
  { code: 502, message: 'Bad Gateway', description: '网关错误', category: 'server-error' },
  { code: 503, message: 'Service Unavailable', description: '服务暂时不可用', category: 'server-error' },
  { code: 504, message: 'Gateway Timeout', description: '网关超时', category: 'server-error' },
]

export function searchHttpStatus(query: string): HttpStatus[] {
  const q = query.toLowerCase()
  return HTTP_STATUS_CODES.filter(
    s => s.code.toString() === query ||
         s.message.toLowerCase().includes(q) ||
         s.description.includes(q)
  )
}

export interface HttpHeader {
  name: string
  category: 'request' | 'response' | 'entity' | 'general'
  description: string
  example?: string
}

export const HTTP_HEADERS: HttpHeader[] = [
  { name: 'Accept', category: 'request', description: '客户端可接受的响应内容类型', example: 'Accept: text/html, application/json' },
  { name: 'Accept-Encoding', category: 'request', description: '客户端可接受的内容编码方式', example: 'Accept-Encoding: gzip, deflate, br' },
  { name: 'Accept-Language', category: 'request', description: '客户端可接受的自然语言', example: 'Accept-Language: zh-CN, en;q=0.9' },
  { name: 'Authorization', category: 'request', description: '身份验证凭据', example: 'Authorization: Bearer <token>' },
  { name: 'Cache-Control', category: 'general', description: '缓存控制指令', example: 'Cache-Control: max-age=3600' },
  { name: 'Content-Type', category: 'entity', description: '请求体的媒体类型', example: 'Content-Type: application/json' },
  { name: 'Content-Length', category: 'entity', description: '请求体的大小（字节）', example: 'Content-Length: 1234' },
  { name: 'Content-Encoding', category: 'entity', description: '内容的编码方式', example: 'Content-Encoding: gzip' },
  { name: 'Cookie', category: 'request', description: '发送给服务器的Cookie', example: 'Cookie: session=abc123' },
  { name: 'Host', category: 'request', description: '请求的目标主机', example: 'Host: example.com' },
  { name: 'User-Agent', category: 'request', description: '客户端信息', example: 'User-Agent: Mozilla/5.0...' },
  { name: 'Content-Security-Policy', category: 'response', description: '内容安全策略', example: "Content-Security-Policy: default-src 'self'" },
  { name: 'ETag', category: 'response', description: '资源的版本标识', example: 'ETag: "abc123"' },
  { name: 'Location', category: 'response', description: '重定向目标URL', example: 'Location: https://example.com/new' },
  { name: 'Server', category: 'response', description: '服务器软件信息', example: 'Server: nginx/1.18.0' },
  { name: 'Set-Cookie', category: 'response', description: '设置Cookie', example: 'Set-Cookie: session=abc123; HttpOnly' },
  { name: 'Strict-Transport-Security', category: 'response', description: 'HSTS，强制使用HTTPS', example: 'Strict-Transport-Security: max-age=31536000' },
  { name: 'X-Content-Type-Options', category: 'response', description: '防止MIME类型嗅探', example: 'X-Content-Type-Options: nosniff' },
  { name: 'X-Frame-Options', category: 'response', description: '防止点击劫持', example: 'X-Frame-Options: DENY' },
  { name: 'X-XSS-Protection', category: 'response', description: 'XSS保护', example: 'X-XSS-Protection: 1; mode=block' },
]

export function searchHttpHeaders(query: string): HttpHeader[] {
  const q = query.toLowerCase()
  return HTTP_HEADERS.filter(
    h => h.name.toLowerCase().includes(q) ||
         h.description.includes(q) ||
         h.category.includes(q)
  )
}

export interface MimeType {
  extension: string
  mimeType: string
  description: string
}

export const MIME_TYPES: MimeType[] = [
  { extension: '.json', mimeType: 'application/json', description: 'JSON 数据' },
  { extension: '.xml', mimeType: 'application/xml', description: 'XML 文档' },
  { extension: '.html', mimeType: 'text/html', description: 'HTML 文档' },
  { extension: '.css', mimeType: 'text/css', description: 'CSS 样式表' },
  { extension: '.js', mimeType: 'application/javascript', description: 'JavaScript 脚本' },
  { extension: '.ts', mimeType: 'application/typescript', description: 'TypeScript 脚本' },
  { extension: '.png', mimeType: 'image/png', description: 'PNG 图片' },
  { extension: '.jpg', mimeType: 'image/jpeg', description: 'JPEG 图片' },
  { extension: '.jpeg', mimeType: 'image/jpeg', description: 'JPEG 图片' },
  { extension: '.gif', mimeType: 'image/gif', description: 'GIF 图片' },
  { extension: '.svg', mimeType: 'image/svg+xml', description: 'SVG 矢量图' },
  { extension: '.webp', mimeType: 'image/webp', description: 'WebP 图片' },
  { extension: '.ico', mimeType: 'image/x-icon', description: '图标文件' },
  { extension: '.pdf', mimeType: 'application/pdf', description: 'PDF 文档' },
  { extension: '.zip', mimeType: 'application/zip', description: 'ZIP 压缩包' },
  { extension: '.tar', mimeType: 'application/x-tar', description: 'TAR 归档' },
  { extension: '.gz', mimeType: 'application/gzip', description: 'GZIP 压缩' },
  { extension: '.mp3', mimeType: 'audio/mpeg', description: 'MP3 音频' },
  { extension: '.mp4', mimeType: 'video/mp4', description: 'MP4 视频' },
  { extension: '.webm', mimeType: 'video/webm', description: 'WebM 视频' },
  { extension: '.woff', mimeType: 'font/woff', description: 'WOFF 字体' },
  { extension: '.woff2', mimeType: 'font/woff2', description: 'WOFF2 字体' },
  { extension: '.ttf', mimeType: 'font/ttf', description: 'TrueType 字体' },
  { extension: '.otf', mimeType: 'font/otf', description: 'OpenType 字体' },
  { extension: '.csv', mimeType: 'text/csv', description: 'CSV 表格' },
  { extension: '.txt', mimeType: 'text/plain', description: '纯文本' },
  { extension: '.md', mimeType: 'text/markdown', description: 'Markdown 文档' },
  { extension: '.yaml', mimeType: 'application/x-yaml', description: 'YAML 文档' },
  { extension: '.yml', mimeType: 'application/x-yaml', description: 'YAML 文档' },
  { extension: '.toml', mimeType: 'application/toml', description: 'TOML 文档' },
]

export function searchMimeTypes(query: string): MimeType[] {
  const q = query.toLowerCase()
  return MIME_TYPES.filter(
    m => m.extension.includes(q) ||
         m.mimeType.includes(q) ||
         m.description.includes(q)
  )
}

export interface SubnetResult {
  networkAddress: string
  broadcastAddress: string
  firstHost: string
  lastHost: string
  totalHosts: number
  usableHosts: number
  subnetMask: string
  cidr: number
}

export function calculateSubnet(ip: string, cidr: number): Result<SubnetResult> {
  try {
    const parts = ip.split('.').map(Number)
    if (parts.length !== 4 || parts.some(p => isNaN(p) || p < 0 || p > 255)) {
      return { ok: false, error: 'Invalid IP address' }
    }
    if (cidr < 0 || cidr > 32) {
      return { ok: false, error: 'CIDR must be between 0 and 32' }
    }
    
    const ipNum = (parts[0] << 24) + (parts[1] << 16) + (parts[2] << 8) + parts[3]
    const mask = cidr === 0 ? 0 : (~0 << (32 - cidr)) >>> 0
    const network = (ipNum & mask) >>> 0
    const broadcast = (network | (~mask >>> 0)) >>> 0
    
    const numToIp = (n: number) => [
      (n >>> 24) & 255,
      (n >>> 16) & 255,
      (n >>> 8) & 255,
      n & 255,
    ].join('.')
    
    const subnetMask = numToIp(mask)
    const totalHosts = Math.pow(2, 32 - cidr)
    const usableHosts = cidr >= 31 ? totalHosts : totalHosts - 2
    
    return {
      ok: true,
      value: {
        networkAddress: numToIp(network),
        broadcastAddress: numToIp(broadcast),
        firstHost: cidr >= 31 ? numToIp(network) : numToIp(network + 1),
        lastHost: cidr >= 31 ? numToIp(broadcast) : numToIp(broadcast - 1),
        totalHosts,
        usableHosts,
        subnetMask,
        cidr,
      },
    }
  } catch (e) {
    return { ok: false, error: (e as Error).message }
  }
}

export interface UaResult {
  browser: { name: string; version: string }
  os: { name: string; version: string }
  device: { type: string; vendor: string; model: string }
  engine: { name: string; version: string }
  cpu: { architecture: string }
}

export function parseUserAgent(ua: string): UaResult {
  const parser = new UAParser(ua)
  const result = parser.getResult()
  
  return {
    browser: {
      name: result.browser.name || '',
      version: result.browser.version || '',
    },
    os: {
      name: result.os.name || '',
      version: result.os.version || '',
    },
    device: {
      type: result.device.type || 'desktop',
      vendor: result.device.vendor || '',
      model: result.device.model || '',
    },
    engine: {
      name: result.engine.name || '',
      version: result.engine.version || '',
    },
    cpu: {
      architecture: result.cpu.architecture || '',
    },
  }
}

export interface CurlConversion {
  fetch: string
  axios: string
  python: string
  go: string
  php: string
}

export function convertCurl(curlCommand: string): Result<CurlConversion> {
  try {
    const trimmed = curlCommand.trim()
    if (!trimmed.startsWith('curl')) {
      return { ok: false, error: 'Command must start with "curl"' }
    }
    
    const cc = curlConverter as unknown as Record<string, (cmd: string) => string>
    return {
      ok: true,
      value: {
        fetch: cc.toFetch(trimmed),
        axios: cc.toAxios(trimmed),
        python: cc.toPython(trimmed),
        go: cc.toGo(trimmed),
        php: cc.toPhp(trimmed),
      },
    }
  } catch (e) {
    return { ok: false, error: 'Failed to parse cURL command: ' + (e as Error).message }
  }
}

export const TIMEZONES = [
  { value: 'Asia/Shanghai', label: '北京时间 (UTC+8)', offset: 8 },
  { value: 'Asia/Tokyo', label: '东京 (UTC+9)', offset: 9 },
  { value: 'Asia/Seoul', label: '首尔 (UTC+9)', offset: 9 },
  { value: 'Asia/Singapore', label: '新加坡 (UTC+8)', offset: 8 },
  { value: 'Asia/Hong_Kong', label: '香港 (UTC+8)', offset: 8 },
  { value: 'Asia/Dubai', label: '迪拜 (UTC+4)', offset: 4 },
  { value: 'Europe/London', label: '伦敦 (UTC+0/+1)', offset: 0 },
  { value: 'Europe/Paris', label: '巴黎 (UTC+1/+2)', offset: 1 },
  { value: 'Europe/Berlin', label: '柏林 (UTC+1/+2)', offset: 1 },
  { value: 'Europe/Moscow', label: '莫斯科 (UTC+3)', offset: 3 },
  { value: 'America/New_York', label: '纽约 (UTC-5/-4)', offset: -5 },
  { value: 'America/Los_Angeles', label: '洛杉矶 (UTC-8/-7)', offset: -8 },
  { value: 'America/Chicago', label: '芝加哥 (UTC-6/-5)', offset: -6 },
  { value: 'America/Sao_Paulo', label: '圣保罗 (UTC-3)', offset: -3 },
  { value: 'Australia/Sydney', label: '悉尼 (UTC+10/+11)', offset: 10 },
  { value: 'Pacific/Auckland', label: '奥克兰 (UTC+12/+13)', offset: 12 },
  { value: 'UTC', label: 'UTC', offset: 0 },
]
