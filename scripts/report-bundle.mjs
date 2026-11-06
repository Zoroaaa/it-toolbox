#!/usr/bin/env node
/**
 * 构建产物体积报告：首屏资源、vendor 分块、工具 chunk、gzip 估算。
 *
 * 注意：工具 chunk 由 vite 输出到 dist/tools/，与 dist/assets/ 平级，
 * 因此必须递归收集两个目录，否则工具 chunk 会被整体漏统计。
 *
 * 用法：node scripts/report-bundle.mjs
 */
import { readdirSync, readFileSync, statSync, writeFileSync, mkdirSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { gzipSync } from 'node:zlib'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const dist = join(root, 'dist')
const assets = join(dist, 'assets')
const toolsDir = join(dist, 'tools')

const kb = (n) => Math.round((n / 1024) * 10) / 10
const gz = (file) => kb(gzipSync(readFileSync(file)).length)

/** 递归收集 js 文件，返回相对 dist 的路径与绝对路径 */
function collectJs(dir, prefix = '') {
  let entries
  try {
    entries = readdirSync(dir, { withFileTypes: true })
  } catch {
    return []
  }
  const out = []
  for (const entry of entries) {
    const abs = join(dir, entry.name)
    if (entry.isDirectory()) out.push(...collectJs(abs, `${prefix}${entry.name}/`))
    else if (entry.name.endsWith('.js')) out.push({ rel: `${prefix}${entry.name}`, abs })
  }
  return out
}

if (!collectJs(assets).length) {
  console.error('dist/assets 为空，先执行 pnpm build')
  process.exit(1)
}

const sizes = [...collectJs(assets), ...collectJs(toolsDir, 'tools/')]
  .map(({ rel, abs }) => ({ file: rel, raw: kb(statSync(abs).size), gzip: gz(abs) }))
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
const vendor = sizes.filter((s) => /^vendor|icons-|markdown-|math-|faker-|svg-|data-/.test(s.file))
/** 工具 chunk 一旦进入首屏预加载，懒加载就失效了，这里直接报出来 */
const toolsInFirstScreen = firstScreenFiles.filter((f) => f.includes('/tools/'))

const report = {
  generatedAt: new Date().toISOString(),
  totals: {
    jsFiles: sizes.length,
    jsRawKB: Math.round(sizes.reduce((a, s) => a + s.raw, 0)),
    jsGzipKB: Math.round(sizes.reduce((a, s) => a + s.gzip, 0)),
  },
  firstScreen: { files: firstScreenFiles, rawKB: Math.round(firstScreen.raw), gzipKB: Math.round(firstScreen.gzip) },
  toolChunks: {
    count: tools.length,
    rawKB: Math.round(tools.reduce((a, s) => a + s.raw, 0)),
    gzipKB: Math.round(tools.reduce((a, s) => a + s.gzip, 0)),
    inFirstScreen: toolsInFirstScreen,
  },
  top10: sizes.slice(0, 10),
  vendors: vendor.slice(0, 8),
}

mkdirSync(join(root, 'docs', 'metrics'), { recursive: true })
writeFileSync(join(root, 'docs', 'metrics', 'bundle-latest.json'), `${JSON.stringify(report, null, 2)}\n`)

console.log(`JS 文件 ${report.totals.jsFiles} 个，raw ${report.totals.jsRawKB} KB / gzip ${report.totals.jsGzipKB} KB`)
console.log(`首屏 ${firstScreenFiles.length} 个资源，raw ${report.firstScreen.rawKB} KB / gzip ${report.firstScreen.gzipKB} KB`)
console.log(`工具 chunk ${report.toolChunks.count} 个，raw ${report.toolChunks.rawKB} KB / gzip ${report.toolChunks.gzipKB} KB`)
if (toolsInFirstScreen.length) {
  console.error(`首屏包含工具 chunk，懒加载失效：${toolsInFirstScreen.join(', ')}`)
  process.exitCode = 1
}
console.log('\n最大 10 个 chunk（gzip）：')
for (const s of report.top10) console.log(`  ${String(s.gzip).padStart(7)} KB  ${s.file}`)
