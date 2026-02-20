export type Result<T> = { ok: true; value: T } | { ok: false; error: string }

// ─── JSON ───────────────────────────────────────────────────────────────────

export function formatJson(input: string, indent = 2): Result<string> {
  try {
    const parsed = JSON.parse(input)
    return { ok: true, value: JSON.stringify(parsed, null, indent) }
  } catch (e) {
    return { ok: false, error: (e as Error).message }
  }
}

export function minifyJson(input: string): Result<string> {
  try {
    const parsed = JSON.parse(input)
    return { ok: true, value: JSON.stringify(parsed) }
  } catch (e) {
    return { ok: false, error: (e as Error).message }
  }
}

export function validateJson(input: string): Result<{ valid: boolean; type: string }> {
  try {
    const parsed = JSON.parse(input)
    return { ok: true, value: { valid: true, type: Array.isArray(parsed) ? 'array' : typeof parsed } }
  } catch (e) {
    return { ok: false, error: (e as Error).message }
  }
}

// ─── Base64 ─────────────────────────────────────────────────────────────────

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

// ─── URL Encoding ───────────────────────────────────────────────────────────

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

export interface ParsedUrl {
  href: string
  origin: string
  protocol: string
  username: string
  password: string
  host: string
  hostname: string
  port: string
  pathname: string
  search: string
  hash: string
  params: Record<string, string>
}

export function parseUrl(input: string): Result<ParsedUrl> {
  try {
    const url = new URL(input)
    const params: Record<string, string> = {}
    url.searchParams.forEach((v, k) => { params[k] = v })
    return {
      ok: true,
      value: {
        href: url.href,
        origin: url.origin,
        protocol: url.protocol,
        username: url.username,
        password: url.password,
        host: url.host,
        hostname: url.hostname,
        port: url.port,
        pathname: url.pathname,
        search: url.search,
        hash: url.hash,
        params,
      }
    }
  } catch {
    return { ok: false, error: 'Invalid URL' }
  }
}

// ─── Hash ───────────────────────────────────────────────────────────────────

export type HashAlgorithm = 'MD5' | 'SHA-1' | 'SHA-256' | 'SHA-384' | 'SHA-512'

async function hashText(algorithm: string, input: string): Promise<Result<string>> {
  try {
    const bytes = new TextEncoder().encode(input)
    const hashBuffer = await crypto.subtle.digest(algorithm as AlgorithmIdentifier, bytes)
    const hashArray = Array.from(new Uint8Array(hashBuffer))
    const hex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
    return { ok: true, value: hex }
  } catch (e) {
    return { ok: false, error: (e as Error).message }
  }
}

export async function sha1(input: string): Promise<Result<string>> {
  return hashText('SHA-1', input)
}

export async function sha256(input: string): Promise<Result<string>> {
  return hashText('SHA-256', input)
}

export async function sha384(input: string): Promise<Result<string>> {
  return hashText('SHA-384', input)
}

export async function sha512(input: string): Promise<Result<string>> {
  return hashText('SHA-512', input)
}

export async function hashFile(algorithm: string, file: File): Promise<Result<string>> {
  try {
    const buffer = await file.arrayBuffer()
    const hashBuffer = await crypto.subtle.digest(algorithm as AlgorithmIdentifier, buffer)
    const hashArray = Array.from(new Uint8Array(hashBuffer))
    const hex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
    return { ok: true, value: hex }
  } catch (e) {
    return { ok: false, error: (e as Error).message }
  }
}

// MD5 implementation (Web Crypto doesn't support MD5)
export function md5(input: string): Result<string> {
  try {
    const bytes = new TextEncoder().encode(input)
    const result = md5Bytes(bytes)
    return { ok: true, value: result }
  } catch (e) {
    return { ok: false, error: (e as Error).message }
  }
}

function md5Bytes(bytes: Uint8Array): string {
  const K = new Uint32Array([
    0xd76aa478, 0xe8c7b756, 0x242070db, 0xc1bdceee,
    0xf57c0faf, 0x4787c62a, 0xa8304613, 0xfd469501,
    0x698098d8, 0x8b44f7af, 0xffff5bb1, 0x895cd7be,
    0x6b901122, 0xfd987193, 0xa679438e, 0x49b40821,
    0xf61e2562, 0xc040b340, 0x265e5a51, 0xe9b6c7aa,
    0xd62f105d, 0x02441453, 0xd8a1e681, 0xe7d3fbc8,
    0x21e1cde6, 0xc33707d6, 0xf4d50d87, 0x455a14ed,
    0xa9e3e905, 0xfcefa3f8, 0x676f02d9, 0x8d2a4c8a,
    0xfffa3942, 0x8771f681, 0x6d9d6122, 0xfde5380c,
    0xa4beea44, 0x4bdecfa9, 0xf6bb4b60, 0xbebfbc70,
    0x289b7ec6, 0xeaa127fa, 0xd4ef3085, 0x04881d05,
    0xd9d4d039, 0xe6db99e5, 0x1fa27cf8, 0xc4ac5665,
    0xf4292244, 0x432aff97, 0xab9423a7, 0xfc93a039,
    0x655b59c3, 0x8f0ccc92, 0xffeff47d, 0x85845dd1,
    0x6fa87e4f, 0xfe2ce6e0, 0xa3014314, 0x4e0811a1,
    0xf7537e82, 0xbd3af235, 0x2ad7d2bb, 0xeb86d391,
  ])

  const S = new Uint8Array([
    7, 12, 17, 22, 7, 12, 17, 22, 7, 12, 17, 22, 7, 12, 17, 22,
    5, 9, 14, 20, 5, 9, 14, 20, 5, 9, 14, 20, 5, 9, 14, 20,
    4, 11, 16, 23, 4, 11, 16, 23, 4, 11, 16, 23, 4, 11, 16, 23,
    6, 10, 15, 21, 6, 10, 15, 21, 6, 10, 15, 21, 6, 10, 15, 21,
  ])

  const padLen = bytes.length + 9
  const padBytes = ((padLen + 63) & ~63) - padLen + 8
  const totalLen = bytes.length + 1 + padBytes + 8
  const data = new Uint8Array(totalLen)
  data.set(bytes)
  data[bytes.length] = 0x80
  const view = new DataView(data.buffer)
  view.setUint32(totalLen - 8, bytes.length * 8, true)

  let a0 = 0x67452301
  let b0 = 0xefcdab89
  let c0 = 0x98badcfe
  let d0 = 0x10325476

  for (let offset = 0; offset < totalLen; offset += 64) {
    const M = new Uint32Array(16)
    for (let i = 0; i < 16; i++) {
      M[i] = view.getUint32(offset + i * 4, true)
    }

    let A = a0, B = b0, C = c0, D = d0

    for (let i = 0; i < 64; i++) {
      let F: number, g: number
      if (i < 16) {
        F = (B & C) | (~B & D)
        g = i
      } else if (i < 32) {
        F = (D & B) | (~D & C)
        g = (5 * i + 1) % 16
      } else if (i < 48) {
        F = B ^ C ^ D
        g = (3 * i + 5) % 16
      } else {
        F = C ^ (B | ~D)
        g = (7 * i) % 16
      }
      F = (F + A + K[i] + M[g]) >>> 0
      A = D
      D = C
      C = B
      B = (B + leftRotate(F, S[i])) >>> 0
    }

    a0 = (a0 + A) >>> 0
    b0 = (b0 + B) >>> 0
    c0 = (c0 + C) >>> 0
    d0 = (d0 + D) >>> 0
  }

  const result = new Uint8Array(16)
  const resultView = new DataView(result.buffer)
  resultView.setUint32(0, a0, true)
  resultView.setUint32(4, b0, true)
  resultView.setUint32(8, c0, true)
  resultView.setUint32(12, d0, true)

  return Array.from(result).map(b => b.toString(16).padStart(2, '0')).join('')
}

function leftRotate(x: number, c: number): number {
  return ((x << c) | (x >>> (32 - c))) >>> 0
}

// ─── UUID ────────────────────────────────────────────────────────────────────

export function generateUUID(): string {
  return crypto.randomUUID()
}

export function generateUUIDs(count: number, options?: { uppercase?: boolean; noHyphens?: boolean }): string[] {
  const max = Math.min(count, 1000)
  return Array.from({ length: max }, () => {
    let uuid: string = crypto.randomUUID()
    if (options?.noHyphens) uuid = uuid.replace(/-/g, '')
    if (options?.uppercase) uuid = uuid.toUpperCase()
    return uuid
  })
}

// ─── JWT ────────────────────────────────────────────────────────────────────

export interface JwtPayload {
  header: Record<string, unknown>
  payload: Record<string, unknown>
  signature: string
  raw: {
    header: string
    payload: string
    signature: string
  }
  isExpired: boolean
  expiresAt?: Date
  issuedAt?: Date
}

export function parseJwt(token: string): Result<JwtPayload> {
  try {
    const parts = token.trim().split('.')
    if (parts.length !== 3) {
      return { ok: false, error: 'Invalid JWT format: must have 3 parts' }
    }

    const decode = (str: string) => {
      const padded = str.replace(/-/g, '+').replace(/_/g, '/').padEnd(str.length + (4 - str.length % 4) % 4, '=')
      return JSON.parse(atob(padded))
    }

    const header = decode(parts[0])
    const payload = decode(parts[1])

    let isExpired = false
    let expiresAt: Date | undefined
    let issuedAt: Date | undefined

    if (payload.exp) {
      expiresAt = new Date(payload.exp * 1000)
      isExpired = expiresAt < new Date()
    }
    if (payload.iat) {
      issuedAt = new Date(payload.iat * 1000)
    }

    return {
      ok: true,
      value: {
        header,
        payload,
        signature: parts[2],
        raw: {
          header: parts[0],
          payload: parts[1],
          signature: parts[2],
        },
        isExpired,
        expiresAt,
        issuedAt,
      }
    }
  } catch (e) {
    return { ok: false, error: 'Failed to parse JWT: ' + (e as Error).message }
  }
}

// ─── Password Generator ──────────────────────────────────────────────────────

export interface PasswordOptions {
  length: number
  uppercase: boolean
  lowercase: boolean
  numbers: boolean
  symbols: boolean
  excludeSimilar?: boolean
}

export function generatePassword(opts: PasswordOptions): Result<string> {
  let upper = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
  let lower = 'abcdefghijklmnopqrstuvwxyz'
  let numbers = '0123456789'
  let symbols = '!@#$%^&*()_+-=[]{}|;:,.<>?'

  if (opts.excludeSimilar) {
    upper = upper.replace(/[OI]/g, '')
    lower = lower.replace(/[il]/g, '')
    numbers = numbers.replace(/[01]/g, '')
  }

  const chars = [
    opts.uppercase ? upper : '',
    opts.lowercase ? lower : '',
    opts.numbers ? numbers : '',
    opts.symbols ? symbols : '',
  ].join('')

  if (!chars) return { ok: false, error: 'Select at least one character type' }

  const array = new Uint32Array(opts.length)
  crypto.getRandomValues(array)
  const password = Array.from(array, n => chars[n % chars.length]).join('')
  return { ok: true, value: password }
}

export function generatePasswords(count: number, opts: PasswordOptions): Result<string[]> {
  const max = Math.min(count, 100)
  const passwords: string[] = []
  for (let i = 0; i < max; i++) {
    const result = generatePassword(opts)
    if (!result.ok) return result as Result<string[]>
    passwords.push(result.value)
  }
  return { ok: true, value: passwords }
}

export interface PasswordStrength {
  score: number
  label: string
  color: string
  crackTime: string
}

export function checkPasswordStrength(password: string): PasswordStrength {
  let score = 0
  const len = password.length

  if (len >= 8) score += 1
  if (len >= 12) score += 1
  if (len >= 16) score += 1
  if (len >= 20) score += 1
  if (/[a-z]/.test(password)) score += 1
  if (/[A-Z]/.test(password)) score += 1
  if (/[0-9]/.test(password)) score += 1
  if (/[^a-zA-Z0-9]/.test(password)) score += 1

  const combinations = Math.pow(
    (/[a-z]/.test(password) ? 26 : 0) +
    (/[A-Z]/.test(password) ? 26 : 0) +
    (/[0-9]/.test(password) ? 10 : 0) +
    (/[^a-zA-Z0-9]/.test(password) ? 32 : 0),
    len
  )

  const guessesPerSecond = 1e10
  const seconds = combinations / guessesPerSecond

  let crackTime: string
  if (seconds < 1) crackTime = '瞬间'
  else if (seconds < 60) crackTime = `${Math.round(seconds)} 秒`
  else if (seconds < 3600) crackTime = `${Math.round(seconds / 60)} 分钟`
  else if (seconds < 86400) crackTime = `${Math.round(seconds / 3600)} 小时`
  else if (seconds < 2592000) crackTime = `${Math.round(seconds / 86400)} 天`
  else if (seconds < 31536000) crackTime = `${Math.round(seconds / 2592000)} 月`
  else if (seconds < 3153600000) crackTime = `${Math.round(seconds / 31536000)} 年`
  else crackTime = '数百年+'

  const levels = [
    { min: 0, label: '非常弱', color: '#ef4444' },
    { min: 3, label: '弱', color: '#f97316' },
    { min: 5, label: '一般', color: '#eab308' },
    { min: 7, label: '强', color: '#22c55e' },
    { min: 9, label: '非常强', color: '#10b981' },
  ]

  const level = levels.reverse().find(l => score >= l.min) || levels[levels.length - 1]

  return { score, label: level.label, color: level.color, crackTime }
}

// ─── Case Converter ──────────────────────────────────────────────────────────

export type CaseType = 'camel' | 'pascal' | 'snake' | 'kebab' | 'upper' | 'lower' | 'constant' | 'title' | 'sentence'

export function convertCase(input: string, to: CaseType): Result<string> {
  try {
    const words = input
      .replace(/([a-z])([A-Z])/g, '$1 $2')
      .replace(/[_\-\s]+/g, ' ')
      .trim()
      .toLowerCase()
      .split(' ')
      .filter(Boolean)

    const result = {
      camel: words.map((w, i) => i === 0 ? w : w[0].toUpperCase() + w.slice(1)).join(''),
      pascal: words.map(w => w[0].toUpperCase() + w.slice(1)).join(''),
      snake: words.join('_'),
      kebab: words.join('-'),
      upper: input.toUpperCase(),
      lower: input.toLowerCase(),
      constant: words.join('_').toUpperCase(),
      title: words.map(w => w[0].toUpperCase() + w.slice(1)).join(' '),
      sentence: words.map((w, i) => i === 0 ? w[0].toUpperCase() + w.slice(1) : w).join(' '),
    }[to]

    return { ok: true, value: result }
  } catch (e) {
    return { ok: false, error: (e as Error).message }
  }
}

// ─── Timestamp ───────────────────────────────────────────────────────────────

export interface TimestampResult {
  unix: number
  unixMs: number
  iso: string
  utc: string
  local: string
  date: Date
}

export function parseTimestamp(input: string | number): Result<TimestampResult> {
  try {
    let date: Date
    const num = typeof input === 'number' ? input : parseInt(input, 10)

    if (isNaN(num)) {
      date = new Date(input)
    } else {
      if (num > 1e12) {
        date = new Date(num)
      } else {
        date = new Date(num * 1000)
      }
    }

    if (isNaN(date.getTime())) {
      return { ok: false, error: 'Invalid timestamp or date' }
    }

    return {
      ok: true,
      value: {
        unix: Math.floor(date.getTime() / 1000),
        unixMs: date.getTime(),
        iso: date.toISOString(),
        utc: date.toUTCString(),
        local: date.toLocaleString(),
        date,
      }
    }
  } catch (e) {
    return { ok: false, error: (e as Error).message }
  }
}

export function nowTimestamp(): TimestampResult {
  const date = new Date()
  return {
    unix: Math.floor(date.getTime() / 1000),
    unixMs: date.getTime(),
    iso: date.toISOString(),
    utc: date.toUTCString(),
    local: date.toLocaleString(),
    date,
  }
}

export function dateToTimestamp(date: Date, unit: 's' | 'ms' = 's'): number {
  return unit === 's' ? Math.floor(date.getTime() / 1000) : date.getTime()
}

// ─── Lorem Ipsum ─────────────────────────────────────────────────────────────

const LOREM_WORDS = [
  'lorem', 'ipsum', 'dolor', 'sit', 'amet', 'consectetur', 'adipiscing', 'elit',
  'sed', 'do', 'eiusmod', 'tempor', 'incididunt', 'ut', 'labore', 'et', 'dolore',
  'magna', 'aliqua', 'enim', 'ad', 'minim', 'veniam', 'quis', 'nostrud',
  'exercitation', 'ullamco', 'laboris', 'nisi', 'aliquip', 'ex', 'ea', 'commodo',
  'consequat', 'duis', 'aute', 'irure', 'in', 'reprehenderit', 'voluptate',
  'velit', 'esse', 'cillum', 'fugiat', 'nulla', 'pariatur', 'excepteur', 'sint',
  'occaecat', 'cupidatat', 'non', 'proident', 'sunt', 'culpa', 'qui', 'officia',
  'deserunt', 'mollit', 'anim', 'id', 'est', 'laborum',
]

const CHINESE_WORDS = [
  '的', '一', '是', '在', '不', '了', '有', '和', '人', '这', '中', '大', '为',
  '上', '个', '国', '我', '以', '要', '他', '时', '来', '用', '们', '生', '到',
  '作', '地', '于', '出', '就', '分', '对', '成', '会', '可', '主', '发', '年',
  '动', '同', '工', '也', '能', '下', '过', '子', '说', '产', '种', '面', '而',
  '方', '后', '多', '定', '行', '学', '法', '所', '民', '得', '经', '十三', '进',
  '着', '等', '部', '度', '家', '电', '力', '里', '如', '水', '化', '高', '自',
  '二', '理', '起', '小', '物', '现', '实', '加', '量', '都', '两', '体', '制',
  '机', '当', '使', '点', '从', '业', '本', '去', '把', '性', '好', '应', '开',
  '它', '合', '还', '因', '由', '其', '些', '然', '前', '外', '天', '政', '四',
  '日', '那', '社', '义', '事', '平', '形', '相', '全', '表', '间', '样', '与',
]

function randomWords(words: string[], count: number): string[] {
  const result: string[] = []
  for (let i = 0; i < count; i++) {
    result.push(words[Math.floor(Math.random() * words.length)])
  }
  return result
}

export function generateLoremIpsum(options: {
  type: 'paragraphs' | 'words' | 'sentences'
  count: number
  language: 'en' | 'zh'
}): Result<string> {
  const { type, count, language } = options
  const words = language === 'zh' ? CHINESE_WORDS : LOREM_WORDS

  try {
    if (type === 'words') {
      return { ok: true, value: randomWords(words, count).join(' ') }
    }

    if (type === 'sentences') {
      const sentences: string[] = []
      for (let i = 0; i < count; i++) {
        const sentenceWords = randomWords(words, 8 + Math.floor(Math.random() * 10))
        if (language === 'en') {
          sentenceWords[0] = sentenceWords[0][0].toUpperCase() + sentenceWords[0].slice(1)
        }
        sentences.push(sentenceWords.join('') + (language === 'zh' ? '。' : '. '))
      }
      return { ok: true, value: sentences.join('') }
    }

    const paragraphs: string[] = []
    for (let i = 0; i < count; i++) {
      const sentenceCount = 3 + Math.floor(Math.random() * 3)
      const sentences: string[] = []
      for (let j = 0; j < sentenceCount; j++) {
        const sentenceWords = randomWords(words, 10 + Math.floor(Math.random() * 15))
        if (language === 'en') {
          sentenceWords[0] = sentenceWords[0][0].toUpperCase() + sentenceWords[0].slice(1)
        }
        sentences.push(sentenceWords.join(' ') + (language === 'zh' ? '。' : '.'))
      }
      paragraphs.push(sentences.join(' '))
    }
    return { ok: true, value: paragraphs.join('\n\n') }
  } catch (e) {
    return { ok: false, error: (e as Error).message }
  }
}

// ─── Regex Tester ───────────────────────────────────────────────────────────

export interface RegexMatch {
  match: string
  start: number
  end: number
  groups: Record<string, string> | null
}

export interface RegexResult {
  matches: RegexMatch[]
  error?: string
}

export function testRegex(pattern: string, input: string, flags: string = 'g'): RegexResult {
  try {
    const regex = new RegExp(pattern, flags)
    const matches: RegexMatch[] = []

    if (flags.includes('g')) {
      let match
      while ((match = regex.exec(input)) !== null) {
        matches.push({
          match: match[0],
          start: match.index,
          end: match.index + match[0].length,
          groups: match.groups || null,
        })
      }
    } else {
      const match = regex.exec(input)
      if (match) {
        matches.push({
          match: match[0],
          start: match.index,
          end: match.index + match[0].length,
          groups: match.groups || null,
        })
      }
    }

    return { matches }
  } catch (e) {
    return { matches: [], error: (e as Error).message }
  }
}

// ─── Text Counter ────────────────────────────────────────────────────────────

export interface TextStats {
  characters: number
  charactersNoSpaces: number
  words: number
  lines: number
  bytes: number
  paragraphs: number
  sentences: number
  readingTime: string
  speakingTime: string
}

export function countText(input: string): TextStats {
  const characters = input.length
  const charactersNoSpaces = input.replace(/\s/g, '').length
  const words = input.trim() ? input.trim().split(/\s+/).length : 0
  const lines = input ? input.split('\n').length : 0
  const bytes = new TextEncoder().encode(input).length
  const paragraphs = input.trim() ? input.split(/\n\s*\n/).filter(p => p.trim()).length : 0
  const sentences = input.trim() ? (input.match(/[.!?。！？]+/g) || []).length : 0

  const readingMinutes = Math.ceil(words / 200)
  const speakingMinutes = Math.ceil(words / 150)

  const readingTime = readingMinutes < 1 ? '不到1分钟' : `${readingMinutes} 分钟`
  const speakingTime = speakingMinutes < 1 ? '不到1分钟' : `${speakingMinutes} 分钟`

  return {
    characters,
    charactersNoSpaces,
    words,
    lines,
    bytes,
    paragraphs,
    sentences,
    readingTime,
    speakingTime,
  }
}

// ─── Number Base Converter ───────────────────────────────────────────────────

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

// ─── Color Converter ─────────────────────────────────────────────────────────

export interface RGB { r: number; g: number; b: number }
export interface HSL { h: number; s: number; l: number }
export interface HSV { h: number; s: number; v: number }
export interface CMYK { c: number; m: number; y: number; k: number }

export interface ColorConversion {
  hex: string
  rgb: RGB
  hsl: HSL
  hsv: HSV
  cmyk: CMYK
}

export function parseHex(hex: string): Result<RGB> {
  try {
    let h = hex.replace('#', '')
    if (h.length === 3) {
      h = h.split('').map(c => c + c).join('')
    }
    if (h.length !== 6) {
      return { ok: false, error: 'Invalid hex color' }
    }
    const r = parseInt(h.slice(0, 2), 16)
    const g = parseInt(h.slice(2, 4), 16)
    const b = parseInt(h.slice(4, 6), 16)
    return { ok: true, value: { r, g, b } }
  } catch {
    return { ok: false, error: 'Invalid hex color' }
  }
}

export function rgbToHex(rgb: RGB): string {
  const toHex = (n: number) => Math.round(Math.min(255, Math.max(0, n))).toString(16).padStart(2, '0')
  return `#${toHex(rgb.r)}${toHex(rgb.g)}${toHex(rgb.b)}`
}

export function rgbToHsl(rgb: RGB): HSL {
  const r = rgb.r / 255
  const g = rgb.g / 255
  const b = rgb.b / 255

  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  const l = (max + min) / 2

  if (max === min) {
    return { h: 0, s: 0, l: Math.round(l * 100) }
  }

  const d = max - min
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min)

  let h = 0
  switch (max) {
    case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break
    case g: h = ((b - r) / d + 2) / 6; break
    case b: h = ((r - g) / d + 4) / 6; break
  }

  return { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100) }
}

export function rgbToHsv(rgb: RGB): HSV {
  const r = rgb.r / 255
  const g = rgb.g / 255
  const b = rgb.b / 255

  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  const d = max - min

  const v = max
  const s = max === 0 ? 0 : d / max

  let h = 0
  if (max !== min) {
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break
      case g: h = ((b - r) / d + 2) / 6; break
      case b: h = ((r - g) / d + 4) / 6; break
    }
  }

  return { h: Math.round(h * 360), s: Math.round(s * 100), v: Math.round(v * 100) }
}

export function rgbToCmyk(rgb: RGB): CMYK {
  const r = rgb.r / 255
  const g = rgb.g / 255
  const b = rgb.b / 255

  const k = 1 - Math.max(r, g, b)

  if (k === 1) {
    return { c: 0, m: 0, y: 0, k: 100 }
  }

  const c = (1 - r - k) / (1 - k)
  const m = (1 - g - k) / (1 - k)
  const y = (1 - b - k) / (1 - k)

  return {
    c: Math.round(c * 100),
    m: Math.round(m * 100),
    y: Math.round(y * 100),
    k: Math.round(k * 100),
  }
}

export function hslToRgb(hsl: HSL): RGB {
  const h = hsl.h / 360
  const s = hsl.s / 100
  const l = hsl.l / 100

  let r, g, b

  if (s === 0) {
    r = g = b = l
  } else {
    const hue2rgb = (p: number, q: number, t: number) => {
      if (t < 0) t += 1
      if (t > 1) t -= 1
      if (t < 1/6) return p + (q - p) * 6 * t
      if (t < 1/2) return q
      if (t < 2/3) return p + (q - p) * (2/3 - t) * 6
      return p
    }

    const q = l < 0.5 ? l * (1 + s) : l + s - l * s
    const p = 2 * l - q
    r = hue2rgb(p, q, h + 1/3)
    g = hue2rgb(p, q, h)
    b = hue2rgb(p, q, h - 1/3)
  }

  return {
    r: Math.round(r * 255),
    g: Math.round(g * 255),
    b: Math.round(b * 255),
  }
}

export function hsvToRgb(hsv: HSV): RGB {
  const h = hsv.h / 360
  const s = hsv.s / 100
  const v = hsv.v / 100

  const i = Math.floor(h * 6)
  const f = h * 6 - i
  const p = v * (1 - s)
  const q = v * (1 - f * s)
  const t = v * (1 - (1 - f) * s)

  let r = 0, g = 0, b = 0
  switch (i % 6) {
    case 0: r = v; g = t; b = p; break
    case 1: r = q; g = v; b = p; break
    case 2: r = p; g = v; b = t; break
    case 3: r = p; g = q; b = v; break
    case 4: r = t; g = p; b = v; break
    case 5: r = v; g = p; b = q; break
  }

  return {
    r: Math.round(r * 255),
    g: Math.round(g * 255),
    b: Math.round(b * 255),
  }
}

export function convertColor(hex: string): Result<ColorConversion> {
  const rgbResult = parseHex(hex)
  if (!rgbResult.ok) return rgbResult as Result<ColorConversion>

  const rgb = rgbResult.value
  return {
    ok: true,
    value: {
      hex: rgbToHex(rgb),
      rgb,
      hsl: rgbToHsl(rgb),
      hsv: rgbToHsv(rgb),
      cmyk: rgbToCmyk(rgb),
    }
  }
}

export function convertColorFromRgb(rgb: RGB): ColorConversion {
  return {
    hex: rgbToHex(rgb),
    rgb,
    hsl: rgbToHsl(rgb),
    hsv: rgbToHsv(rgb),
    cmyk: rgbToCmyk(rgb),
  }
}

// ─── Markdown ───────────────────────────────────────────────────────────────

export function sanitizeMarkdownHtml(html: string): string {
  return html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/on\w+="[^"]*"/gi, '')
    .replace(/on\w+='[^']*'/gi, '')
}

// ─── HTML Entities ───────────────────────────────────────────────────────────

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
    let result = input
    for (const [char, entity] of Object.entries(HTML_ENTITIES)) {
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
    result = result.replace(/&#(\d+);/g, (_, code) => String.fromCharCode(parseInt(code, 10)))
    result = result.replace(/&#x([0-9a-fA-F]+);/g, (_, code) => String.fromCharCode(parseInt(code, 16)))
    for (const [entity, char] of Object.entries(HTML_ENTITIES_REVERSE)) {
      result = result.split(entity).join(char)
    }
    return { ok: true, value: result }
  } catch (e) {
    return { ok: false, error: (e as Error).message }
  }
}

// ─── Hex Encoding ─────────────────────────────────────────────────────────────

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

// ─── Unicode Conversion ───────────────────────────────────────────────────────

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

// ─── Morse Code ───────────────────────────────────────────────────────────────

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

// ─── Binary Text ──────────────────────────────────────────────────────────────

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

// ─── ROT13 / Caesar Cipher ────────────────────────────────────────────────────

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

// ─── ASCII Table ──────────────────────────────────────────────────────────────

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

// ─── AES Encryption ───────────────────────────────────────────────────────────

export async function deriveKey(password: string, salt: Uint8Array): Promise<CryptoKey> {
  const encoder = new TextEncoder()
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(password),
    'PBKDF2',
    false,
    ['deriveBits', 'deriveKey']
  )
  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt as BufferSource,
      iterations: 100000,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  )
}

export async function aesEncrypt(plaintext: string, password: string): Promise<Result<string>> {
  try {
    const encoder = new TextEncoder()
    const salt = crypto.getRandomValues(new Uint8Array(16))
    const iv = crypto.getRandomValues(new Uint8Array(12))
    const key = await deriveKey(password, salt)
    
    const encrypted = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      key,
      encoder.encode(plaintext)
    )
    
    const combined = new Uint8Array(salt.length + iv.length + encrypted.byteLength)
    combined.set(salt, 0)
    combined.set(iv, salt.length)
    combined.set(new Uint8Array(encrypted), salt.length + iv.length)
    
    const base64 = btoa(String.fromCharCode(...combined))
    return { ok: true, value: base64 }
  } catch (e) {
    return { ok: false, error: (e as Error).message }
  }
}

export async function aesDecrypt(ciphertext: string, password: string): Promise<Result<string>> {
  try {
    const combined = Uint8Array.from(atob(ciphertext), c => c.charCodeAt(0))
    const salt = combined.slice(0, 16)
    const iv = combined.slice(16, 28)
    const data = combined.slice(28)
    
    const key = await deriveKey(password, salt)
    const decrypted = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv },
      key,
      data
    )
    
    return { ok: true, value: new TextDecoder().decode(decrypted) }
  } catch (e) {
    return { ok: false, error: 'Decryption failed: ' + (e as Error).message }
  }
}

// ─── RSA Key Generation ───────────────────────────────────────────────────────

export interface RsaKeyPair {
  publicKey: string
  privateKey: string
  publicKeyJwk: JsonWebKey
  privateKeyJwk: JsonWebKey
}

export async function generateRsaKeyPair(modulusLength: 2048 | 4096 = 2048): Promise<Result<RsaKeyPair>> {
  try {
    const keyPair = await crypto.subtle.generateKey(
      {
        name: 'RSA-OAEP',
        modulusLength,
        publicExponent: new Uint8Array([1, 0, 1]),
        hash: 'SHA-256',
      },
      true,
      ['encrypt', 'decrypt']
    )
    
    const publicKeyBuffer = await crypto.subtle.exportKey('spki', keyPair.publicKey)
    const privateKeyBuffer = await crypto.subtle.exportKey('pkcs8', keyPair.privateKey)
    
    const publicKey = `-----BEGIN PUBLIC KEY-----\n${btoa(String.fromCharCode(...new Uint8Array(publicKeyBuffer))).match(/.{1,64}/g)!.join('\n')}\n-----END PUBLIC KEY-----`
    const privateKey = `-----BEGIN PRIVATE KEY-----\n${btoa(String.fromCharCode(...new Uint8Array(privateKeyBuffer))).match(/.{1,64}/g)!.join('\n')}\n-----END PRIVATE KEY-----`
    
    const publicKeyJwk = await crypto.subtle.exportKey('jwk', keyPair.publicKey)
    const privateKeyJwk = await crypto.subtle.exportKey('jwk', keyPair.privateKey)
    
    return {
      ok: true,
      value: { publicKey, privateKey, publicKeyJwk, privateKeyJwk },
    }
  } catch (e) {
    return { ok: false, error: (e as Error).message }
  }
}

// ─── HMAC ─────────────────────────────────────────────────────────────────────

export async function hmacSha256(message: string, secret: string): Promise<Result<string>> {
  try {
    const encoder = new TextEncoder()
    const key = await crypto.subtle.importKey(
      'raw',
      encoder.encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    )
    const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(message))
    const hex = Array.from(new Uint8Array(signature))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('')
    return { ok: true, value: hex }
  } catch (e) {
    return { ok: false, error: (e as Error).message }
  }
}

export async function hmacSha512(message: string, secret: string): Promise<Result<string>> {
  try {
    const encoder = new TextEncoder()
    const key = await crypto.subtle.importKey(
      'raw',
      encoder.encode(secret),
      { name: 'HMAC', hash: 'SHA-512' },
      false,
      ['sign']
    )
    const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(message))
    const hex = Array.from(new Uint8Array(signature))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('')
    return { ok: true, value: hex }
  } catch (e) {
    return { ok: false, error: (e as Error).message }
  }
}

// ─── SSH Key Generation ───────────────────────────────────────────────────────

export interface SshKeyPair {
  publicKey: string
  privateKey: string
  fingerprint: string
}

export async function generateSshKeyPair(type: 'ed25519' | 'rsa' = 'ed25519'): Promise<Result<SshKeyPair>> {
  try {
    let keyPair: CryptoKeyPair
    
    if (type === 'ed25519') {
      keyPair = await crypto.subtle.generateKey({ name: 'Ed25519' } as unknown as EcKeyGenParams, true, ['sign', 'verify'])
    } else {
      keyPair = await crypto.subtle.generateKey({
        name: 'RSASSA-PKCS1-v1_5',
        modulusLength: 4096,
        publicExponent: new Uint8Array([1, 0, 1]),
        hash: 'SHA-256',
      }, true, ['sign', 'verify'])
    }
    
    const publicKeyBuffer = await crypto.subtle.exportKey('spki', keyPair.publicKey)
    const privateKeyBuffer = await crypto.subtle.exportKey('pkcs8', keyPair.privateKey)
    
    const publicKeyBase64 = btoa(String.fromCharCode(...new Uint8Array(publicKeyBuffer)))
    const privateKeyBase64 = btoa(String.fromCharCode(...new Uint8Array(privateKeyBuffer)))
    
    const publicKey = `ssh-${type === 'ed25519' ? 'ed25519' : 'rsa'} ${publicKeyBase64} generated@it-toolbox`
    const privateKey = `-----BEGIN OPENSSH PRIVATE KEY-----\n${privateKeyBase64.match(/.{1,64}/g)!.join('\n')}\n-----END OPENSSH PRIVATE KEY-----`
    
    const fingerprintBuffer = await crypto.subtle.digest('SHA-256', new Uint8Array(publicKeyBuffer))
    const fingerprint = btoa(String.fromCharCode(...new Uint8Array(fingerprintBuffer)))
    
    return {
      ok: true,
      value: { publicKey, privateKey, fingerprint: `SHA256:${fingerprint}` },
    }
  } catch (e) {
    return { ok: false, error: (e as Error).message }
  }
}

// ─── YAML <-> JSON ────────────────────────────────────────────────────────────

export function yamlToJson(yaml: string): Result<string> {
  try {
    const parsed = jsYaml.load(yaml)
    return { ok: true, value: JSON.stringify(parsed, null, 2) }
  } catch (e) {
    return { ok: false, error: (e as Error).message }
  }
}

export function jsonToYaml(json: string): Result<string> {
  try {
    const parsed = JSON.parse(json)
    const yaml = jsYaml.dump(parsed, { indent: 2, lineWidth: -1 })
    return { ok: true, value: yaml }
  } catch (e) {
    return { ok: false, error: (e as Error).message }
  }
}

import * as jsYaml from 'js-yaml'

// ─── XML Formatter ────────────────────────────────────────────────────────────

export function formatXml(xml: string, indent: number = 2): Result<string> {
  try {
    const parser = new DOMParser()
    const doc = parser.parseFromString(xml, 'text/xml')
    const error = doc.querySelector('parsererror')
    if (error) {
      return { ok: false, error: 'Invalid XML: ' + error.textContent }
    }
    
    const format = (node: Node, level: number): string => {
      const indentStr = ' '.repeat(indent * level)
      
      if (node.nodeType === Node.TEXT_NODE) {
        const text = node.textContent?.trim()
        return text ? text : ''
      }
      
      if (node.nodeType === Node.ELEMENT_NODE) {
        const element = node as Element
        const children = Array.from(element.childNodes)
          .filter(c => c.nodeType === Node.ELEMENT_NODE || (c.nodeType === Node.TEXT_NODE && c.textContent?.trim()))
        
        let result = `${indentStr}<${element.tagName}`
        
        for (const attr of Array.from(element.attributes)) {
          result += ` ${attr.name}="${attr.value}"`
        }
        
        if (children.length === 0) {
          result += ' />\n'
        } else if (children.length === 1 && children[0].nodeType === Node.TEXT_NODE) {
          result += `>${children[0].textContent?.trim()}</${element.tagName}>\n`
        } else {
          result += '>\n'
          for (const child of children) {
            result += format(child, level + 1)
          }
          result += `${indentStr}</${element.tagName}>\n`
        }
        return result
      }
      
      return ''
    }
    
    const result = format(doc.documentElement, 0)
    return { ok: true, value: result }
  } catch (e) {
    return { ok: false, error: (e as Error).message }
  }
}

export function minifyXml(xml: string): Result<string> {
  try {
    return { ok: true, value: xml.replace(/>\s+</g, '><').replace(/\s+/g, ' ').trim() }
  } catch (e) {
    return { ok: false, error: (e as Error).message }
  }
}

// ─── Text Diff ────────────────────────────────────────────────────────────────

import * as Diff from 'diff'

export interface DiffResult {
  type: 'added' | 'removed' | 'unchanged'
  value: string
}

export function diffText(oldText: string, newText: string, mode: 'chars' | 'words' | 'lines' = 'lines'): DiffResult[] {
  const diffFn = {
    chars: Diff.diffChars,
    words: Diff.diffWords,
    lines: Diff.diffLines,
  }[mode]
  
  const changes = diffFn(oldText, newText)
  const result: DiffResult[] = []
  
  for (const change of changes) {
    if (change.added) {
      result.push({ type: 'added', value: change.value })
    } else if (change.removed) {
      result.push({ type: 'removed', value: change.value })
    } else {
      result.push({ type: 'unchanged', value: change.value })
    }
  }
  
  return result
}

// ─── Text Transform ───────────────────────────────────────────────────────────

export function transformText(input: string, operations: string[]): Result<string> {
  try {
    let result = input
    
    for (const op of operations) {
      switch (op) {
        case 'uppercase':
          result = result.toUpperCase()
          break
        case 'lowercase':
          result = result.toLowerCase()
          break
        case 'capitalize':
          result = result.replace(/\b\w/g, c => c.toUpperCase())
          break
        case 'reverse':
          result = result.split('').reverse().join('')
          break
        case 'trim':
          result = result.trim()
          break
        case 'dedupe-lines':
          result = [...new Set(result.split('\n'))].join('\n')
          break
        case 'sort-lines':
          result = result.split('\n').sort().join('\n')
          break
        case 'sort-lines-desc':
          result = result.split('\n').sort().reverse().join('\n')
          break
        case 'remove-empty-lines':
          result = result.split('\n').filter(l => l.trim()).join('\n')
          break
        case 'remove-duplicate-lines':
          result = [...new Set(result.split('\n'))].join('\n')
          break
        case 'shuffle-lines':
          const lines = result.split('\n')
          for (let i = lines.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1))
            ;[lines[i], lines[j]] = [lines[j], lines[i]]
          }
          result = lines.join('\n')
          break
        case 'number-lines':
          result = result.split('\n').map((l, i) => `${i + 1}. ${l}`).join('\n')
          break
        case 'trim-lines':
          result = result.split('\n').map(l => l.trim()).join('\n')
          break
      }
    }
    
    return { ok: true, value: result }
  } catch (e) {
    return { ok: false, error: (e as Error).message }
  }
}

// ─── String Escape ────────────────────────────────────────────────────────────

export function escapeString(input: string, language: 'js' | 'python' | 'java' | 'c' | 'json'): Result<string> {
  try {
    let result = input
    
    result = result
      .replace(/\\/g, '\\\\')
      .replace(/"/g, '\\"')
      .replace(/\n/g, '\\n')
      .replace(/\r/g, '\\r')
      .replace(/\t/g, '\\t')
    
    if (language === 'js' || language === 'json') {
      result = result.replace(/'/g, "\\'")
    }
    
    if (language === 'json') {
      result = `"${result}"`
    }
    
    return { ok: true, value: result }
  } catch (e) {
    return { ok: false, error: (e as Error).message }
  }
}

export function unescapeString(input: string): Result<string> {
  try {
    let result = input
    
    if (result.startsWith('"') && result.endsWith('"')) {
      result = result.slice(1, -1)
    }
    
    result = result
      .replace(/\\n/g, '\n')
      .replace(/\\r/g, '\r')
      .replace(/\\t/g, '\t')
      .replace(/\\"/g, '"')
      .replace(/\\'/g, "'")
      .replace(/\\\\/g, '\\')
    
    return { ok: true, value: result }
  } catch (e) {
    return { ok: false, error: (e as Error).message }
  }
}

// ─── Cron Parser ──────────────────────────────────────────────────────────────

import cronParser from 'cron-parser'
import cronstrue from 'cronstrue'

export interface CronResult {
  expression: string
  description: string
  nextDates: Date[]
  fields: {
    minute: string
    hour: string
    dayOfMonth: string
    month: string
    dayOfWeek: string
  }
}

export function parseCron(expression: string, count: number = 5): Result<CronResult> {
  try {
    const interval = cronParser.parseExpression(expression)
    const nextDates: Date[] = []
    for (let i = 0; i < count; i++) {
      nextDates.push(interval.next().toDate())
    }
    
    const description = cronstrue.toString(expression)
    
    const parts = expression.split(' ')
    const fields = {
      minute: parts[0] || '*',
      hour: parts[1] || '*',
      dayOfMonth: parts[2] || '*',
      month: parts[3] || '*',
      dayOfWeek: parts[4] || '*',
    }
    
    return { ok: true, value: { expression, description, nextDates, fields } }
  } catch (e) {
    return { ok: false, error: 'Invalid cron expression: ' + (e as Error).message }
  }
}

// ─── Placeholder Image ────────────────────────────────────────────────────────

export function generatePlaceholderSvg(options: {
  width: number
  height: number
  bgColor: string
  textColor: string
  text?: string
}): string {
  const { width, height, bgColor, textColor, text } = options
  const displayText = text || `${width} × ${height}`
  
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <rect width="100%" height="100%" fill="${bgColor}"/>
  <text x="50%" y="50%" font-family="Arial, sans-serif" font-size="${Math.min(width, height) / 8}" fill="${textColor}" text-anchor="middle" dominant-baseline="middle">${displayText}</text>
</svg>`
}

// ─── Text Similarity ──────────────────────────────────────────────────────────

export function levenshteinDistance(a: string, b: string): number {
  const matrix: number[][] = []
  
  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i]
  }
  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j
  }
  
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1]
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        )
      }
    }
  }
  
  return matrix[b.length][a.length]
}

export function textSimilarity(a: string, b: string): number {
  const maxLen = Math.max(a.length, b.length)
  if (maxLen === 0) return 1
  const distance = levenshteinDistance(a, b)
  return 1 - distance / maxLen
}

// ─── CSS Gradient ─────────────────────────────────────────────────────────────

export interface GradientStop {
  color: string
  position: number
}

export interface GradientConfig {
  type: 'linear' | 'radial' | 'conic'
  angle: number
  stops: GradientStop[]
}

export function generateCssGradient(config: GradientConfig): string {
  const stopsStr = config.stops
    .map(s => `${s.color} ${s.position}%`)
    .join(', ')
  
  switch (config.type) {
    case 'linear':
      return `linear-gradient(${config.angle}deg, ${stopsStr})`
    case 'radial':
      return `radial-gradient(circle, ${stopsStr})`
    case 'conic':
      return `conic-gradient(from ${config.angle}deg, ${stopsStr})`
  }
}

// ─── Color Palette ────────────────────────────────────────────────────────────

export function generateColorPalette(baseColor: string, scheme: 'analogous' | 'complementary' | 'triadic' | 'tetradic'): string[] {
  const rgb = parseHex(baseColor)
  if (!rgb.ok) return []
  
  const hsl = rgbToHsl(rgb.value)
  const colors: string[] = []
  
  switch (scheme) {
    case 'analogous':
      colors.push(
        rgbToHex(hslToRgb({ h: (hsl.h - 30 + 360) % 360, s: hsl.s, l: hsl.l })),
        baseColor,
        rgbToHex(hslToRgb({ h: (hsl.h + 30) % 360, s: hsl.s, l: hsl.l }))
      )
      break
    case 'complementary':
      colors.push(
        baseColor,
        rgbToHex(hslToRgb({ h: (hsl.h + 180) % 360, s: hsl.s, l: hsl.l }))
      )
      break
    case 'triadic':
      colors.push(
        baseColor,
        rgbToHex(hslToRgb({ h: (hsl.h + 120) % 360, s: hsl.s, l: hsl.l })),
        rgbToHex(hslToRgb({ h: (hsl.h + 240) % 360, s: hsl.s, l: hsl.l }))
      )
      break
    case 'tetradic':
      colors.push(
        baseColor,
        rgbToHex(hslToRgb({ h: (hsl.h + 90) % 360, s: hsl.s, l: hsl.l })),
        rgbToHex(hslToRgb({ h: (hsl.h + 180) % 360, s: hsl.s, l: hsl.l })),
        rgbToHex(hslToRgb({ h: (hsl.h + 270) % 360, s: hsl.s, l: hsl.l }))
      )
      break
  }
  
  return colors
}

// ─── WCAG Contrast ────────────────────────────────────────────────────────────

function getLuminance(rgb: RGB): number {
  const [r, g, b] = [rgb.r, rgb.g, rgb.b].map(v => {
    v /= 255
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4)
  })
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

export function getContrastRatio(foreground: string, background: string): Result<number> {
  const fgRgb = parseHex(foreground)
  const bgRgb = parseHex(background)
  
  if (!fgRgb.ok) return { ok: false, error: 'Invalid foreground color' }
  if (!bgRgb.ok) return { ok: false, error: 'Invalid background color' }
  
  const fgLum = getLuminance(fgRgb.value)
  const bgLum = getLuminance(bgRgb.value)
  
  const lighter = Math.max(fgLum, bgLum)
  const darker = Math.min(fgLum, bgLum)
  
  const ratio = (lighter + 0.05) / (darker + 0.05)
  return { ok: true, value: ratio }
}

export interface ContrastResult {
  ratio: number
  aaNormal: boolean
  aaLarge: boolean
  aaaNormal: boolean
  aaaLarge: boolean
}

export function checkContrast(foreground: string, background: string): Result<ContrastResult> {
  const ratioResult = getContrastRatio(foreground, background)
  if (!ratioResult.ok) return ratioResult as Result<ContrastResult>
  
  const ratio = ratioResult.value
  
  return {
    ok: true,
    value: {
      ratio,
      aaNormal: ratio >= 4.5,
      aaLarge: ratio >= 3,
      aaaNormal: ratio >= 7,
      aaaLarge: ratio >= 4.5,
    },
  }
}

// ─── Box Shadow ───────────────────────────────────────────────────────────────

export interface BoxShadowConfig {
  x: number
  y: number
  blur: number
  spread: number
  color: string
  inset: boolean
}

export function generateBoxShadow(configs: BoxShadowConfig[]): string {
  return configs
    .map(c => `${c.inset ? 'inset ' : ''}${c.x}px ${c.y}px ${c.blur}px ${c.spread}px ${c.color}`)
    .join(', ')
}

// ─── HTTP Status Codes ────────────────────────────────────────────────────────

export interface HttpStatus {
  code: number
  message: string
  description: string
  category: 'informational' | 'success' | 'redirection' | 'client-error' | 'server-error'
}

export const HTTP_STATUS_CODES: HttpStatus[] = [
  { code: 100, message: 'Continue', description: '服务器已收到请求的初始部分，客户端应继续发送剩余部分', category: 'informational' },
  { code: 101, message: 'Switching Protocols', description: '服务器理解并同意客户端的协议切换请求', category: 'informational' },
  { code: 102, message: 'Processing', description: '服务器已收到请求，但仍在处理中', category: 'informational' },
  { code: 200, message: 'OK', description: '请求成功', category: 'success' },
  { code: 201, message: 'Created', description: '请求成功并创建了新资源', category: 'success' },
  { code: 202, message: 'Accepted', description: '请求已接受，但尚未处理完成', category: 'success' },
  { code: 204, message: 'No Content', description: '请求成功，但无返回内容', category: 'success' },
  { code: 206, message: 'Partial Content', description: '服务器成功处理了部分GET请求', category: 'success' },
  { code: 300, message: 'Multiple Choices', description: '请求有多个可能的响应', category: 'redirection' },
  { code: 301, message: 'Moved Permanently', description: '请求的资源已永久移动到新位置', category: 'redirection' },
  { code: 302, message: 'Found', description: '请求的资源临时从不同的URI响应', category: 'redirection' },
  { code: 304, message: 'Not Modified', description: '资源未修改，使用缓存版本', category: 'redirection' },
  { code: 307, message: 'Temporary Redirect', description: '临时重定向，保持请求方法', category: 'redirection' },
  { code: 308, message: 'Permanent Redirect', description: '永久重定向，保持请求方法', category: 'redirection' },
  { code: 400, message: 'Bad Request', description: '服务器无法理解请求的格式', category: 'client-error' },
  { code: 401, message: 'Unauthorized', description: '请求需要身份验证', category: 'client-error' },
  { code: 403, message: 'Forbidden', description: '服务器拒绝请求', category: 'client-error' },
  { code: 404, message: 'Not Found', description: '请求的资源不存在', category: 'client-error' },
  { code: 405, message: 'Method Not Allowed', description: '请求方法不被允许', category: 'client-error' },
  { code: 408, message: 'Request Timeout', description: '服务器等待请求超时', category: 'client-error' },
  { code: 409, message: 'Conflict', description: '请求与服务器当前状态冲突', category: 'client-error' },
  { code: 410, message: 'Gone', description: '请求的资源已永久删除', category: 'client-error' },
  { code: 413, message: 'Payload Too Large', description: '请求实体过大', category: 'client-error' },
  { code: 414, message: 'URI Too Long', description: '请求的URI过长', category: 'client-error' },
  { code: 415, message: 'Unsupported Media Type', description: '不支持的媒体类型', category: 'client-error' },
  { code: 422, message: 'Unprocessable Entity', description: '请求格式正确，但语义错误', category: 'client-error' },
  { code: 429, message: 'Too Many Requests', description: '请求过于频繁', category: 'client-error' },
  { code: 500, message: 'Internal Server Error', description: '服务器内部错误', category: 'server-error' },
  { code: 501, message: 'Not Implemented', description: '服务器不支持请求的功能', category: 'server-error' },
  { code: 502, message: 'Bad Gateway', description: '网关错误', category: 'server-error' },
  { code: 503, message: 'Service Unavailable', description: '服务暂时不可用', category: 'server-error' },
  { code: 504, message: 'Gateway Timeout', description: '网关超时', category: 'server-error' },
]

export function searchHttpStatus(query: string): HttpStatus[] {
  const q = query.toLowerCase()
  return HTTP_STATUS_CODES.filter(
    s => s.code.toString() === query ||
         s.message.toLowerCase().includes(q) ||
         s.description.includes(q)
  )
}

// ─── HTTP Headers ─────────────────────────────────────────────────────────────

export interface HttpHeader {
  name: string
  category: 'request' | 'response' | 'entity' | 'general'
  description: string
  example?: string
}

export const HTTP_HEADERS: HttpHeader[] = [
  { name: 'Accept', category: 'request', description: '客户端可接受的响应内容类型', example: 'Accept: text/html, application/json' },
  { name: 'Accept-Encoding', category: 'request', description: '客户端可接受的内容编码方式', example: 'Accept-Encoding: gzip, deflate, br' },
  { name: 'Accept-Language', category: 'request', description: '客户端可接受的自然语言', example: 'Accept-Language: zh-CN, en;q=0.9' },
  { name: 'Authorization', category: 'request', description: '身份验证凭据', example: 'Authorization: Bearer <token>' },
  { name: 'Cache-Control', category: 'general', description: '缓存控制指令', example: 'Cache-Control: max-age=3600' },
  { name: 'Content-Type', category: 'entity', description: '请求体的媒体类型', example: 'Content-Type: application/json' },
  { name: 'Content-Length', category: 'entity', description: '请求体的大小（字节）', example: 'Content-Length: 1234' },
  { name: 'Content-Encoding', category: 'entity', description: '内容的编码方式', example: 'Content-Encoding: gzip' },
  { name: 'Cookie', category: 'request', description: '发送给服务器的Cookie', example: 'Cookie: session=abc123' },
  { name: 'Host', category: 'request', description: '请求的目标主机', example: 'Host: example.com' },
  { name: 'User-Agent', category: 'request', description: '客户端信息', example: 'User-Agent: Mozilla/5.0...' },
  { name: 'Content-Security-Policy', category: 'response', description: '内容安全策略', example: 'Content-Security-Policy: default-src \'self\'' },
  { name: 'ETag', category: 'response', description: '资源的版本标识', example: 'ETag: "abc123"' },
  { name: 'Location', category: 'response', description: '重定向目标URL', example: 'Location: https://example.com/new' },
  { name: 'Server', category: 'response', description: '服务器软件信息', example: 'Server: nginx/1.18.0' },
  { name: 'Set-Cookie', category: 'response', description: '设置Cookie', example: 'Set-Cookie: session=abc123; HttpOnly' },
  { name: 'Strict-Transport-Security', category: 'response', description: 'HSTS，强制使用HTTPS', example: 'Strict-Transport-Security: max-age=31536000' },
  { name: 'X-Content-Type-Options', category: 'response', description: '防止MIME类型嗅探', example: 'X-Content-Type-Options: nosniff' },
  { name: 'X-Frame-Options', category: 'response', description: '防止点击劫持', example: 'X-Frame-Options: DENY' },
  { name: 'X-XSS-Protection', category: 'response', description: 'XSS保护', example: 'X-XSS-Protection: 1; mode=block' },
]

export function searchHttpHeaders(query: string): HttpHeader[] {
  const q = query.toLowerCase()
  return HTTP_HEADERS.filter(
    h => h.name.toLowerCase().includes(q) ||
         h.description.includes(q) ||
         h.category.includes(q)
  )
}

// ─── MIME Types ───────────────────────────────────────────────────────────────

export interface MimeType {
  extension: string
  mimeType: string
  description: string
}

export const MIME_TYPES: MimeType[] = [
  { extension: '.json', mimeType: 'application/json', description: 'JSON 数据' },
  { extension: '.xml', mimeType: 'application/xml', description: 'XML 文档' },
  { extension: '.html', mimeType: 'text/html', description: 'HTML 文档' },
  { extension: '.css', mimeType: 'text/css', description: 'CSS 样式表' },
  { extension: '.js', mimeType: 'application/javascript', description: 'JavaScript 脚本' },
  { extension: '.ts', mimeType: 'application/typescript', description: 'TypeScript 脚本' },
  { extension: '.png', mimeType: 'image/png', description: 'PNG 图片' },
  { extension: '.jpg', mimeType: 'image/jpeg', description: 'JPEG 图片' },
  { extension: '.jpeg', mimeType: 'image/jpeg', description: 'JPEG 图片' },
  { extension: '.gif', mimeType: 'image/gif', description: 'GIF 图片' },
  { extension: '.svg', mimeType: 'image/svg+xml', description: 'SVG 矢量图' },
  { extension: '.webp', mimeType: 'image/webp', description: 'WebP 图片' },
  { extension: '.ico', mimeType: 'image/x-icon', description: '图标文件' },
  { extension: '.pdf', mimeType: 'application/pdf', description: 'PDF 文档' },
  { extension: '.zip', mimeType: 'application/zip', description: 'ZIP 压缩包' },
  { extension: '.tar', mimeType: 'application/x-tar', description: 'TAR 归档' },
  { extension: '.gz', mimeType: 'application/gzip', description: 'GZIP 压缩' },
  { extension: '.mp3', mimeType: 'audio/mpeg', description: 'MP3 音频' },
  { extension: '.mp4', mimeType: 'video/mp4', description: 'MP4 视频' },
  { extension: '.webm', mimeType: 'video/webm', description: 'WebM 视频' },
  { extension: '.woff', mimeType: 'font/woff', description: 'WOFF 字体' },
  { extension: '.woff2', mimeType: 'font/woff2', description: 'WOFF2 字体' },
  { extension: '.ttf', mimeType: 'font/ttf', description: 'TrueType 字体' },
  { extension: '.otf', mimeType: 'font/otf', description: 'OpenType 字体' },
  { extension: '.csv', mimeType: 'text/csv', description: 'CSV 表格' },
  { extension: '.txt', mimeType: 'text/plain', description: '纯文本' },
  { extension: '.md', mimeType: 'text/markdown', description: 'Markdown 文档' },
  { extension: '.yaml', mimeType: 'application/x-yaml', description: 'YAML 文档' },
  { extension: '.yml', mimeType: 'application/x-yaml', description: 'YAML 文档' },
  { extension: '.toml', mimeType: 'application/toml', description: 'TOML 文档' },
]

export function searchMimeTypes(query: string): MimeType[] {
  const q = query.toLowerCase()
  return MIME_TYPES.filter(
    m => m.extension.includes(q) ||
         m.mimeType.includes(q) ||
         m.description.includes(q)
  )
}

// ─── IP Subnet Calculator ─────────────────────────────────────────────────────

export interface SubnetResult {
  networkAddress: string
  broadcastAddress: string
  firstHost: string
  lastHost: string
  totalHosts: number
  usableHosts: number
  subnetMask: string
  cidr: number
}

export function calculateSubnet(ip: string, cidr: number): Result<SubnetResult> {
  try {
    const parts = ip.split('.').map(Number)
    if (parts.length !== 4 || parts.some(p => isNaN(p) || p < 0 || p > 255)) {
      return { ok: false, error: 'Invalid IP address' }
    }
    if (cidr < 0 || cidr > 32) {
      return { ok: false, error: 'CIDR must be between 0 and 32' }
    }
    
    const ipNum = (parts[0] << 24) + (parts[1] << 16) + (parts[2] << 8) + parts[3]
    const mask = cidr === 0 ? 0 : (~0 << (32 - cidr)) >>> 0
    const network = (ipNum & mask) >>> 0
    const broadcast = (network | (~mask >>> 0)) >>> 0
    
    const numToIp = (n: number) => [
      (n >>> 24) & 255,
      (n >>> 16) & 255,
      (n >>> 8) & 255,
      n & 255,
    ].join('.')
    
    const subnetMask = numToIp(mask)
    const totalHosts = Math.pow(2, 32 - cidr)
    const usableHosts = cidr >= 31 ? totalHosts : totalHosts - 2
    
    return {
      ok: true,
      value: {
        networkAddress: numToIp(network),
        broadcastAddress: numToIp(broadcast),
        firstHost: cidr >= 31 ? numToIp(network) : numToIp(network + 1),
        lastHost: cidr >= 31 ? numToIp(broadcast) : numToIp(broadcast - 1),
        totalHosts,
        usableHosts,
        subnetMask,
        cidr,
      },
    }
  } catch (e) {
    return { ok: false, error: (e as Error).message }
  }
}

// ─── Date Calculator ──────────────────────────────────────────────────────────

export interface DateDiff {
  years: number
  months: number
  days: number
  totalDays: number
  weeks: number
  hours: number
  minutes: number
  seconds: number
}

export function dateDifference(date1: Date, date2: Date): DateDiff {
  const ms = Math.abs(date2.getTime() - date1.getTime())
  const seconds = Math.floor(ms / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  const totalDays = Math.floor(hours / 24)
  const weeks = Math.floor(totalDays / 7)
  
  let years = date2.getFullYear() - date1.getFullYear()
  let months = date2.getMonth() - date1.getMonth()
  let days = date2.getDate() - date1.getDate()
  
  if (days < 0) {
    months--
    const prevMonth = new Date(date2.getFullYear(), date2.getMonth(), 0)
    days += prevMonth.getDate()
  }
  if (months < 0) {
    years--
    months += 12
  }
  
  return { years, months, days, totalDays, weeks, hours, minutes, seconds }
}

export function addDays(date: Date, days: number): Date {
  const result = new Date(date)
  result.setDate(result.getDate() + days)
  return result
}

export function addMonths(date: Date, months: number): Date {
  const result = new Date(date)
  result.setMonth(result.getMonth() + months)
  return result
}

export function addYears(date: Date, years: number): Date {
  const result = new Date(date)
  result.setFullYear(result.getFullYear() + years)
  return result
}

// ─── Duration Format ──────────────────────────────────────────────────────────

export function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60
  
  if (h > 0) {
    return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
  }
  return `${m}:${s.toString().padStart(2, '0')}`
}

export function parseDuration(input: string): Result<number> {
  try {
    if (/^\d+$/.test(input)) {
      return { ok: true, value: parseInt(input, 10) }
    }
    
    const match = input.match(/^(\d+):(\d+)(?::(\d+))?$/)
    if (match) {
      const h = parseInt(match[1], 10)
      const m = parseInt(match[2], 10)
      const s = match[3] ? parseInt(match[3], 10) : 0
      return { ok: true, value: h * 3600 + m * 60 + s }
    }
    
    return { ok: false, error: 'Invalid duration format' }
  } catch (e) {
    return { ok: false, error: (e as Error).message }
  }
}

export function humanizeDuration(seconds: number): string {
  if (seconds < 60) return `${seconds} 秒`
  if (seconds < 3600) return `${Math.floor(seconds / 60)} 分钟`
  if (seconds < 86400) return `${Math.floor(seconds / 3600)} 小时`
  if (seconds < 2592000) return `${Math.floor(seconds / 86400)} 天`
  if (seconds < 31536000) return `${Math.floor(seconds / 2592000)} 个月`
  return `${Math.floor(seconds / 31536000)} 年`
}

// ─── Calendar Generator ───────────────────────────────────────────────────────

export interface CalendarDay {
  date: Date
  day: number
  isToday: boolean
  isCurrentMonth: boolean
  isWeekend: boolean
}

export function generateCalendar(year: number, month: number): CalendarDay[][] {
  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  
  const days: CalendarDay[] = []
  
  const startPadding = firstDay.getDay()
  const prevMonth = new Date(year, month, 0)
  for (let i = startPadding - 1; i >= 0; i--) {
    const date = new Date(year, month - 1, prevMonth.getDate() - i)
    days.push({
      date,
      day: date.getDate(),
      isToday: false,
      isCurrentMonth: false,
      isWeekend: date.getDay() === 0 || date.getDay() === 6,
    })
  }
  
  for (let i = 1; i <= lastDay.getDate(); i++) {
    const date = new Date(year, month, i)
    days.push({
      date,
      day: i,
      isToday: date.getTime() === today.getTime(),
      isCurrentMonth: true,
      isWeekend: date.getDay() === 0 || date.getDay() === 6,
    })
  }
  
  const endPadding = 42 - days.length
  for (let i = 1; i <= endPadding; i++) {
    const date = new Date(year, month + 1, i)
    days.push({
      date,
      day: i,
      isToday: false,
      isCurrentMonth: false,
      isWeekend: date.getDay() === 0 || date.getDay() === 6,
    })
  }
  
  const weeks: CalendarDay[][] = []
  for (let i = 0; i < days.length; i += 7) {
    weeks.push(days.slice(i, i + 7))
  }
  
  return weeks
}

// ─── ID Generators ────────────────────────────────────────────────────────────

import { nanoid } from 'nanoid'
import { ulid } from 'ulid'

export function generateNanoId(size: number = 21): string {
  return nanoid(size)
}

export function generateNanoIds(count: number, size: number = 21): string[] {
  return Array.from({ length: count }, () => nanoid(size))
}

export function generateUlid(): string {
  return ulid()
}

export function generateUlids(count: number): string[] {
  return Array.from({ length: count }, () => ulid())
}

export interface ObjectIdInfo {
  id: string
  timestamp: Date
  machineId: string
  processId: string
  counter: number
}

export function generateObjectId(): string {
  const timestamp = Math.floor(Date.now() / 1000).toString(16).padStart(8, '0')
  const machineId = Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0')
  const processId = Math.floor(Math.random() * 65535).toString(16).padStart(4, '0')
  const counter = Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0')
  return timestamp + machineId + processId + counter
}

export function parseObjectId(id: string): Result<ObjectIdInfo> {
  try {
    if (id.length !== 24 || !/^[0-9a-fA-F]+$/.test(id)) {
      return { ok: false, error: 'Invalid ObjectId format' }
    }
    
    const timestamp = parseInt(id.slice(0, 8), 16)
    return {
      ok: true,
      value: {
        id,
        timestamp: new Date(timestamp * 1000),
        machineId: id.slice(8, 14),
        processId: id.slice(14, 18),
        counter: parseInt(id.slice(18, 24), 16),
      },
    }
  } catch (e) {
    return { ok: false, error: (e as Error).message }
  }
}

// ─── Faker Data Generator ─────────────────────────────────────────────────────

import { faker } from '@faker-js/faker/locale/zh_CN'

export function generateFakeData(type: string, count: number = 1): unknown[] {
  const generators: Record<string, () => unknown> = {
    'name': () => faker.person.fullName(),
    'firstName': () => faker.person.firstName(),
    'lastName': () => faker.person.lastName(),
    'email': () => faker.internet.email(),
    'phone': () => faker.phone.number(),
    'address': () => faker.location.streetAddress(),
    'city': () => faker.location.city(),
    'country': () => faker.location.country(),
    'company': () => faker.company.name(),
    'jobTitle': () => faker.person.jobTitle(),
    'username': () => faker.internet.username(),
    'password': () => faker.internet.password(),
    'url': () => faker.internet.url(),
    'ip': () => faker.internet.ipv4(),
    'ipv6': () => faker.internet.ipv6(),
    'mac': () => faker.internet.mac(),
    'uuid': () => faker.string.uuid(),
    'date': () => faker.date.recent().toISOString(),
    'pastDate': () => faker.date.past().toISOString(),
    'futureDate': () => faker.date.future().toISOString(),
    'number': () => faker.number.int({ min: 1, max: 1000 }),
    'float': () => faker.number.float({ min: 0, max: 100, fractionDigits: 2 }),
    'boolean': () => faker.datatype.boolean(),
    'word': () => faker.word.sample(),
    'sentence': () => faker.lorem.sentence(),
    'paragraph': () => faker.lorem.paragraph(),
    'creditCard': () => faker.finance.creditCardNumber(),
    'currency': () => faker.finance.currencyCode(),
    'bitcoin': () => faker.finance.bitcoinAddress(),
    'color': () => faker.internet.color(),
    'emoji': () => faker.internet.emoji(),
    'avatar': () => faker.image.avatar(),
    'imageUrl': () => faker.image.url(),
  }
  
  const generator = generators[type] || generators['word']
  return Array.from({ length: count }, generator)
}

export function generateFakeJson(schema: Record<string, string>, count: number = 1): unknown[] {
  return Array.from({ length: count }, () => {
    const obj: Record<string, unknown> = {}
    for (const [key, type] of Object.entries(schema)) {
      const data = generateFakeData(type, 1)
      obj[key] = data[0]
    }
    return obj
  })
}

// ─── User Agent Parser ────────────────────────────────────────────────────────

import UAParser from 'ua-parser-js'

export interface UaResult {
  browser: { name: string; version: string }
  os: { name: string; version: string }
  device: { type: string; vendor: string; model: string }
  engine: { name: string; version: string }
  cpu: { architecture: string }
}

export function parseUserAgent(ua: string): UaResult {
  const parser = new UAParser(ua)
  const result = parser.getResult()
  
  return {
    browser: {
      name: result.browser.name || '',
      version: result.browser.version || '',
    },
    os: {
      name: result.os.name || '',
      version: result.os.version || '',
    },
    device: {
      type: result.device.type || 'desktop',
      vendor: result.device.vendor || '',
      model: result.device.model || '',
    },
    engine: {
      name: result.engine.name || '',
      version: result.engine.version || '',
    },
    cpu: {
      architecture: result.cpu.architecture || '',
    },
  }
}

// ─── cURL Converter ───────────────────────────────────────────────────────────

import * as curlConverter from 'curlconverter'

export interface CurlConversion {
  fetch: string
  axios: string
  python: string
  go: string
  php: string
}

export function convertCurl(curlCommand: string): Result<CurlConversion> {
  try {
    const trimmed = curlCommand.trim()
    if (!trimmed.startsWith('curl')) {
      return { ok: false, error: 'Command must start with "curl"' }
    }
    
    const cc = curlConverter as unknown as Record<string, (cmd: string) => string>
    return {
      ok: true,
      value: {
        fetch: cc.toFetch(trimmed),
        axios: cc.toAxios(trimmed),
        python: cc.toPython(trimmed),
        go: cc.toGo(trimmed),
        php: cc.toPhp(trimmed),
      },
    }
  } catch (e) {
    return { ok: false, error: 'Failed to parse cURL command: ' + (e as Error).message }
  }
}

// ─── Timezone ─────────────────────────────────────────────────────────────────

export const TIMEZONES = [
  { value: 'Asia/Shanghai', label: '北京时间 (UTC+8)', offset: 8 },
  { value: 'Asia/Tokyo', label: '东京 (UTC+9)', offset: 9 },
  { value: 'Asia/Seoul', label: '首尔 (UTC+9)', offset: 9 },
  { value: 'Asia/Singapore', label: '新加坡 (UTC+8)', offset: 8 },
  { value: 'Asia/Hong_Kong', label: '香港 (UTC+8)', offset: 8 },
  { value: 'Asia/Dubai', label: '迪拜 (UTC+4)', offset: 4 },
  { value: 'Europe/London', label: '伦敦 (UTC+0/+1)', offset: 0 },
  { value: 'Europe/Paris', label: '巴黎 (UTC+1/+2)', offset: 1 },
  { value: 'Europe/Berlin', label: '柏林 (UTC+1/+2)', offset: 1 },
  { value: 'Europe/Moscow', label: '莫斯科 (UTC+3)', offset: 3 },
  { value: 'America/New_York', label: '纽约 (UTC-5/-4)', offset: -5 },
  { value: 'America/Los_Angeles', label: '洛杉矶 (UTC-8/-7)', offset: -8 },
  { value: 'America/Chicago', label: '芝加哥 (UTC-6/-5)', offset: -6 },
  { value: 'America/Sao_Paulo', label: '圣保罗 (UTC-3)', offset: -3 },
  { value: 'Australia/Sydney', label: '悉尼 (UTC+10/+11)', offset: 10 },
  { value: 'Pacific/Auckland', label: '奥克兰 (UTC+12/+13)', offset: 12 },
  { value: 'UTC', label: 'UTC', offset: 0 },
]

// ─── Tailwind Colors ──────────────────────────────────────────────────────────

export const TAILWIND_COLORS: Record<string, Record<string, string>> = {
  slate: {
    50: '#f8fafc', 100: '#f1f5f9', 200: '#e2e8f0', 300: '#cbd5e1',
    400: '#94a3b8', 500: '#64748b', 600: '#475569', 700: '#334155',
    800: '#1e293b', 900: '#0f172a', 950: '#020617',
  },
  gray: {
    50: '#f9fafb', 100: '#f3f4f6', 200: '#e5e7eb', 300: '#d1d5db',
    400: '#9ca3af', 500: '#6b7280', 600: '#4b5563', 700: '#374151',
    800: '#1f2937', 900: '#111827', 950: '#030712',
  },
  red: {
    50: '#fef2f2', 100: '#fee2e2', 200: '#fecaca', 300: '#fca5a5',
    400: '#f87171', 500: '#ef4444', 600: '#dc2626', 700: '#b91c1c',
    800: '#991b1b', 900: '#7f1d1d', 950: '#450a0a',
  },
  orange: {
    50: '#fff7ed', 100: '#ffedd5', 200: '#fed7aa', 300: '#fdba74',
    400: '#fb923c', 500: '#f97316', 600: '#ea580c', 700: '#c2410c',
    800: '#9a3412', 900: '#7c2d12', 950: '#431407',
  },
  yellow: {
    50: '#fefce8', 100: '#fef9c3', 200: '#fef08a', 300: '#fde047',
    400: '#facc15', 500: '#eab308', 600: '#ca8a04', 700: '#a16207',
    800: '#854d0e', 900: '#713f12', 950: '#422006',
  },
  green: {
    50: '#f0fdf4', 100: '#dcfce7', 200: '#bbf7d0', 300: '#86efac',
    400: '#4ade80', 500: '#22c55e', 600: '#16a34a', 700: '#15803d',
    800: '#166534', 900: '#14532d', 950: '#052e16',
  },
  blue: {
    50: '#eff6ff', 100: '#dbeafe', 200: '#bfdbfe', 300: '#93c5fd',
    400: '#60a5fa', 500: '#3b82f6', 600: '#2563eb', 700: '#1d4ed8',
    800: '#1e40af', 900: '#1e3a8a', 950: '#172554',
  },
  indigo: {
    50: '#eef2ff', 100: '#e0e7ff', 200: '#c7d2fe', 300: '#a5b4fc',
    400: '#818cf8', 500: '#6366f1', 600: '#4f46e5', 700: '#4338ca',
    800: '#3730a3', 900: '#312e81', 950: '#1e1b4b',
  },
  purple: {
    50: '#faf5ff', 100: '#f3e8ff', 200: '#e9d5ff', 300: '#d8b4fe',
    400: '#c084fc', 500: '#a855f7', 600: '#9333ea', 700: '#7e22ce',
    800: '#6b21a8', 900: '#581c87', 950: '#3b0764',
  },
  pink: {
    50: '#fdf2f8', 100: '#fce7f3', 200: '#fbcfe8', 300: '#f9a8d4',
    400: '#f472b6', 500: '#ec4899', 600: '#db2777', 700: '#be185d',
    800: '#9d174d', 900: '#831843', 950: '#500724',
  },
}

// ─── Color Blindness Simulation ───────────────────────────────────────────────

export type ColorBlindnessType = 'protanopia' | 'deuteranopia' | 'tritanopia' | 
  'protanomaly' | 'deuteranomaly' | 'tritanomaly' | 'achromatopsia' | 'achromatomaly'

export function simulateColorBlindness(hex: string, type: ColorBlindnessType): string {
  const rgbResult = parseHex(hex)
  if (!rgbResult.ok) return hex
  
  const { r, g, b } = rgbResult.value
  
  const matrices: Record<ColorBlindnessType, number[][]> = {
    protanopia: [[0.567, 0.433, 0], [0.558, 0.442, 0], [0, 0.242, 0.758]],
    deuteranopia: [[0.625, 0.375, 0], [0.7, 0.3, 0], [0, 0.3, 0.7]],
    tritanopia: [[0.95, 0.05, 0], [0, 0.433, 0.567], [0, 0.475, 0.525]],
    protanomaly: [[0.817, 0.183, 0], [0.333, 0.667, 0], [0, 0.125, 0.875]],
    deuteranomaly: [[0.8, 0.2, 0], [0.258, 0.742, 0], [0, 0.142, 0.858]],
    tritanomaly: [[0.967, 0.033, 0], [0, 0.733, 0.267], [0, 0.183, 0.817]],
    achromatopsia: [[0.299, 0.587, 0.114], [0.299, 0.587, 0.114], [0.299, 0.587, 0.114]],
    achromatomaly: [[0.618, 0.32, 0.062], [0.163, 0.775, 0.062], [0.163, 0.32, 0.516]],
  }
  
  const matrix = matrices[type]
  const newR = Math.round(matrix[0][0] * r + matrix[0][1] * g + matrix[0][2] * b)
  const newG = Math.round(matrix[1][0] * r + matrix[1][1] * g + matrix[1][2] * b)
  const newB = Math.round(matrix[2][0] * r + matrix[2][1] * g + matrix[2][2] * b)
  
  return rgbToHex({ r: Math.min(255, Math.max(0, newR)), g: Math.min(255, Math.max(0, newG)), b: Math.min(255, Math.max(0, newB)) })
}
