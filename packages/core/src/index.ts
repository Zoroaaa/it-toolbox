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
