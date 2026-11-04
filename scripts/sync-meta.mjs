#!/usr/bin/env node
/**
 * 以 registry.ts 为唯一事实来源，同步各工具 meta.ts 的 name / icon / category。
 * 用法：node scripts/sync-meta.mjs [--check]
 */
import { readdirSync, readFileSync, writeFileSync, statSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const toolsDir = join(root, 'src', 'tools')
const registryPath = join(root, 'src', 'registry.ts')

const read = (p) => readFileSync(p, 'utf8')
const field = (source, name) => {
  const m = source.match(new RegExp(`${name}:\\s*'((?:\\\\.|[^'\\\\])*)'`))
  return m ? m[1].replace(/\\'/g, "'") : undefined
}

const normalized = read(registryPath).replace(/\r\n/g, '\n')
const registry = new Map()
for (const chunk of normalized.split(/\n {2}\{\n/).slice(1)) {
  const id = field(chunk, 'id')
  if (!id) continue
  registry.set(id, { name: field(chunk, 'name'), icon: field(chunk, 'icon'), category: field(chunk, 'category') })
}

const checkOnly = process.argv.includes('--check')
let changed = 0

for (const dir of readdirSync(toolsDir).filter((d) => statSync(join(toolsDir, d)).isDirectory())) {
  const reg = registry.get(dir)
  if (!reg) continue
  const file = join(toolsDir, dir, 'meta.ts')
  const before = read(file)
  let after = before
  for (const key of ['name', 'icon', 'category']) {
    if (!reg[key]) continue
    after = after.replace(new RegExp(`(${key}:\\s*)'(?:\\\\.|[^'\\\\])*'`), `$1'${reg[key]}'`)
  }
  if (after !== before) {
    changed += 1
    if (checkOnly) {
      console.log(`需同步：${dir}`)
    } else {
      writeFileSync(file, after)
      console.log(`已同步：${dir}`)
    }
  }
}

console.log(`\n${checkOnly ? '待同步' : '已同步'} ${changed} 个工具`)
process.exit(checkOnly && changed > 0 ? 1 : 0)
