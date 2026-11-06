import { describe, it, expect } from 'vitest'
import { amountToChinese } from '@core/rmb'

const upper = (input: string): string => {
  const result = amountToChinese(input)
  if (!result.ok) throw new Error(`${input} -> ${result.error}`)
  return result.value
}

describe('amountToChinese — 常规金额', () => {
  const cases: Array<[string, string]> = [
    ['0', '零元整'],
    ['1', '壹元整'],
    ['10', '壹拾元整'],
    ['100', '壹佰元整'],
    ['1000', '壹仟元整'],
    ['10000', '壹万元整'],
    ['100000', '壹拾万元整'],
    ['1000000', '壹佰万元整'],
    ['100000000', '壹亿元整'],
    ['105', '壹佰零伍元整'],
    ['1005', '壹仟零伍元整'],
    ['10005', '壹万零伍元整'],
    ['100000005', '壹亿零伍元整'],
    ['105000000', '壹亿零伍佰万元整'],
    ['107', '壹佰零柒元整'],
  ]

  for (const [input, expected] of cases) {
    it(`${input} → ${expected}`, () => {
      expect(upper(input)).toBe(expected)
    })
  }
})

describe('amountToChinese — 角分', () => {
  const cases: Array<[string, string]> = [
    ['0.01', '零元零壹分'],
    ['0.1', '零元壹角'],
    ['0.5', '零元伍角'],
    ['0.55', '零元伍角伍分'],
    ['1.05', '壹元零伍分'],
    ['10.5', '壹拾元伍角'],
    ['100.05', '壹佰元零伍分'],
    ['107.05', '壹佰零柒元零伍分'],
    ['1409.5', '壹仟肆佰零玖元伍角'],
    ['6007.14', '陆仟零柒元壹角肆分'],
    ['1680.32', '壹仟陆佰捌拾元叁角贰分'],
    ['1000000.99', '壹佰万元玖角玖分'],
    ['123456789.01', '壹亿贰仟叁佰肆拾伍万陆仟柒佰捌拾玖元零壹分'],
  ]

  for (const [input, expected] of cases) {
    it(`${input} → ${expected}`, () => {
      expect(upper(input)).toBe(expected)
    })
  }
})

describe('amountToChinese — 输入清洗与边界', () => {
  it('去掉千分位与货币符号', () => {
    expect(upper('¥1,234.56')).toBe('壹仟贰佰叁拾肆元伍角陆分')
    expect(upper('￥ 1 , 000')).toBe('壹仟元整')
  })

  it('一位小数按角补齐', () => {
    expect(upper('12.3')).toBe('壹拾贰元叁角')
  })

  it('负数加「负」前缀', () => {
    expect(upper('-1234.56')).toBe('负壹仟贰佰叁拾肆元伍角陆分')
    expect(upper('-0.01')).toBe('负零元零壹分')
  })

  it('前导零不影响结果', () => {
    expect(upper('000123')).toBe('壹佰贰拾叁元整')
  })

  it('支持到 16 位整数（万亿级）', () => {
    expect(upper('9999999999999999')).toBe(
      '玖仟玖佰玖拾玖万亿玖仟玖佰玖拾玖亿玖仟玖佰玖拾玖万玖仟玖佰玖拾玖元整',
    )
  })

  it('超过 16 位整数时报错而不是静默截断', () => {
    expect(amountToChinese('10000000000000000').ok).toBe(false)
  })

  it('三位小数报错', () => {
    const result = amountToChinese('1.234')
    expect(result).toEqual({ ok: false, error: '只支持数字金额，且最多两位小数' })
  })

  it('非数字报错', () => {
    expect(amountToChinese('十二元').ok).toBe(false)
  })

  it('空输入报错', () => {
    expect(amountToChinese('  ').ok).toBe(false)
  })
})
