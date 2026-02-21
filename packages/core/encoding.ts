import { Result } from './common'

export function encodeBase64(input: string): Result<string> {
  try {
    const bytes = new TextEncoder().encode(input)
    let binary = ''
    bytes.forEach(b => { binary += String.fromCharCode(b) })
    return { ok: true, value: btoa(binary) }
  } catch (e) {
    return { ok: false, error: (e as Error).message }
  }
}

export function decodeBase64(input: string): Result<string> {
  try {
    const binary = atob(input.trim())
    const bytes = Uint8Array.from(binary, c => c.charCodeAt(0))
    return { ok: true, value: new TextDecoder().decode(bytes) }
  } catch {
    return { ok: false, error: 'Invalid Base64 string' }
  }
}

export function encodeBase64Url(input: string): Result<string> {
  const result = encodeBase64(input)
  if (!result.ok) return result
  return { ok: true, value: result.value.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '') }
}

export function decodeBase64Url(input: string): Result<string> {
  try {
    let str = input.replace(/-/g, '+').replace(/_/g, '/')
    while (str.length % 4) str += '='
    return decodeBase64(str)
  } catch {
    return { ok: false, error: 'Invalid Base64URL string' }
  }
}

export function fileToBase64(file: File): Promise<Result<string>> {
  return new Promise((resolve) => {
    const reader = new FileReader()
    reader.onload = () => {
      const result = reader.result as string
      const base64 = result.split(',')[1]
      resolve({ ok: true, value: base64 })
    }
    reader.onerror = () => resolve({ ok: false, error: 'Failed to read file' })
    reader.readAsDataURL(file)
  })
}

export function encodeUrl(input: string): Result<string> {
  try {
    return { ok: true, value: encodeURIComponent(input) }
  } catch (e) {
    return { ok: false, error: (e as Error).message }
  }
}

export function decodeUrl(input: string): Result<string> {
  try {
    return { ok: true, value: decodeURIComponent(input) }
  } catch {
    return { ok: false, error: 'Invalid URL encoded string' }
  }
}

export function encodeUrlFull(input: string): Result<string> {
  try {
    return { ok: true, value: encodeURI(input) }
  } catch (e) {
    return { ok: false, error: (e as Error).message }
  }
}

export function decodeUrlFull(input: string): Result<string> {
  try {
    return { ok: true, value: decodeURI(input) }
  } catch {
    return { ok: false, error: 'Invalid URL encoded string' }
  }
}

const HTML_ENTITIES: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
  '©': '&copy;',
  '®': '&reg;',
  '™': '&trade;',
  '€': '&euro;',
  '£': '&pound;',
  '¥': '&yen;',
  '¢': '&cent;',
  '§': '&sect;',
  '¶': '&para;',
  '°': '&deg;',
  '±': '&plusmn;',
  '×': '&times;',
  '÷': '&divide;',
  '½': '&frac12;',
  '¼': '&frac14;',
  '¾': '&frac34;',
  '←': '&larr;',
  '→': '&rarr;',
  '↑': '&uarr;',
  '↓': '&darr;',
  '↔': '&harr;',
  '⇐': '&lArr;',
  '⇒': '&rArr;',
  '⇑': '&uArr;',
  '⇓': '&dArr;',
  '⇔': '&hArr;',
  '♠': '&spades;',
  '♣': '&clubs;',
  '♥': '&hearts;',
  '♦': '&diams;',
  'α': '&alpha;',
  'β': '&beta;',
  'γ': '&gamma;',
  'δ': '&delta;',
  'ε': '&epsilon;',
  'π': '&pi;',
  'σ': '&sigma;',
  'ω': '&omega;',
  '∞': '&infin;',
  '√': '&radic;',
  '∑': '&sum;',
  '∏': '&prod;',
  '∫': '&int;',
  '≈': '&asymp;',
  '≠': '&ne;',
  '≤': '&le;',
  '≥': '&ge;',
}

const HTML_ENTITIES_REVERSE: Record<string, string> = Object.fromEntries(
  Object.entries(HTML_ENTITIES).map(([k, v]) => [v, k])
)

export function encodeHtmlEntities(input: string): Result<string> {
  try {
    // & must be replaced first to prevent double-encoding (e.g. < -> &lt; -> &amp;lt;)
    let result = input.replace(/&/g, '&amp;')
    const rest = Object.entries(HTML_ENTITIES).filter(([char]) => char !== '&')
    for (const [char, entity] of rest) {
      result = result.split(char).join(entity)
    }
    return { ok: true, value: result }
  } catch (e) {
    return { ok: false, error: (e as Error).message }
  }
}

export function decodeHtmlEntities(input: string): Result<string> {
  try {
    let result = input
    // Named entities first (e.g. &amp; &lt; &gt;)
    for (const [entity, char] of Object.entries(HTML_ENTITIES_REVERSE)) {
      result = result.split(entity).join(char)
    }
    // Then numeric decimal (e.g. &#65;)
    result = result.replace(/&#(\d+);/g, (_, code) => String.fromCharCode(parseInt(code, 10)))
    // Then numeric hex (e.g. &#x41;)
    result = result.replace(/&#x([0-9a-fA-F]+);/g, (_, code) => String.fromCharCode(parseInt(code, 16)))
    return { ok: true, value: result }
  } catch (e) {
    return { ok: false, error: (e as Error).message }
  }
}

export function encodeHex(input: string, separator: string = ''): Result<string> {
  try {
    const bytes = new TextEncoder().encode(input)
    const hex = Array.from(bytes).map(b => b.toString(16).padStart(2, '0'))
    return { ok: true, value: hex.join(separator) }
  } catch (e) {
    return { ok: false, error: (e as Error).message }
  }
}

export function decodeHex(input: string): Result<string> {
  try {
    const clean = input.replace(/[\s:,-]/g, '')
    if (clean.length % 2 !== 0) {
      return { ok: false, error: 'Hex string must have even length' }
    }
    const bytes = new Uint8Array(clean.length / 2)
    for (let i = 0; i < clean.length; i += 2) {
      bytes[i / 2] = parseInt(clean.slice(i, i + 2), 16)
    }
    return { ok: true, value: new TextDecoder().decode(bytes) }
  } catch (e) {
    return { ok: false, error: (e as Error).message }
  }
}

export interface UnicodeResult {
  codePoints: Array<{ char: string; code: string; name: string }>
  formats: {
    uEscape: string
    uBrace: string
    htmlEntity: string
    cssEscape: string
  }
}

export function textToUnicode(input: string): Result<UnicodeResult> {
  try {
    const codePoints: Array<{ char: string; code: string; name: string }> = []
    const uEscapes: string[] = []
    const uBraces: string[] = []
    const htmlEntities: string[] = []
    const cssEscapes: string[] = []

    for (const char of input) {
      const code = char.codePointAt(0)!
      codePoints.push({
        char,
        code: `U+${code.toString(16).toUpperCase().padStart(4, '0')}`,
        name: getUnicodeName(code),
      })
      uEscapes.push(`\\u${code.toString(16).padStart(4, '0')}`)
      uBraces.push(`\\u{${code.toString(16)}}`)
      htmlEntities.push(`&#${code};`)
      cssEscapes.push(`\\${code.toString(16)}`)
    }

    return {
      ok: true,
      value: {
        codePoints,
        formats: {
          uEscape: uEscapes.join(''),
          uBrace: uBraces.join(''),
          htmlEntity: htmlEntities.join(''),
          cssEscape: cssEscapes.join(''),
        },
      },
    }
  } catch (e) {
    return { ok: false, error: (e as Error).message }
  }
}

export function unicodeToText(input: string): Result<string> {
  try {
    let result = input
    result = result.replace(/\\u\{([0-9a-fA-F]+)\}/g, (_, code) =>
      String.fromCodePoint(parseInt(code, 16))
    )
    result = result.replace(/\\u([0-9a-fA-F]{4})/g, (_, code) =>
      String.fromCharCode(parseInt(code, 16))
    )
    result = result.replace(/&#x([0-9a-fA-F]+);/gi, (_, code) =>
      String.fromCodePoint(parseInt(code, 16))
    )
    result = result.replace(/&#(\d+);/g, (_, code) =>
      String.fromCodePoint(parseInt(code, 10))
    )
    result = result.replace(/U\+([0-9a-fA-F]+)/gi, (_, code) =>
      String.fromCodePoint(parseInt(code, 16))
    )
    return { ok: true, value: result }
  } catch (e) {
    return { ok: false, error: (e as Error).message }
  }
}

function getUnicodeName(code: number): string {
  const names: Record<number, string> = {
    32: 'SPACE',
    33: 'EXCLAMATION MARK',
    34: 'QUOTATION MARK',
    35: 'NUMBER SIGN',
    36: 'DOLLAR SIGN',
    37: 'PERCENT SIGN',
    38: 'AMPERSAND',
    39: 'APOSTROPHE',
    40: 'LEFT PARENTHESIS',
    41: 'RIGHT PARENTHESIS',
    42: 'ASTERISK',
    43: 'PLUS SIGN',
    44: 'COMMA',
    45: 'HYPHEN-MINUS',
    46: 'FULL STOP',
    47: 'SOLIDUS',
    48: 'DIGIT ZERO',
    49: 'DIGIT ONE',
    50: 'DIGIT TWO',
    65: 'LATIN CAPITAL LETTER A',
    66: 'LATIN CAPITAL LETTER B',
    67: 'LATIN CAPITAL LETTER C',
    97: 'LATIN SMALL LETTER A',
    98: 'LATIN SMALL LETTER B',
    99: 'LATIN SMALL LETTER C',
    19968: 'CJK UNIFIED IDEOGRAPH-4E00',
    20013: 'CJK UNIFIED IDEOGRAPH-4E2D',
    22269: 'CJK UNIFIED IDEOGRAPH-56FD',
  }
  return names[code] || `CODE POINT ${code}`
}

const MORSE_CODE: Record<string, string> = {
  'A': '.-', 'B': '-...', 'C': '-.-.', 'D': '-..', 'E': '.', 'F': '..-.',
  'G': '--.', 'H': '....', 'I': '..', 'J': '.---', 'K': '-.-', 'L': '.-..',
  'M': '--', 'N': '-.', 'O': '---', 'P': '.--.', 'Q': '--.-', 'R': '.-.',
  'S': '...', 'T': '-', 'U': '..-', 'V': '...-', 'W': '.--', 'X': '-..-',
  'Y': '-.--', 'Z': '--..',
  '0': '-----', '1': '.----', '2': '..---', '3': '...--', '4': '....-',
  '5': '.....', '6': '-....', '7': '--...', '8': '---..', '9': '----.',
  '.': '.-.-.-', ',': '--..--', '?': '..--..', "'": '.----.', '!': '-.-.--',
  '/': '-..-.', '(': '-.--.', ')': '-.--.-', '&': '.-...', ':': '---...',
  ';': '-.-.-.', '=': '-...-', '+': '.-.-.', '-': '-....-', '_': '..--.-',
  '"': '.-..-.', '$': '...-..-', '@': '.--.-.',
}

const MORSE_CODE_REVERSE: Record<string, string> = Object.fromEntries(
  Object.entries(MORSE_CODE).map(([k, v]) => [v, k])
)

export function textToMorse(input: string): Result<string> {
  try {
    const chars = input.toUpperCase().split('')
    const result = chars.map(char => {
      if (char === ' ') return '/'
      return MORSE_CODE[char] || char
    })
    return { ok: true, value: result.join(' ') }
  } catch (e) {
    return { ok: false, error: (e as Error).message }
  }
}

export function morseToText(input: string): Result<string> {
  try {
    const words = input.split(' / ')
    const result = words.map(word => {
      const letters = word.split(' ')
      return letters.map(code => MORSE_CODE_REVERSE[code] || code).join('')
    })
    return { ok: true, value: result.join(' ') }
  } catch (e) {
    return { ok: false, error: (e as Error).message }
  }
}

export function textToBinary(input: string, separator: string = ' '): Result<string> {
  try {
    const bytes = new TextEncoder().encode(input)
    const binary = Array.from(bytes).map(b => b.toString(2).padStart(8, '0'))
    return { ok: true, value: binary.join(separator) }
  } catch (e) {
    return { ok: false, error: (e as Error).message }
  }
}

export function binaryToText(input: string): Result<string> {
  try {
    const clean = input.replace(/[^01]/g, '')
    if (clean.length % 8 !== 0) {
      return { ok: false, error: 'Binary string length must be multiple of 8' }
    }
    const bytes = new Uint8Array(clean.length / 8)
    for (let i = 0; i < clean.length; i += 8) {
      bytes[i / 8] = parseInt(clean.slice(i, i + 8), 2)
    }
    return { ok: true, value: new TextDecoder().decode(bytes) }
  } catch (e) {
    return { ok: false, error: (e as Error).message }
  }
}

export function rot13(input: string): Result<string> {
  return caesarCipher(input, 13)
}

export function caesarCipher(input: string, shift: number): Result<string> {
  try {
    const result = input.split('').map(char => {
      const code = char.charCodeAt(0)
      if (code >= 65 && code <= 90) {
        return String.fromCharCode(((code - 65 + shift + 26) % 26) + 65)
      }
      if (code >= 97 && code <= 122) {
        return String.fromCharCode(((code - 97 + shift + 26) % 26) + 97)
      }
      return char
    })
    return { ok: true, value: result.join('') }
  } catch (e) {
    return { ok: false, error: (e as Error).message }
  }
}

export interface AsciiEntry {
  code: number
  char: string
  description: string
  htmlEntity: string
  hex: string
}

export function getAsciiTable(): AsciiEntry[] {
  const table: AsciiEntry[] = []
  const descriptions: Record<number, string> = {
    0: 'NULL', 1: 'SOH', 2: 'STX', 3: 'ETX', 4: 'EOT', 5: 'ENQ', 6: 'ACK', 7: 'BEL',
    8: 'BS', 9: 'HT', 10: 'LF', 11: 'VT', 12: 'FF', 13: 'CR', 14: 'SO', 15: 'SI',
    16: 'DLE', 17: 'DC1', 18: 'DC2', 19: 'DC3', 20: 'DC4', 21: 'NAK', 22: 'SYN', 23: 'ETB',
    24: 'CAN', 25: 'EM', 26: 'SUB', 27: 'ESC', 28: 'FS', 29: 'GS', 30: 'RS', 31: 'US',
    32: 'Space', 127: 'DEL',
  }

  for (let i = 0; i <= 127; i++) {
    const char = i >= 32 && i !== 127 ? String.fromCharCode(i) : ''
    table.push({
      code: i,
      char,
      description: descriptions[i] || '',
      htmlEntity: i < 32 ? '' : `&#${i};`,
      hex: `0x${i.toString(16).toUpperCase().padStart(2, '0')}`,
    })
  }
  return table
}

export function searchAscii(query: string): AsciiEntry[] {
  const table = getAsciiTable()
  const q = query.toLowerCase()
  return table.filter(entry =>
    entry.char.includes(query) ||
    entry.description.toLowerCase().includes(q) ||
    entry.code.toString() === query ||
    entry.hex.toLowerCase() === q
  )
}
