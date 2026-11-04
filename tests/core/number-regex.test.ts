import { describe, it, expect } from 'vitest'
import { convertNumberBase, convertBase, toRoman, fromRoman } from '@core/number'
import { testRegex } from '@core/regex'

const ok = <T,>(r: { ok: true; value: T } | { ok: false; error: string }): T => {
  if (!r.ok) throw new Error(r.error)
  return r.value
}

describe('进制转换', () => {
  it.each([
    ['ff', 16, { binary: '11111111', octal: '377', decimal: '255', hexadecimal: 'FF' }],
    ['1010', 2, { binary: '1010', octal: '12', decimal: '10', hexadecimal: 'A' }],
    ['777', 8, { binary: '111111111', octal: '777', decimal: '511', hexadecimal: '1FF' }],
    ['0', 10, { binary: '0', octal: '0', decimal: '0', hexadecimal: '0' }],
  ])('convertNumberBase(%s, %i)', (input, base, expected) => {
    expect(ok(convertNumberBase(input, base))).toEqual(expected)
  })

  it('非法输入返回错误', () => {
    expect(convertNumberBase('xyz', 10).ok).toBe(false)
    expect(convertNumberBase('2', 2).ok).toBe(false)
  })

  it.each([
    ['1010', 2, 16, 'A'],
    ['255', 10, 2, '11111111'],
    ['ff', 16, 8, '377'],
  ])('convertBase(%s, %i, %i)', (input, from, to, expected) => {
    expect(ok(convertBase(input, from, to))).toBe(expected)
  })

  it('convertBase 非法输入', () => {
    expect(convertBase('zz', 16, 2).ok).toBe(false)
  })
})

describe('罗马数字', () => {
  it.each([
    [1, 'I'],
    [4, 'IV'],
    [9, 'IX'],
    [14, 'XIV'],
    [40, 'XL'],
    [90, 'XC'],
    [400, 'CD'],
    [900, 'CM'],
    [1994, 'MCMXCIV'],
    [3999, 'MMMCMXCIX'],
  ])('toRoman(%i) = %s', (num, expected) => {
    expect(ok(toRoman(num))).toBe(expected)
  })

  it.each([
    ['I', 1],
    ['IV', 4],
    ['IX', 9],
    ['XL', 40],
    ['XC', 90],
    ['CD', 400],
    ['CM', 900],
    ['MCMXCIV', 1994],
  ])('fromRoman(%s) = %i', (roman, expected) => {
    expect(ok(fromRoman(roman))).toBe(expected)
  })

  it('大小写与空白不敏感', () => {
    expect(ok(fromRoman('  mcmxciv '))).toBe(1994)
  })

  it.each(['IIII', 'IC', 'VX', 'ABC', ''])('非法写法 %s 返回错误', (roman) => {
    expect(fromRoman(roman).ok).toBe(false)
  })

  it('toRoman 越界返回错误', () => {
    expect(toRoman(0).ok).toBe(false)
    expect(toRoman(4000000).ok).toBe(false)
    expect(toRoman(1.5).ok).toBe(false)
  })
})

describe('正则测试器', () => {
  it('全局匹配返回所有结果与位置', () => {
    const result = testRegex('\\d+', 'a1b22c333')
    expect(result.matches.map((m) => m.match)).toEqual(['1', '22', '333'])
    expect(result.matches[1]).toMatchObject({ start: 3, end: 5 })
    expect(result.error).toBeUndefined()
  })

  it('非全局标志只返回首个匹配', () => {
    expect(testRegex('\\d+', 'a1b22', '').matches).toHaveLength(1)
    expect(testRegex('\\d+', 'a1b22', 'i').matches[0].match).toBe('1')
  })

  it('命名分组', () => {
    const result = testRegex('(?<year>\\d{4})-(?<month>\\d{2})', '2026-11')
    expect(result.matches[0].groups).toEqual({ year: '2026', month: '11' })
  })

  it('零宽匹配不会死循环', () => {
    const result = testRegex('^', 'abc')
    expect(result.matches).toHaveLength(1)
    expect(result.matches[0].start).toBe(0)
  })

  it('非法正则在 100ms 内返回错误', () => {
    const started = Date.now()
    const result = testRegex('(', 'abc')
    expect(result.error).toBeTruthy()
    expect(Date.now() - started).toBeLessThan(100)
  })

  it('超过 2000 次匹配时标记截断', () => {
    const result = testRegex('a', 'a'.repeat(2500))
    expect(result.matches).toHaveLength(2000)
    expect(result.truncated).toBe(true)
  })
})
