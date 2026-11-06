import Fuse from 'fuse.js'
import type { ToolMeta } from '@toolbox/types/tool'

/**
 * 工具清单的唯一事实源是各工具目录下的 `meta.ts`。
 * 本文件只保留「展示顺序」，不含任何元数据副本——新增工具不需要改这里。
 *
 * 排序规则：先按 DISPLAY_ORDER 的顺序，未登记的 id 按字典序排在末尾。
 */
const DISPLAY_ORDER: string[] = [
  // Phase 1：首批高频工具
  'json-formatter', 'markdown-preview', 'base64', 'url-encode',
  'jwt-decoder', 'hash-calculator', 'uuid-generator', 'password-gen',
  'timestamp', 'case-converter', 'lorem-ipsum', 'regex-tester',
  'text-counter', 'color-picker', 'number-base',

  // Phase 2：核心工具矩阵
  'yaml-json', 'sql-formatter', 'xml-formatter', 'css-formatter',
  'js-formatter', 'toml-json', 'csv-viewer', 'html-entities',
  'hex-encode', 'unicode-convert', 'morse-code', 'binary-text',
  'rot13', 'punycode', 'ascii-table', 'aes-encrypt',
  'rsa-keygen', 'hmac', 'bcrypt', 'ssh-keygen',
  'jwt-generator', 'ip-lookup', 'dns-lookup', 'url-parser',
  'http-status', 'http-headers', 'mime-types', 'ip-subnet',
  'user-agent', 'curl-converter', 'text-diff', 'text-transform',
  'string-escape', 'cron-parser', 'text-similarity', 'line-sorter',
  'json-to-type', 'css-gradient', 'color-palette', 'contrast-checker',
  'color-blindness', 'tailwind-colors', 'box-shadow-gen', 'cert-decoder',
  'date-calc', 'timezone-convert', 'duration-format', 'calendar-gen',
  'nanoid-gen', 'ulid-gen', 'objectid-gen', 'faker-data',
  'qrcode', 'placeholder-img',

  // Phase 3：进阶工具
  'ai-regex', 'ai-sql', 'ai-code-explain', 'ai-code-review',
  'json-path', 'json-to-csv', 'math-eval', 'html-preview',
  'meta-tag-gen', 'image-compress', 'image-convert', 'image-resize',
  'svg-optimizer', 'svg-to-data-uri', 'favicon-gen', 'exif-reader',
  'color-extractor', 'gitignore-gen', 'license-gen', 'readme-gen',
  'conventional-commit', 'semver-calc', 'openapi-viewer', 'json-schema-gen',
  'exchange-rate', 'api-playground', 'qrcode-reader', 'hash-verify',
  'jwt-verifier', 'password-strength', 'json-gen', 'number-unit',
  'data-storage', 'sql-gen', 'regex-gen', 'color-space',
  'epoch-formats', 'aspect-ratio', 'css-unit-convert', 'roman-numeral',
  'port-reference', 'email-validate', 'prime-checker', 'gcd-lcm',
  'whois-lookup', 'ssl-checker', 'headers-check', 'float-visualizer',
  'base-convert-ext', 'json-to-table', 'json-merge', 'json-schema-verify',
  'css-clip-path', 'flexbox-gen', 'barcode-gen',

  // Phase 4：AI 增强与效率协作
  'ai-json-schema', 'ai-commit-msg', 'ai-text-extract', 'ai-translate',
  'ai-error-explain', 'ai-naming', 'ai-mock-data', 'ai-shell-cmd',
  'env-diff', 'changelog-gen', 'json-rpc-test', 'grid-generator',
  'icon-search', 'animation-gen', 'font-pair', 'sitemap-gen',
  'robots-gen', 'htaccess-gen', 'batch-process', 'tool-compare',
]

const metaModules = import.meta.glob<{ meta: ToolMeta }>('@/tools/*/meta.ts', { eager: true })

const rankOf = new Map(DISPLAY_ORDER.map((id, index) => [id, index]))

/** 未登记顺序的工具排在最后，并按 id 字典序稳定输出 */
const rank = (id: string) => rankOf.get(id) ?? Number.MAX_SAFE_INTEGER

export const toolRegistry: ToolMeta[] = Object.values(metaModules)
  .map((mod) => mod.meta)
  .sort((a, b) => rank(a.id) - rank(b.id) || a.id.localeCompare(b.id))

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
