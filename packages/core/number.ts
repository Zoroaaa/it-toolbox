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
