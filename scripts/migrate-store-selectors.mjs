#!/usr/bin/env node
/**
 * 把 `const { a, b } = useAppStore()` 改写为字段级 selector 订阅。
 * 用法：node scripts/migrate-store-selectors.mjs [--dry-run]
 */
import { readdirSync, readFileSync, writeFileSync, statSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const srcDir = join(root, 'src')
const dryRun = process.argv.includes('--dry-run')

const STATE_FIELDS = new Set([
  'favorites',
  'history',
  'recentTools',
  'themeMode',
  'resolvedTheme',
  'mobileMenuOpen',
])

function walk(dir) {
  const files = []
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry)
    if (statSync(full).isDirectory()) files.push(...walk(full))
    else if (/\.(ts|tsx)$/.test(entry) && !full.includes('store/app.ts')) files.push(full)
  }
  return files
}

const pattern = /const\s+\{([^}]+)\}\s*=\s*useAppStore\(\)/g

let changed = 0
for (const file of walk(srcDir)) {
  const before = readFileSync(file, 'utf8')
  const after = before.replace(pattern, (_full, names) => {
    const entries = names
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean)
      .map((item) => {
        const [key, alias] = item.split(/\s*:\s*/)
        return { key: key.trim(), alias: (alias ?? key).trim() }
      })

    return entries
      .map(({ key, alias }) => {
        const isState = STATE_FIELDS.has(key)
        const selector = isState ? `(s) => s.${key}` : `(s) => s.${key}`
        return `const ${alias} = useAppStore(${selector})`
      })
      .join('\n')
  })

  if (after !== before) {
    changed += 1
    if (dryRun) console.log(`[dry-run] ${file}`)
    else {
      writeFileSync(file, after)
      console.log(`rewritten ${file}`)
    }
  }
}

console.log(`\n${dryRun ? '待改写' : '已改写'} ${changed} 个文件`)
