#!/usr/bin/env node
/**
 * 工具元数据一致性审计
 *
 * 校验：目录 ↔ meta.ts 一致；id 唯一；icon 合法；category 合法；requiresApi 与 /api 调用一致。
 * registry 不再参与校验——工具清单由 meta.ts 聚合（见 src/registry.ts），双源已消除，
 * 因此 name/category/icon 的「双源漂移」在结构上不再可能发生。
 *
 * 用法：node scripts/audit-meta.mjs [--check]
 */
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const toolsDir = join(root, 'src', 'tools')
const typesPath = join(root, 'packages', 'types', 'tool.ts')

const read = (p) => readFileSync(p, 'utf8').replace(/\r\n/g, '\n')

/** 取单引号字符串字段，忽略转义单引号 */
function field(source, name) {
  const m = source.match(new RegExp(`${name}:\\s*'((?:\\\\.|[^'\\\\])*)'`))
  return m ? m[1].replace(/\\'/g, "'") : undefined
}

function boolField(source, name) {
  return new RegExp(`${name}:\\s*true`).test(source)
}

const typesSource = read(typesPath)
/** CATEGORY_LABELS 的键即合法分类 */
const validCategories = new Set(
  [...typesSource.matchAll(/^\s{2}([a-z]+):\s*'[^']+',$/gm)].map((m) => m[1]),
)

const dirs = readdirSync(toolsDir).filter((d) => statSync(join(toolsDir, d)).isDirectory())

const issues = []
const add = (level, message) => issues.push({ level, message })

const metas = new Map()
for (const dir of dirs) {
  const metaPath = join(toolsDir, dir, 'meta.ts')
  const indexPath = join(toolsDir, dir, 'index.tsx')
  let meta
  try {
    meta = read(metaPath)
  } catch {
    add('error', `${dir}: meta.ts 不存在`)
    continue
  }
  try {
    statSync(indexPath)
  } catch {
    add('error', `${dir}: index.tsx 不存在`)
  }

  metas.set(dir, {
    dir,
    id: field(meta, 'id'),
    name: field(meta, 'name'),
    nameEn: field(meta, 'nameEn'),
    category: field(meta, 'category'),
    icon: field(meta, 'icon'),
    requiresApi: boolField(meta, 'requiresApi'),
    callsApi:
      /fetch\(\s*['"`]\/api\/(ip|dns|ai|exchange|proxy|whois|ssl-check|headers-check)\b/.test(
        read(indexPath),
      ),
  })
}

for (const [dir, meta] of metas) {
  if (meta.id !== dir) add('error', `${dir}: meta.id='${meta.id}' 与目录名不一致`)
  if (!meta.name) add('error', `${dir}: 缺少 name`)
  if (!meta.nameEn) add('error', `${dir}: 缺少 nameEn`)
  if (!meta.category) add('error', `${dir}: 缺少 category`)
  else if (!validCategories.has(meta.category)) {
    add('error', `${dir}: category='${meta.category}' 不是合法分类`)
  }
}

const seen = new Map()
for (const [dir, meta] of metas) {
  if (!meta.id) continue
  if (seen.has(meta.id)) add('error', `id 重复：'${meta.id}'（${seen.get(meta.id)} 与 ${dir}）`)
  else seen.set(meta.id, dir)
}

// icon 合法性（lucide 导出名）
const lucide = await import('lucide-react')
const lucideExports = new Set(Object.keys(lucide))
const categoryIcons = [...typesSource.matchAll(/'\s*:\s*'([A-Za-z0-9]+)'/g)].map((m) => m[1])

for (const icon of new Set([...metas.values()].map((m) => m.icon).filter(Boolean))) {
  if (!lucideExports.has(icon)) add('error', `非法 icon：'${icon}'（不是 lucide-react 导出）`)
}
for (const icon of categoryIcons) {
  if (!lucideExports.has(icon)) add('error', `分类图标非法：'${icon}'`)
}

for (const [dir, meta] of metas) {
  const needsApi = meta.callsApi || meta.requiresApi
  const flagged = Boolean(meta.requiresApi)
  if (needsApi && !flagged) add('error', `${dir}: 调用 /api 但未标记 requiresApi`)
  if (!needsApi && flagged) add('warn', `${dir}: 标记 requiresApi 但未发现 /api 调用`)
}

const errors = issues.filter((i) => i.level === 'error')
const warns = issues.filter((i) => i.level === 'warn')

console.log(`目录 ${dirs.length} 个 / meta ${metas.size} 个 / 合法分类 ${validCategories.size} 个`)
if (issues.length === 0) {
  console.log('元数据一致，无问题。')
} else {
  for (const issue of issues) console.log(`${issue.level === 'error' ? 'ERROR' : 'WARN '} ${issue.message}`)
  console.log(`\n合计：${errors.length} error / ${warns.length} warning`)
}

const checkMode = process.argv.includes('--check')
process.exit(checkMode && errors.length > 0 ? 1 : 0)
