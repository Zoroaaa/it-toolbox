import { Result } from './common'

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
        case 'shuffle-lines': {
          const lines = result.split('\n')
          for (let i = lines.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1))
            ;[lines[i], lines[j]] = [lines[j], lines[i]]
          }
          result = lines.join('\n')
          break
        }
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
