import { describe, it, expect } from 'vitest'
import { normalizeSvgSize } from '@/lib/svg-size'

const wrap = (attrs: string, body = '<rect width="10" height="10"/>') =>
  `<svg xmlns="http://www.w3.org/2000/svg" ${attrs}>${body}</svg>`

describe('normalizeSvgSize', () => {
  it('有 px 尺寸时直接采用', () => {
    const result = normalizeSvgSize(wrap('width="320px" height="180px"'))
    expect(result).toMatchObject({ width: 320, height: 180 })
  })

  it('无单位数字同样有效', () => {
    const result = normalizeSvgSize(wrap('width="48" height="48"'))
    expect(result).toMatchObject({ width: 48, height: 48 })
  })

  it('缺少 width/height 时以 viewBox 为准', () => {
    const result = normalizeSvgSize(wrap('viewBox="0 0 512 256"'))
    expect(result).toMatchObject({ width: 512, height: 256 })
    expect(result?.markup).toContain('width="512"')
    expect(result?.markup).toContain('height="256"')
  })

  it('百分比宽度视为无固有尺寸，回落 viewBox', () => {
    const result = normalizeSvgSize(wrap('width="100%" height="100%" viewBox="0 0 64 32"'))
    expect(result).toMatchObject({ width: 64, height: 32 })
  })

  it('只有宽度时按 viewBox 比例补高度', () => {
    const result = normalizeSvgSize(wrap('width="200" viewBox="0 0 100 50"'))
    expect(result).toMatchObject({ width: 200, height: 100 })
  })

  it('只有高度时按 viewBox 比例补宽度', () => {
    const result = normalizeSvgSize(wrap('height="60" viewBox="0 0 30 60"'))
    expect(result).toMatchObject({ width: 30, height: 60 })
  })

  it('既无尺寸也无 viewBox 时返回 null', () => {
    expect(normalizeSvgSize(wrap(''))).toBeNull()
  })

  it('viewBox 非法（宽高为 0）时返回 null', () => {
    expect(normalizeSvgSize(wrap('viewBox="0 0 0 0"'))).toBeNull()
  })

  it('根节点不是 svg 时返回 null', () => {
    expect(normalizeSvgSize('<div>not svg</div>')).toBeNull()
  })

  it('空字符串返回 null', () => {
    expect(normalizeSvgSize('   ')).toBeNull()
  })
})
