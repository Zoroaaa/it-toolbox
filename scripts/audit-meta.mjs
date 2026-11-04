#!/usr/bin/env node
/**
 * 工具元数据一致性审计
 * 校验：目录 / meta.ts / registry.ts 三方一致；icon 合法；requiresApi 与 /api 调用一致；name 一致。
 * 用法：node scripts/audit-meta.mjs [--check]
 */
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const toolsDir = join(root, 'src', 'tools')
const registryPath = join(root, 'src', 'registry.ts')

const read = (p) => readFileSync(p, 'utf8').replace(/\r\n/g, '\n')

/** 取单引号字符串字段，忽略转义单引号 */
function field(source, name) {
  const m = source.match(new RegExp(`${name}:\\s*'((?:\\\\.|[^'\\\\])*)'`))
  return m ? m[1].replace(/\\'/g, "'") : undefined
}

function boolField(source, name) {
  return new RegExp(`${name}:\\s*true`).test(source)
}

const dirs = readdirSync(toolsDir).filter((d) => statSync(join(toolsDir, d)).isDirectory())

const metas = new Map()
for (const dir of dirs) {
  const metaPath = join(toolsDir, dir, 'meta.ts')
  const indexPath = join(toolsDir, dir, 'index.tsx')
  let meta
  try {
    meta = read(metaPath)
  } catch {
    console.error(`[缺失] ${dir}: meta.ts 不存在`)
    continue
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
      /fetch\(\s*['"`]\/api\/(ip|dns|ai|exchange|proxy|whois|ssl-check|headers-check|webhook)\b/.test(
        read(indexPath),
      ),
  })
}

const registrySource = read(registryPath)
const entryChunks = registrySource.split(/\n {2}\{\n/).slice(1)
const registry = new Map()
for (const chunk of entryChunks) {
  const id = field(chunk, 'id')
  if (!id) continue
  registry.set(id, {
    id,
    name: field(chunk, 'name'),
    nameEn: field(chunk, 'nameEn'),
    category: field(chunk, 'category'),
    icon: field(chunk, 'icon'),
    requiresApi: boolField(chunk, 'requiresApi'),
  })
}

const issues = []
const add = (level, message) => issues.push({ level, message })

for (const [dir, meta] of metas) {
  if (!registry.has(dir)) add('error', `有目录无注册：${dir}`)
  if (meta.id !== dir) add('error', `${dir}: meta.id='${meta.id}' 与目录名不一致`)
}
for (const id of registry.keys()) {
  if (!metas.has(id)) add('error', `有注册无目录：${id}`)
}

// icon 合法性（lucide 导出名）
const lucide = await import('lucide-react')
const lucideExports = new Set(Object.keys(lucide))
const typesSource = read(join(root, 'packages', 'types', 'tool.ts'))
const categoryIcons = [...typesSource.matchAll(/'\s*:\s*'([A-Za-z0-9]+)'/g)].map((m) => m[1])
for (const icon of new Set([...metas.values()].map((m) => m.icon).filter(Boolean))) {
  if (!lucideExports.has(icon)) add('error', `非法 icon：'${icon}'（不是 lucide-react 导出）`)
}
for (const icon of categoryIcons) {
  if (!lucideExports.has(icon)) add('error', `分类图标非法：'${icon}'`)
}

for (const [dir, meta] of metas) {
  const reg = registry.get(dir)
  if (!reg) continue
  if (reg.icon && !lucideExports.has(reg.icon)) add('error', `${dir}: registry icon '${reg.icon}' 非法`)
  if (meta.name !== reg.name) add('warn', `${dir}: name 不一致 meta='${meta.name}' registry='${reg.name}'`)
  if (meta.category !== reg.category) add('warn', `${dir}: category 不一致 meta='${meta.category}' registry='${reg.category}'`)
  if (reg.icon !== meta.icon) add('warn', `${dir}: icon 不一致 meta='${meta.icon}' registry='${reg.icon}'`)
  const needsApi = meta.callsApi || reg.requiresApi
  const flagged = Boolean(meta.requiresApi || reg.requiresApi)
  if (needsApi && !flagged) add('error', `${dir}: 调用 /api 但未标记 requiresApi`)
  if (!needsApi && flagged) add('warn', `${dir}: 标记 requiresApi 但未发现 /api 调用`)
}

const errors = issues.filter((i) => i.level === 'error')
const warns = issues.filter((i) => i.level === 'warn')

console.log(`目录 ${dirs.length} 个 / meta ${metas.size} 个 / registry ${registry.size} 条`)
if (issues.length === 0) {
  console.log('元数据一致，无问题。')
} else {
  for (const issue of issues) console.log(`${issue.level === 'error' ? 'ERROR' : 'WARN '} ${issue.message}`)
  console.log(`\n合计：${errors.length} error / ${warns.length} warning`)
}

const checkMode = process.argv.includes('--check')
process.exit(checkMode && errors.length > 0 ? 1 : 0)
