import { Result } from './common'

/**
 * 人民币金额转中文大写。
 *
 * 规则依据《正确填写票据和结算凭证的基本规定》：
 * - 中间有 0 写「零」，连续多个 0 只写一个「零」
 * - 角位为 0 而分位不为 0 时，「元」后必须写「零」（如 107.05 → 壹佰零柒元零伍分）
 * - 无角分写「整」
 * - 不足 1 元时补「零元」定位（如 0.05 → 零元零伍分）
 */

const DIGITS = ['零', '壹', '贰', '叁', '肆', '伍', '陆', '柒', '捌', '玖']
const SMALL_UNITS = ['', '拾', '佰', '仟']
const GROUP_UNITS = ['', '万', '亿', '万亿']
/** 整数部分最多 16 位，即 9999 万亿，超过则拒绝而不是静默截断 */
const MAX_INTEGER_DIGITS = 16

/** 处理 4 位一组；padding 后的前导 0 由调用方决定是否补「零」 */
function groupToChinese(group: string): string {
  let out = ''
  for (let i = 0; i < 4; i++) {
    const digit = Number(group[i])
    if (digit === 0) {
      // 末尾的 0 不产生「零」，连续的 0 只保留一个
      if (out && !out.endsWith('零') && i < 3) out += '零'
      continue
    }
    out += DIGITS[digit] + SMALL_UNITS[3 - i]
  }
  // 组内末尾的零不上屏（如 0100 → 壹佰，而不是 壹佰零）
  return out.endsWith('零') ? out.slice(0, -1) : out
}

function integerToChinese(digits: string): string {
  const padded = digits.padStart(Math.ceil(digits.length / 4) * 4, '0')
  const groups: string[] = []
  for (let i = 0; i < padded.length; i += 4) groups.push(padded.slice(i, i + 4))

  let out = ''
  let pendingZero = false

  groups.forEach((group, index) => {
    const unit = GROUP_UNITS[groups.length - 1 - index]
    if (Number(group) === 0) {
      if (out) pendingZero = true
      return
    }

    const text = groupToChinese(group)
    // 本组高位缺失（如 0005）或前面整组为零时，需要补一个「零」
    if (out && (pendingZero || group.startsWith('0')) && !out.endsWith('零')) out += '零'
    out += text + unit
    pendingZero = false
  })

  return out
}

export function amountToChinese(input: string): Result<string> {
  const cleaned = input
    .trim()
    .replace(/^[¥￥]/, '')
    .replace(/[,，\s]/g, '')

  if (!cleaned) return { ok: false, error: '请输入金额' }
  if (!/^-?\d+(\.\d{1,2})?$/.test(cleaned)) {
    return { ok: false, error: '只支持数字金额，且最多两位小数' }
  }

  const negative = cleaned.startsWith('-')
  const [rawInteger, rawDecimal = ''] = cleaned.replace(/^-/, '').split('.')
  const integer = rawInteger.replace(/^0+(?=\d)/, '')

  if (integer.length > MAX_INTEGER_DIGITS) {
    return { ok: false, error: '金额超出支持范围（最大 9999 万亿元）' }
  }

  const [jiao = '0', fen = '0'] = rawDecimal.padEnd(2, '0')
  const jiaoDigit = Number(jiao)
  const fenDigit = Number(fen)

  const integerText = Number(integer) === 0 ? '' : integerToChinese(integer)

  let decimalText = ''
  if (jiaoDigit === 0 && fenDigit === 0) {
    decimalText = '整'
  } else {
    if (jiaoDigit > 0) decimalText += `${DIGITS[jiaoDigit]}角`
    else if (fenDigit > 0) decimalText += '零'
    if (fenDigit > 0) decimalText += `${DIGITS[fenDigit]}分`
  }

  const body = integerText ? `${integerText}元${decimalText}` : `零元${decimalText}`
  return { ok: true, value: `${negative ? '负' : ''}${body}` }
}
