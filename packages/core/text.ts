import { Result } from './common'
import * as Diff from 'diff'
import cronParser from 'cron-parser'
import cronstrue from 'cronstrue'

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
