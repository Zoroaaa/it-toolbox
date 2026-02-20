import Fuse from 'fuse.js'
import type { ToolMeta } from '@toolbox/types/tool'

export const toolRegistry: ToolMeta[] = [
  // ─── Phase 1: 高频工具首批 (15个) ───────────────────────────────────────────

  // Format
  {
    id: 'json-formatter',
    name: 'JSON 格式化',
    nameEn: 'JSON Formatter',
    description: '格式化、压缩、校验 JSON 数据，支持语法高亮，缩进可选',
    category: 'format',
    tags: ['json', 'format', 'validate', 'prettify', 'minify'],
    keywords: ['大括号', 'object', '对象', '压缩'],
    icon: 'Braces',
  },
  {
    id: 'markdown-preview',
    name: 'Markdown 预览',
    nameEn: 'Markdown Preview',
    description: '实时渲染 Markdown，支持 GFM、数学公式、代码高亮，导出 HTML',
    category: 'format',
    tags: ['markdown', 'preview', 'md', 'gfm', 'render'],
    keywords: ['md', '文档', '渲染'],
    icon: 'FileText',
  },

  // Encoding
  {
    id: 'base64',
    name: 'Base64 编解码',
    nameEn: 'Base64 Encoder/Decoder',
    description: '文本 Base64/Base64URL 编解码，支持文件转 Base64',
    category: 'encoding',
    tags: ['base64', 'encode', 'decode', 'base64url'],
    keywords: ['编码', '解码', '二进制'],
    icon: 'Binary',
  },
  {
    id: 'url-encode',
    name: 'URL 编解码',
    nameEn: 'URL Encoder/Decoder',
    description: 'encodeURIComponent/完整 URL 编解码，参数解析',
    category: 'encoding',
    tags: ['url', 'encode', 'decode', 'percent', 'uri'],
    keywords: ['链接', '参数', '转义'],
    icon: 'Link',
  },
  {
    id: 'jwt-decoder',
    name: 'JWT 解析',
    nameEn: 'JWT Decoder',
    description: '解析 Header/Payload，时间戳转人类时间，高亮过期',
    category: 'encoding',
    tags: ['jwt', 'token', 'decode', 'auth', 'json web token'],
    keywords: ['令牌', '认证', '身份'],
    icon: 'KeyRound',
  },

  // Crypto
  {
    id: 'hash-calculator',
    name: 'Hash 计算器',
    nameEn: 'Hash Calculator',
    description: 'MD5/SHA-1/SHA-256/SHA-384/SHA-512 哈希计算，支持文本和文件',
    category: 'crypto',
    tags: ['hash', 'md5', 'sha', 'sha256', 'sha512', 'checksum'],
    keywords: ['哈希', '摘要', '校验'],
    icon: 'Hash',
  },
  {
    id: 'password-gen',
    name: '密码生成器',
    nameEn: 'Password Generator',
    description: '可配置字符集、长度、数量，强度可视化，批量导出',
    category: 'crypto',
    tags: ['password', 'generate', 'random', 'secure', 'strong'],
    keywords: ['密码', '随机', '安全'],
    icon: 'KeySquare',
  },

  // Generator
  {
    id: 'uuid-generator',
    name: 'UUID 生成器',
    nameEn: 'UUID Generator',
    description: 'UUID v4 批量生成（最多1000），大写/小写/带连字符可选',
    category: 'generator',
    tags: ['uuid', 'generate', 'unique', 'id', 'guid', 'v4'],
    keywords: ['唯一', '标识符', 'GUID'],
    icon: 'Fingerprint',
  },

  // Datetime
  {
    id: 'timestamp',
    name: '时间戳转换',
    nameEn: 'Timestamp Converter',
    description: 'Unix 时间戳与日期时间互转，支持毫秒/秒，全球时区',
    category: 'datetime',
    tags: ['timestamp', 'unix', 'datetime', 'timezone', 'convert'],
    keywords: ['时间', '日期', '时区'],
    icon: 'Clock',
  },

  // Text
  {
    id: 'case-converter',
    name: '命名规范转换',
    nameEn: 'Case Converter',
    description: 'camelCase/PascalCase/snake_case/kebab-case/CONSTANT 等互转',
    category: 'text',
    tags: ['case', 'camel', 'snake', 'pascal', 'kebab', 'convert'],
    keywords: ['大小写', '命名', '格式'],
    icon: 'CaseSensitive',
  },
  {
    id: 'lorem-ipsum',
    name: '占位文本生成',
    nameEn: 'Lorem Ipsum Generator',
    description: '英文 Lorem/中文乱数假文，段落数/单词数可配置',
    category: 'text',
    tags: ['lorem', 'ipsum', 'placeholder', 'dummy', 'text', '中文'],
    keywords: ['假文', '测试', '填充'],
    icon: 'AlignLeft',
  },
  {
    id: 'regex-tester',
    name: '正则表达式测试',
    nameEn: 'Regex Tester',
    description: '实时高亮匹配，分组提取，多行模式，常用正则库',
    category: 'text',
    tags: ['regex', 'regexp', 'test', 'match', 'pattern'],
    keywords: ['正则', '匹配', '模式'],
    icon: 'Regex',
  },
  {
    id: 'text-counter',
    name: '文本统计',
    nameEn: 'Text Counter',
    description: '字符数/单词数/行数/字节数/阅读时间估算',
    category: 'text',
    tags: ['text', 'count', 'character', 'word', 'line', 'byte'],
    keywords: ['统计', '字数', '计数'],
    icon: 'TextCursor',
  },

  // Color
  {
    id: 'color-picker',
    name: '颜色选择器',
    nameEn: 'Color Picker',
    description: 'HEX/RGB/HSL/HSV/CMYK 互转，色盘可视化',
    category: 'color',
    tags: ['color', 'picker', 'hex', 'rgb', 'hsl', 'cmyk', 'convert'],
    keywords: ['颜色', '色彩', '调色'],
    icon: 'Palette',
  },

  // Converter
  {
    id: 'number-base',
    name: '进制转换',
    nameEn: 'Number Base Converter',
    description: '二/八/十/十六进制互转，按位操作可视化',
    category: 'converter',
    tags: ['binary', 'hex', 'octal', 'decimal', 'base', 'convert', 'radix'],
    keywords: ['二进制', '八进制', '十六进制'],
    icon: 'Binary',
  },

  // ─── Phase 2+: 后续阶段工具 ────────────────────────────────────────────────

  // Format
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

  // Encoding
  {
    id: 'html-encode',
    name: 'HTML 实体编解码',
    nameEn: 'HTML Entity Encoder',
    description: 'HTML 实体编码与解码',
    category: 'encoding',
    tags: ['html', 'entity', 'encode', 'decode', 'escape'],
    icon: 'Code2',
  },

  // Crypto
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

  // Network
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

  // Text
  {
    id: 'text-diff',
    name: '文本 Diff',
    nameEn: 'Text Diff',
    description: '对比两段文本的差异，高亮显示',
    category: 'text',
    tags: ['diff', 'compare', 'text', 'difference'],
    icon: 'GitCompare',
  },

  // Color
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

  // Generator
  {
    id: 'qrcode',
    name: '二维码生成',
    nameEn: 'QR Code Generator',
    description: '生成二维码，支持文本、URL、WiFi 等格式',
    category: 'generator',
    tags: ['qrcode', 'qr', 'generate', 'barcode'],
    icon: 'QrCode',
  },

  // Datetime
  {
    id: 'cron-parser',
    name: 'Cron 表达式解析',
    nameEn: 'Cron Parser',
    description: '解析和生成 Cron 表达式，显示下次执行时间',
    category: 'datetime',
    tags: ['cron', 'schedule', 'parse', 'expression'],
    icon: 'Timer',
  },

  // Converter
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

  // AI
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
