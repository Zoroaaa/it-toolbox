export interface RegexMatch {
  match: string
  start: number
  end: number
  groups: Record<string, string> | null
}

export interface RegexResult {
  matches: RegexMatch[]
  error?: string
  truncated?: boolean
}

const MAX_REGEX_MATCHES = 2000

export function testRegex(pattern: string, input: string, flags: string = 'g'): RegexResult {
  try {
    const regex = new RegExp(pattern, flags)
    const matches: RegexMatch[] = []
    let truncated = false

    if (flags.includes('g')) {
      let match
      while ((match = regex.exec(input)) !== null) {
        matches.push({
          match: match[0],
          start: match.index,
          end: match.index + match[0].length,
          groups: match.groups || null,
        })
        if (matches.length >= MAX_REGEX_MATCHES) {
          truncated = true
          break
        }
        // 零宽匹配时 lastIndex 不会前进，需手动推进，否则会无限循环卡死线程
        if (match[0].length === 0) {
          regex.lastIndex++
        }
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

    return { matches, truncated }
  } catch (e) {
    return { matches: [], error: (e as Error).message }
  }
}
