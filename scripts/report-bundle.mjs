#!/usr/bin/env node
/**
 * 构建产物体积报告：首屏资源、vendor 分块、工具 chunk、gzip 估算。
 * 用法：node scripts/report-bundle.mjs
 */
import { readdirSync, readFileSync, statSync, writeFileSync, mkdirSync } from 'node:fs'
import { join, dirname, basename } from 'node:path'
import { fileURLToPath } from 'node:url'
import { gzipSync } from 'node:zlib'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const dist = join(root, 'dist')
const assets = join(dist, 'assets')

const kb = (n) => Math.round((n / 1024) * 10) / 10
const gz = (file) => kb(gzipSync(readFileSync(file)).length)

let files = []
try {
  files = readdirSync(assets).filter((f) => f.endsWith('.js'))
} catch {
  console.error('dist/assets 不存在，先执行 pnpm build')
  process.exit(1)
}

const sizes = files
  .map((f) => ({ file: f, raw: kb(statSync(join(assets, f)).size), gzip: gz(join(assets, f)) }))
  .sort((a, b) => b.gzip - a.gzip)

const html = readFileSync(join(dist, 'index.html'), 'utf8')
const referenced = [...html.matchAll(/(?:src|href)="\/(assets\/[^"]+\.(?:js|css))"/g)].map((m) => m[1])
const preloaded = [...html.matchAll(/rel="modulepreload"[^>]*href="\/(assets\/[^"]+\.js)"/g)].map((m) => m[1])
const firstScreenFiles = [...new Set([...referenced, ...preloaded])]

let firstScreen = { raw: 0, gzip: 0 }
for (const rel of firstScreenFiles) {
  const abs = join(dist, rel)
  try {
    firstScreen.raw += kb(statSync(abs).size)
    firstScreen.gzip += gz(abs)
  } catch {
    /* 忽略外部资源 */
  }
}

const tools = sizes.filter((s) => s.file.startsWith('tools/'))
const vendor = sizes.filter((s) => /vendor|icons-|markdown-|math-|faker-|svg-|data-/.test(s.file))

const report = {
  generatedAt: new Date().toISOString(),
  totals: {
    jsFiles: sizes.length,
    jsRawKB: Math.round(sizes.reduce((a, s) => a + s.raw, 0)),
    jsGzipKB: Math.round(sizes.reduce((a, s) => a + s.gzip, 0)),
  },
  firstScreen: { files: firstScreenFiles, rawKB: Math.round(firstScreen.raw), gzipKB: Math.round(firstScreen.gzip) },
  toolChunks: { count: tools.length, rawKB: Math.round(tools.reduce((a, s) => a + s.raw, 0)) },
  top10: sizes.slice(0, 10),
  vendors: vendor.slice(0, 8),
}

mkdirSync(join(root, 'docs', 'metrics'), { recursive: true })
writeFileSync(join(root, 'docs', 'metrics', 'bundle-latest.json'), `${JSON.stringify(report, null, 2)}\n`)

console.log(`JS 文件 ${report.totals.jsFiles} 个，raw ${report.totals.jsRawKB} KB / gzip ${report.totals.jsGzipKB} KB`)
console.log(`首屏 ${firstScreenFiles.length} 个资源，raw ${report.firstScreen.rawKB} KB / gzip ${report.firstScreen.gzipKB} KB`)
console.log(`工具 chunk ${report.toolChunks.count} 个，raw ${report.toolChunks.rawKB} KB`)
console.log('\n最大 10 个 chunk（gzip）：')
for (const s of report.top10) console.log(`  ${String(s.gzip).padStart(7)} KB  ${s.file}`)
