/**
 * SVG 固有尺寸解析与规范化。
 *
 * `<img>` 加载 SVG 时，若根节点没有可用的 width/height，浏览器会退化成 0 或默认 300×150，
 * 导致 canvas 导出尺寸错误。这里统一以 viewBox 兜底，并把尺寸写回根节点。
 *
 * 实现上刻意不依赖 DOMParser/XMLSerializer：
 * 1. 只关心根 `<svg>` 起始标签的属性，用字符扫描即可，避免属性值里出现 `>` 时被误判；
 * 2. 同一份逻辑能在浏览器与 happy-dom 测试环境中一致运行（happy-dom 不解析 image/svg+xml）。
 */

const SVG_NS = 'http://www.w3.org/2000/svg'

export interface SvgSize {
  width: number
  height: number
  /** 补齐 width/height 与 xmlns 后的 SVG 源码，可直接用于 Blob/DataURL */
  markup: string
}

/** 只接受纯数字或 px 单位；百分比、em、calc() 等视为无固有尺寸 */
function pxValue(raw: string | null): number {
  if (!raw) return 0
  const match = raw.trim().match(/^([\d.]+)(px)?$/i)
  if (!match) return 0
  const value = Number.parseFloat(match[1])
  return Number.isFinite(value) && value > 0 ? value : 0
}

function readAttr(tag: string, name: string): string | null {
  const match = tag.match(new RegExp(`\\s${name}\\s*=\\s*("([^"]*)"|'([^']*)')`, 'i'))
  if (!match) return null
  return match[2] ?? match[3] ?? null
}

/** 定位根 `<svg …>` 起始标签，跳过引号内的 `>` */
function findSvgTag(text: string): { start: number; end: number; tag: string } | null {
  const match = /<svg[\s>]/i.exec(text)
  if (!match) return null

  const start = match.index
  let quote: string | null = null
  for (let i = start + 4; i < text.length; i++) {
    const char = text[i]
    if (quote) {
      if (char === quote) quote = null
      continue
    }
    if (char === '"' || char === "'") {
      quote = char
      continue
    }
    if (char === '>') return { start, end: i + 1, tag: text.slice(start, i + 1) }
  }
  return null
}

function setAttr(tag: string, name: string, value: string): string {
  const pattern = new RegExp(`\\s${name}\\s*=\\s*("[^"]*"|'[^']*')`, 'i')
  if (pattern.test(tag)) return tag.replace(pattern, ` ${name}="${value}"`)
  const closing = tag.endsWith('/>') ? '/>' : '>'
  const body = tag.slice(0, tag.length - closing.length)
  return `${body} ${name}="${value}"${closing}`
}

export function normalizeSvgSize(svgText: string): SvgSize | null {
  const text = svgText.trim()
  if (!text) return null

  const found = findSvgTag(text)
  if (!found) return null

  const viewBox = (readAttr(found.tag, 'viewBox') ?? '').trim().split(/[\s,]+/).map(Number)
  const hasViewBox =
    viewBox.length === 4 && viewBox.every(Number.isFinite) && viewBox[2] > 0 && viewBox[3] > 0

  let width = pxValue(readAttr(found.tag, 'width'))
  let height = pxValue(readAttr(found.tag, 'height'))

  // 缺一边时按 viewBox 的宽高比补齐；两边都缺则完全取 viewBox
  if (hasViewBox) {
    if (!width && !height) {
      width = viewBox[2]
      height = viewBox[3]
    } else if (!width) {
      width = (height * viewBox[2]) / viewBox[3]
    } else if (!height) {
      height = (width * viewBox[3]) / viewBox[2]
    }
  }

  if (!width || !height) return null

  width = Math.round(width)
  height = Math.round(height)

  let tag = setAttr(found.tag, 'width', String(width))
  tag = setAttr(tag, 'height', String(height))
  if (!readAttr(tag, 'xmlns')) tag = setAttr(tag, 'xmlns', SVG_NS)

  return { width, height, markup: `${text.slice(0, found.start)}${tag}${text.slice(found.end)}` }
}
