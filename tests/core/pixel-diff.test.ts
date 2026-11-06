import { describe, it, expect } from 'vitest'
import { diffPixels } from '@core/pixel-diff'

/** 造一个 width×height 的全透明画布数据 */
const blank = (width: number, height: number) => new Uint8ClampedArray(width * height * 4)

const setPixel = (
  data: Uint8ClampedArray,
  index: number,
  [r, g, b, a]: [number, number, number, number],
) => {
  data.set([r, g, b, a], index * 4)
}

describe('diffPixels', () => {
  it('完全相同的两张图差异为 0', () => {
    const a = blank(2, 2)
    const b = blank(2, 2)
    setPixel(a, 0, [1, 2, 3, 255])
    setPixel(b, 0, [1, 2, 3, 255])

    const result = diffPixels(a, b, 2, 2)
    expect(result).toMatchObject({ totalPixels: 4, diffPixels: 0, ratio: 0 })
    expect(result.mask.every((value) => value === 0)).toBe(true)
  })

  it('单像素差异会被标出，比例按并集像素计算', () => {
    const a = blank(2, 2)
    const b = blank(2, 2)
    setPixel(a, 0, [0, 0, 0, 255])
    setPixel(b, 0, [255, 0, 0, 255])

    const result = diffPixels(a, b, 2, 2)
    expect(result.diffPixels).toBe(1)
    expect(result.ratio).toBe(0.25)
    expect(Array.from(result.mask)).toEqual([1, 0, 0, 0])
  })

  it('阈值内的通道差异被忽略（容忍有损压缩噪点）', () => {
    const a = blank(1, 1)
    const b = blank(1, 1)
    setPixel(a, 0, [100, 100, 100, 255])
    setPixel(b, 0, [110, 108, 105, 255])

    expect(diffPixels(a, b, 1, 1, 0).diffPixels).toBe(1)
    expect(diffPixels(a, b, 1, 1, 10).diffPixels).toBe(0)
  })

  it('两边全透明时忽略 RGB 差异', () => {
    const a = blank(1, 1)
    const b = blank(1, 1)
    setPixel(a, 0, [255, 0, 0, 0])
    setPixel(b, 0, [0, 0, 255, 0])

    expect(diffPixels(a, b, 1, 1, 0).diffPixels).toBe(0)
  })

  it('一边透明一边不透明算差异', () => {
    const a = blank(1, 1)
    const b = blank(1, 1)
    setPixel(a, 0, [0, 0, 0, 0])
    setPixel(b, 0, [0, 0, 0, 255])

    expect(diffPixels(a, b, 1, 1, 0).diffPixels).toBe(1)
  })

  it('空画布不会除零', () => {
    const result = diffPixels(new Uint8ClampedArray(0), new Uint8ClampedArray(0), 0, 0)
    expect(result).toMatchObject({ totalPixels: 0, diffPixels: 0, ratio: 0 })
  })
})
