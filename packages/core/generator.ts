import { Result } from './common'
import { nanoid } from 'nanoid'
import { ulid } from 'ulid'
import { faker } from '@faker-js/faker/locale/zh_CN'

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
