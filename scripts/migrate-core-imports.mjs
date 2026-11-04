#!/usr/bin/env node
/**
 * 把 `@core` / `@it-toolbox/core` barrel 导入改写为具体子模块导入。
 * 用法：node scripts/migrate-core-imports.mjs [--dry-run]
 */
import { readdirSync, readFileSync, writeFileSync, statSync } from 'node:fs'
import { join, dirname, basename } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const coreDir = join(root, 'packages', 'core')
const srcDir = join(root, 'src')
const dryRun = process.argv.includes('--dry-run')

const moduleFiles = readdirSync(coreDir).filter(
  (f) => f.endsWith('.ts') && f !== 'index.ts',
)

/** 符号 -> 模块名 */
const exportMap = new Map()
for (const file of moduleFiles) {
  const source = readFileSync(join(coreDir, file), 'utf8')
  const moduleName = basename(file, '.ts')
  const regex = /^export\s+(?:async\s+)?(?:function|const|interface|type|class)\s+([A-Za-z0-9_]+)/gm
  for (const match of source.matchAll(regex)) {
    exportMap.set(match[1], moduleName)
  }
}

function walk(dir) {
  const files = []
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry)
    if (statSync(full).isDirectory()) files.push(...walk(full))
    else if (/\.(ts|tsx)$/.test(entry)) files.push(full)
  }
  return files
}

const importRe = /import\s+(type\s+)?\{([^}]+)\}\s+from\s+['"](?:@core|@core\/index|@it-toolbox\/core)['"];?/g

let changedFiles = 0
let unknown = []

for (const file of walk(srcDir)) {
  const before = readFileSync(file, 'utf8')
  const after = before.replace(importRe, (full, typeKeyword, specifiers) => {
    const items = specifiers
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)
      .map((spec) => {
        const isType = spec.startsWith('type ')
        const clean = isType ? spec.slice(5).trim() : spec
        const name = clean.split(/\s+as\s+/)[0].trim()
        return { spec, name, isType }
      })

    const groups = new Map()
    for (const item of items) {
      const mod = exportMap.get(item.name)
      if (!mod) {
        unknown.push(`${file}: ${item.name}`)
        return full
      }
      if (!groups.has(mod)) groups.set(mod, [])
      groups.get(mod).push(item)
    }

    const lines = [...groups.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([mod, group]) => {
        const allType = Boolean(typeKeyword) || group.every((g) => g.isType)
        const specs = group.map((g) => g.spec.replace(/^type\s+/, '')).join(', ')
        return `import ${allType ? 'type ' : ''}{ ${specs} } from '@core/${mod}'`
      })

    return lines.join('\n')
  })

  if (after !== before) {
    changedFiles += 1
    if (dryRun) {
      console.log(`[dry-run] ${file}`)
    } else {
      writeFileSync(file, after)
      console.log(`rewritten ${file}`)
    }
  }
}

console.log(`\n${dryRun ? '待改写' : '已改写'} ${changedFiles} 个文件`)
if (unknown.length) {
  console.warn(`\n未能解析的符号 ${unknown.length} 个：`)
  for (const item of unknown.slice(0, 30)) console.warn(`  ${item}`)
}
process.exit(unknown.length ? 1 : 0)
