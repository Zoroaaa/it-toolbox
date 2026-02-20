import Fuse from 'fuse.js'
import type { ToolMeta } from '@toolbox/types/tool'

export const toolRegistry: ToolMeta[] = [
  // ─── Format ────────────────────────────────────────────────────────────────
  {
    id: 'json-formatter',
    name: 'JSON 格式化',
    nameEn: 'JSON Formatter',
    description: '格式化、压缩、校验 JSON 数据，支持语法高亮',
    category: 'format',
    tags: ['json', 'format', 'validate', 'prettify', 'minify'],
    keywords: ['大括号', 'object', '对象', '压缩'],
    icon: 'Braces',
  },
  {
    id: 'yaml-json',
    name: 'YAML ↔ JSON',
    nameEn: 'YAML JSON Converter',
    description: 'YAML 与 JSON 格式互转',
    category: 'format',
    tags: ['yaml', 'json', 'convert'],
    icon: 'ArrowLeftRight',
  },
  {
    id: 'sql-formatter',
    name: 'SQL 格式化',
    nameEn: 'SQL Formatter',
    description: '格式化和美化 SQL 语句，支持多种数据库方言',
    category: 'format',
    tags: ['sql', 'format', 'database', 'mysql', 'postgresql'],
    icon: 'Database',
  },
  {
    id: 'markdown-preview',
    name: 'Markdown 预览',
    nameEn: 'Markdown Preview',
    description: '实时预览 Markdown 渲染效果，支持 GFM',
    category: 'format',
    tags: ['markdown', 'preview', 'md', 'gfm'],
    icon: 'FileText',
  },

  // ─── Encoding ──────────────────────────────────────────────────────────────
  {
    id: 'base64',
    name: 'Base64 编解码',
    nameEn: 'Base64 Encoder/Decoder',
    description: 'Base64 文本编码与解码，支持文件转换',
    category: 'encoding',
    tags: ['base64', 'encode', 'decode'],
    icon: 'Binary',
  },
  {
    id: 'url-encode',
    name: 'URL 编解码',
    nameEn: 'URL Encoder/Decoder',
    description: 'URL 编码与解码，支持完整 URL 和组件',
    category: 'encoding',
    tags: ['url', 'encode', 'decode', 'percent'],
    icon: 'Link',
  },
  {
    id: 'jwt-decoder',
    name: 'JWT 解析',
    nameEn: 'JWT Decoder',
    description: '解析 JWT Token，查看 Header 和 Payload',
    category: 'encoding',
    tags: ['jwt', 'token', 'decode', 'auth'],
    icon: 'KeyRound',
  },
  {
    id: 'html-encode',
    name: 'HTML 实体编解码',
    nameEn: 'HTML Entity Encoder',
    description: 'HTML 实体编码与解码',
    category: 'encoding',
    tags: ['html', 'entity', 'encode', 'decode', 'escape'],
    icon: 'Code2',
  },

  // ─── Crypto ────────────────────────────────────────────────────────────────
  {
    id: 'hash',
    name: 'Hash 计算',
    nameEn: 'Hash Calculator',
    description: '计算 MD5、SHA-1、SHA-256、SHA-512 哈希值',
    category: 'crypto',
    tags: ['hash', 'md5', 'sha', 'sha256', 'sha512', 'checksum'],
    icon: 'Hash',
  },
  {
    id: 'aes',
    name: 'AES 加密解密',
    nameEn: 'AES Encrypt/Decrypt',
    description: 'AES-GCM 对称加密与解密',
    category: 'crypto',
    tags: ['aes', 'encrypt', 'decrypt', 'crypto', 'symmetric'],
    icon: 'Lock',
  },
  {
    id: 'rsa-keygen',
    name: 'RSA 密钥生成',
    nameEn: 'RSA Key Generator',
    description: '生成 RSA 密钥对，导出 PEM 格式',
    category: 'crypto',
    tags: ['rsa', 'key', 'generate', 'pem', 'asymmetric'],
    icon: 'ShieldCheck',
  },
  {
    id: 'password-generator',
    name: '密码生成器',
    nameEn: 'Password Generator',
    description: '生成安全随机密码，可自定义规则',
    category: 'crypto',
    tags: ['password', 'generate', 'random', 'secure'],
    icon: 'KeySquare',
  },

  // ─── Network ───────────────────────────────────────────────────────────────
  {
    id: 'ip-lookup',
    name: 'IP 地址查询',
    nameEn: 'IP Lookup',
    description: '查询 IP 地址的地理位置、ASN 等信息',
    category: 'network',
    tags: ['ip', 'lookup', 'geo', 'asn', 'location'],
    icon: 'Globe',
    requiresApi: true,
  },
  {
    id: 'dns-lookup',
    name: 'DNS 查询',
    nameEn: 'DNS Lookup',
    description: '查询域名的 A、AAAA、MX、TXT、CNAME 记录',
    category: 'network',
    tags: ['dns', 'lookup', 'domain', 'mx', 'txt', 'cname'],
    icon: 'Search',
    requiresApi: true,
  },
  {
    id: 'url-parser',
    name: 'URL 解析',
    nameEn: 'URL Parser',
    description: '解析 URL 的各个组成部分',
    category: 'network',
    tags: ['url', 'parse', 'query', 'path', 'hostname'],
    icon: 'Unlink',
  },
  {
    id: 'http-status',
    name: 'HTTP 状态码',
    nameEn: 'HTTP Status Codes',
    description: '查询 HTTP 状态码的含义和说明',
    category: 'network',
    tags: ['http', 'status', 'code', '404', '500', '200'],
    icon: 'Activity',
  },

  // ─── Text ──────────────────────────────────────────────────────────────────
  {
    id: 'text-diff',
    name: '文本 Diff',
    nameEn: 'Text Diff',
    description: '对比两段文本的差异，高亮显示',
    category: 'text',
    tags: ['diff', 'compare', 'text', 'difference'],
    icon: 'GitCompare',
  },
  {
    id: 'case-converter',
    name: '大小写转换',
    nameEn: 'Case Converter',
    description: 'camelCase、snake_case、PascalCase 等多种命名规范互转',
    category: 'text',
    tags: ['case', 'camel', 'snake', 'pascal', 'kebab', 'convert'],
    icon: 'CaseSensitive',
  },
  {
    id: 'regex-tester',
    name: '正则表达式测试',
    nameEn: 'Regex Tester',
    description: '实时测试正则表达式，高亮匹配结果',
    category: 'text',
    tags: ['regex', 'regexp', 'test', 'match', 'pattern'],
    icon: 'Regex',
  },
  {
    id: 'lorem-ipsum',
    name: 'Lorem Ipsum 生成',
    nameEn: 'Lorem Ipsum Generator',
    description: '生成占位文本，支持中英文',
    category: 'text',
    tags: ['lorem', 'ipsum', 'placeholder', 'dummy', 'text'],
    icon: 'AlignLeft',
  },

  // ─── Color ─────────────────────────────────────────────────────────────────
  {
    id: 'color-converter',
    name: '颜色格式转换',
    nameEn: 'Color Converter',
    description: 'HEX、RGB、HSL、HSV、CMYK 颜色格式互转',
    category: 'color',
    tags: ['color', 'hex', 'rgb', 'hsl', 'hsv', 'cmyk', 'convert'],
    icon: 'Palette',
  },
  {
    id: 'gradient-generator',
    name: 'CSS 渐变生成器',
    nameEn: 'CSS Gradient Generator',
    description: '可视化生成 CSS 渐变代码',
    category: 'color',
    tags: ['gradient', 'css', 'linear', 'radial', 'color'],
    icon: 'Blend',
  },

  // ─── Generator ─────────────────────────────────────────────────────────────
  {
    id: 'uuid-generator',
    name: 'UUID 生成器',
    nameEn: 'UUID Generator',
    description: '批量生成 UUID v4，支持多种格式',
    category: 'generator',
    tags: ['uuid', 'generate', 'unique', 'id', 'guid'],
    icon: 'Fingerprint',
  },
  {
    id: 'qrcode',
    name: '二维码生成',
    nameEn: 'QR Code Generator',
    description: '生成二维码，支持文本、URL、WiFi 等格式',
    category: 'generator',
    tags: ['qrcode', 'qr', 'generate', 'barcode'],
    icon: 'QrCode',
  },

  // ─── Datetime ──────────────────────────────────────────────────────────────
  {
    id: 'timestamp',
    name: '时间戳转换',
    nameEn: 'Timestamp Converter',
    description: 'Unix 时间戳与日期时间互转，支持全球时区',
    category: 'datetime',
    tags: ['timestamp', 'unix', 'datetime', 'timezone', 'convert'],
    icon: 'Clock',
  },
  {
    id: 'cron-parser',
    name: 'Cron 表达式解析',
    nameEn: 'Cron Parser',
    description: '解析和生成 Cron 表达式，显示下次执行时间',
    category: 'datetime',
    tags: ['cron', 'schedule', 'parse', 'expression'],
    icon: 'Timer',
  },

  // ─── Converter ─────────────────────────────────────────────────────────────
  {
    id: 'number-base',
    name: '进制转换',
    nameEn: 'Number Base Converter',
    description: '二进制、八进制、十进制、十六进制互转',
    category: 'converter',
    tags: ['binary', 'hex', 'octal', 'decimal', 'base', 'convert'],
    icon: 'Hash',
  },
  {
    id: 'exchange-rate',
    name: '汇率换算',
    nameEn: 'Exchange Rate',
    description: '实时汇率换算，支持全球主要货币',
    category: 'converter',
    tags: ['exchange', 'rate', 'currency', 'usd', 'cny'],
    icon: 'DollarSign',
    requiresApi: true,
    isNew: true,
  },

  // ─── AI ────────────────────────────────────────────────────────────────────
  {
    id: 'ai-code-explain',
    name: 'AI 代码解释',
    nameEn: 'AI Code Explainer',
    description: '用 AI 解释代码逻辑，支持多种编程语言',
    category: 'ai',
    tags: ['ai', 'code', 'explain', 'llm'],
    icon: 'Sparkles',
    requiresApi: true,
    isNew: true,
  },
  {
    id: 'ai-regex',
    name: 'AI 生成正则',
    nameEn: 'AI Regex Generator',
    description: '用自然语言描述，AI 生成对应的正则表达式',
    category: 'ai',
    tags: ['ai', 'regex', 'generate', 'natural language'],
    icon: 'Wand2',
    requiresApi: true,
    isNew: true,
  },
]

// Build Fuse.js search index at startup
export const searchIndex = new Fuse(toolRegistry, {
  keys: [
    { name: 'name',        weight: 0.4 },
    { name: 'nameEn',      weight: 0.3 },
    { name: 'tags',        weight: 0.2 },
    { name: 'description', weight: 0.05 },
    { name: 'keywords',    weight: 0.05 },
  ],
  threshold: 0.35,
  includeScore: true,
})

export function searchTools(query: string): ToolMeta[] {
  if (!query.trim()) return toolRegistry
  return searchIndex.search(query).map(r => r.item)
}

export function getToolsByCategory(category: string): ToolMeta[] {
  return toolRegistry.filter(t => t.category === category)
}

export function getToolById(id: string): ToolMeta | undefined {
  return toolRegistry.find(t => t.id === id)
}
