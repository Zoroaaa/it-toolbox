import { describe, it, expect } from 'vitest'
import {
  parseHex,
  rgbToHex,
  rgbToHsl,
  hslToRgb,
  rgbToHsv,
  hsvToRgb,
  rgbToCmyk,
  convertColor,
  generateColorPalette,
  generateCssGradient,
  getContrastRatio,
  checkContrast,
  simulateColorBlindness,
  generateBoxShadow,
  TAILWIND_COLORS,
} from '@core/color'

const ok = <T,>(r: { ok: true; value: T } | { ok: false; error: string }): T => {
  if (!r.ok) throw new Error(r.error)
  return r.value
}

describe('HEX 解析', () => {
  it.each([
    ['#ffffff', { r: 255, g: 255, b: 255 }],
    ['#000', { r: 0, g: 0, b: 0 }],
    ['ff0000', { r: 255, g: 0, b: 0 }],
    ['#0f8', { r: 0, g: 255, b: 136 }],
  ])('parseHex(%s)', (input, expected) => {
    expect(ok(parseHex(input))).toEqual(expected)
  })

  it.each(['#12', '#gggggg', 'zzzzzz', ''])('非法颜色 %s 返回错误', (input) => {
    expect(parseHex(input).ok).toBe(false)
  })
})

describe('颜色空间转换', () => {
  it('rgbToHex 截断并补零', () => {
    expect(rgbToHex({ r: 255, g: 0, b: 16 })).toBe('#ff0010')
    expect(rgbToHex({ r: 300, g: -5, b: 128 })).toBe('#ff0080')
  })

  it('rgbToHsl 基色', () => {
    expect(rgbToHsl({ r: 255, g: 0, b: 0 })).toEqual({ h: 0, s: 100, l: 50 })
    expect(rgbToHsl({ r: 0, g: 255, b: 0 })).toEqual({ h: 120, s: 100, l: 50 })
    expect(rgbToHsl({ r: 128, g: 128, b: 128 })).toEqual({ h: 0, s: 0, l: 50 })
  })

  it('hslToRgb 与 rgbToHsl 往返', () => {
    expect(hslToRgb({ h: 0, s: 100, l: 50 })).toEqual({ r: 255, g: 0, b: 0 })
    expect(hslToRgb({ h: 120, s: 100, l: 50 })).toEqual({ r: 0, g: 255, b: 0 })
    expect(hslToRgb({ h: 0, s: 0, l: 100 })).toEqual({ r: 255, g: 255, b: 255 })
  })

  it('rgbToHsv / hsvToRgb', () => {
    expect(rgbToHsv({ r: 255, g: 0, b: 0 })).toEqual({ h: 0, s: 100, v: 100 })
    expect(hsvToRgb({ h: 0, s: 100, v: 100 })).toEqual({ r: 255, g: 0, b: 0 })
    expect(hsvToRgb({ h: 120, s: 100, v: 100 })).toEqual({ r: 0, g: 255, b: 0 })
  })

  it('rgbToCmyk 黑白边界', () => {
    expect(rgbToCmyk({ r: 0, g: 0, b: 0 })).toEqual({ c: 0, m: 0, y: 0, k: 100 })
    expect(rgbToCmyk({ r: 255, g: 255, b: 255 })).toEqual({ c: 0, m: 0, y: 0, k: 0 })
    expect(rgbToCmyk({ r: 255, g: 0, b: 0 })).toEqual({ c: 0, m: 100, y: 100, k: 0 })
  })

  it('convertColor 汇总所有格式', () => {
    const result = ok(convertColor('#ff0000'))
    expect(result.hex).toBe('#ff0000')
    expect(result.rgb).toEqual({ r: 255, g: 0, b: 0 })
    expect(result.hsl.h).toBe(0)
    expect(result.hsv.v).toBe(100)
    expect(result.cmyk.k).toBe(0)
  })

  it('convertColor 非法输入', () => {
    expect(convertColor('nope').ok).toBe(false)
  })
})

describe('配色与渐变', () => {
  it.each([
    ['analogous', 3],
    ['complementary', 2],
    ['triadic', 3],
    ['tetradic', 4],
  ] as const)('%s 生成 %i 个颜色', (scheme, length) => {
    expect(generateColorPalette('#ff0000', scheme)).toHaveLength(length)
  })

  it('非法基础色返回空数组', () => {
    expect(generateColorPalette('zzzzzz', 'triadic')).toEqual([])
  })

  it.each([
    [{ type: 'linear', angle: 90, stops: [{ color: '#fff', position: 0 }] }, 'linear-gradient(90deg'],
    [{ type: 'radial', angle: 0, stops: [{ color: '#fff', position: 0 }] }, 'radial-gradient(circle'],
    [{ type: 'conic', angle: 45, stops: [{ color: '#fff', position: 0 }] }, 'conic-gradient(from 45deg'],
  ] as const)('生成 %s 渐变', (config, prefix) => {
    expect(generateCssGradient(config as never)).toContain(prefix)
  })

  it('box-shadow 支持多条与 inset', () => {
    expect(
      generateBoxShadow([
        { x: 0, y: 1, blur: 2, spread: 0, color: '#000', inset: false },
        { x: 1, y: 2, blur: 3, spread: 4, color: 'red', inset: true },
      ]),
    ).toBe('0px 1px 2px 0px #000, inset 1px 2px 3px 4px red')
  })
})

describe('对比度', () => {
  it('黑白对比度为 21', () => {
    expect(ok(getContrastRatio('#000000', '#ffffff'))).toBeCloseTo(21)
  })

  it('同色对比度为 1', () => {
    expect(ok(getContrastRatio('#123456', '#123456'))).toBeCloseTo(1)
  })

  it('WCAG 等级判定', () => {
    const black = ok(checkContrast('#000000', '#ffffff'))
    expect(black).toMatchObject({ aaNormal: true, aaLarge: true, aaaNormal: true })
    const low = ok(checkContrast('#777777', '#888888'))
    expect(low.aaNormal).toBe(false)
  })

  it('非法颜色返回错误', () => {
    expect(getContrastRatio('zzzzzz', '#fff').ok).toBe(false)
  })
})

describe('色盲模拟与色板', () => {
  it('全色盲输出灰度', () => {
    const hex = simulateColorBlindness('#ff0000', 'achromatopsia')
    const rgb = ok(parseHex(hex))
    expect(rgb.r).toBe(rgb.g)
    expect(rgb.g).toBe(rgb.b)
  })

  it('非法输入原样返回', () => {
    expect(simulateColorBlindness('zzzzzz', 'protanopia')).toBe('zzzzzz')
  })

  it('Tailwind 色板包含常用色阶', () => {
    expect(TAILWIND_COLORS.red['500']).toBe('#ef4444')
    expect(Object.keys(TAILWIND_COLORS)).toContain('slate')
  })
})
