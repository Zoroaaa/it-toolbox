#!/usr/bin/env node
/**
 * 禁止整店订阅：所有组件必须使用字段 selector。
 * 用法：node scripts/check-store-selectors.mjs
 */
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join, dirname, relative } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const srcDir = join(root, 'src')

function walk(dir) {
  const files = []
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry)
    if (statSync(full).isDirectory()) files.push(...walk(full))
    else if (/\.(ts|tsx)$/.test(entry)) files.push(full)
  }
  return files
}

const offenders = []
for (const file of walk(srcDir)) {
  const source = readFileSync(file, 'utf8')
  if (/useAppStore\(\s*\)/.test(source)) offenders.push(relative(root, file))
}

if (offenders.length) {
  console.error(`发现整店订阅（请改用 useAppStore((s) => s.field)）：\n  ${offenders.join('\n  ')}`)
  process.exit(1)
}

console.log('未发现整店订阅')
