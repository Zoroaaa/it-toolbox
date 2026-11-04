import { Result } from './common'

export interface NumberBaseResult {
  binary: string
  octal: string
  decimal: string
  hexadecimal: string
}

export function convertNumberBase(input: string, fromBase: number): Result<NumberBaseResult> {
  try {
    const decimal = parseInt(input, fromBase)
    if (isNaN(decimal)) {
      return { ok: false, error: 'Invalid number for the given base' }
    }

    return {
      ok: true,
      value: {
        binary: decimal.toString(2),
        octal: decimal.toString(8),
        decimal: decimal.toString(10),
        hexadecimal: decimal.toString(16).toUpperCase(),
      }
    }
  } catch (e) {
    return { ok: false, error: (e as Error).message }
  }
}

export function convertBase(input: string, fromBase: number, toBase: number): Result<string> {
  try {
    const decimal = parseInt(input, fromBase)
    if (isNaN(decimal)) {
      return { ok: false, error: 'Invalid number for the given base' }
    }
    return { ok: true, value: decimal.toString(toBase).toUpperCase() }
  } catch (e) {
    return { ok: false, error: (e as Error).message }
  }
}

const ROMAN_TABLE: Array<[string, number]> = [
  ['M', 1000],
  ['CM', 900],
  ['D', 500],
  ['CD', 400],
  ['C', 100],
  ['XC', 90],
  ['L', 50],
  ['XL', 40],
  ['X', 10],
  ['IX', 9],
  ['V', 5],
  ['IV', 4],
  ['I', 1],
]

/** 阿拉伯数字转罗马数字（1 - 3,999,999） */
export function toRoman(num: number): Result<string> {
  if (!Number.isInteger(num) || num < 1 || num > 3999999) {
    return { ok: false, error: 'Number must be an integer between 1 and 3999999' }
  }

  let remaining = num
  let result = ''
  for (const [symbol, value] of ROMAN_TABLE) {
    while (remaining >= value) {
      result += symbol
      remaining -= value
    }
  }
  return { ok: true, value: result }
}

/** 罗马数字转阿拉伯数字；支持 IV/IX/XL/XC/CD/CM 减法记法，拒绝非标准写法 */
export function fromRoman(roman: string): Result<number> {
  const input = roman.toUpperCase().trim()
  if (!input) return { ok: false, error: 'Roman numeral is empty' }

  const values: Record<string, number> = { I: 1, V: 5, X: 10, L: 50, C: 100, D: 500, M: 1000 }
  let result = 0

  for (let i = 0; i < input.length; i++) {
    const current = values[input[i]]
    if (!current) return { ok: false, error: `Invalid Roman character: ${input[i]}` }
    const next = values[input[i + 1]]
    result += next && current < next ? -current : current
  }

  if (result < 1 || result > 3999999) {
    return { ok: false, error: 'Roman numeral out of range' }
  }

  const canonical = toRoman(result)
  if (!canonical.ok || canonical.value !== input) {
    return { ok: false, error: 'Non-standard Roman numeral' }
  }

  return { ok: true, value: result }
}
