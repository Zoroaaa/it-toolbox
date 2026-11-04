import { describe, it, expect } from 'vitest'
import {
  convertCase,
  countText,
  transformText,
  escapeString,
  unescapeString,
  levenshteinDistance,
  textSimilarity,
} from '@core/text'
import { diffText } from '@core/text-diff'
import { parseCron } from '@core/text-cron'

const ok = <T,>(r: { ok: true; value: T } | { ok: false; error: string }): T => {
  if (!r.ok) throw new Error(r.error)
  return r.value
}

describe('命名转换', () => {
  it.each([
    ['hello world', 'camel', 'helloWorld'],
    ['hello world', 'pascal', 'HelloWorld'],
    ['hello world', 'snake', 'hello_world'],
    ['hello world', 'kebab', 'hello-world'],
    ['hello world', 'constant', 'HELLO_WORLD'],
    ['hello world', 'title', 'Hello World'],
    ['hello world', 'sentence', 'Hello world'],
    ['hello world', 'upper', 'HELLO WORLD'],
    ['hello world', 'lower', 'hello world'],
    ['helloWorld', 'snake', 'hello_world'],
    ['HTTPServer', 'kebab', 'httpserver'],
    ['a-b_c d', 'camel', 'aBCD'],
  ] as const)('convertCase(%s, %s)', (input, type, expected) => {
    expect(ok(convertCase(input, type))).toBe(expected)
  })

  it('空字符串返回空', () => {
    expect(ok(convertCase('', 'camel'))).toBe('')
  })
})

describe('文本统计', () => {
  it('统计字符/单词/行/段落', () => {
    const stats = countText('hello world\n\nsecond line')
    expect(stats.characters).toBe(24)
    expect(stats.charactersNoSpaces).toBe(20)
    expect(stats.words).toBe(4)
    expect(stats.lines).toBe(3)
    expect(stats.paragraphs).toBe(2)
  })

  it('统计中文与字节数', () => {
    const stats = countText('中文测试')
    expect(stats.characters).toBe(4)
    expect(stats.bytes).toBe(12)
    expect(stats.words).toBe(1)
  })

  it('空文本各计数为 0', () => {
    const stats = countText('')
    expect(stats).toMatchObject({ characters: 0, words: 0, lines: 0, paragraphs: 0, bytes: 0 })
    expect(stats.readingTime).toBe('不到1分钟')
  })

  it('统计句子数', () => {
    expect(countText('A. B! C?。').sentences).toBe(3)
  })
})

describe('文本 Diff', () => {
  it('行级差异包含增删', () => {
    const result = diffText('a\nb', 'a\nc', 'lines')
    expect(result.some((r) => r.type === 'removed' && r.value.includes('b'))).toBe(true)
    expect(result.some((r) => r.type === 'added' && r.value.includes('c'))).toBe(true)
    expect(result.some((r) => r.type === 'unchanged' && r.value.includes('a'))).toBe(true)
  })

  it('字符级差异', () => {
    const result = diffText('abc', 'adc', 'chars')
    expect(result.map((r) => r.type)).toContain('removed')
    expect(result.map((r) => r.type)).toContain('added')
  })

  it('相同文本全部 unchanged', () => {
    expect(diffText('same', 'same').every((r) => r.type === 'unchanged')).toBe(true)
  })
})

describe('文本变换', () => {
  it('按顺序执行多个操作', () => {
    expect(ok(transformText(' b \n a ', ['trim-lines', 'sort-lines']))).toBe('a\nb')
  })

  it.each([
    ['abc', ['uppercase'], 'ABC'],
    ['ABC', ['lowercase'], 'abc'],
    ['hello world', ['capitalize'], 'Hello World'],
    ['abc', ['reverse'], 'cba'],
    ['a\na\nb', ['dedupe-lines'], 'a\nb'],
    ['b\na', ['sort-lines'], 'a\nb'],
    ['a\n\nb', ['remove-empty-lines'], 'a\nb'],
    ['a\nb', ['number-lines'], '1. a\n2. b'],
  ] as const)('transformText(%s, %j)', (input, ops, expected) => {
    expect(ok(transformText(input, ops))).toBe(expected)
  })

  it('未知操作保持原值', () => {
    expect(ok(transformText('abc', ['unknown']))).toBe('abc')
  })
})

describe('字符串转义', () => {
  it('JS 转义引号/换行/制表符', () => {
    expect(ok(escapeString('a"b\nc\td', 'js'))).toBe('a\\"b\\nc\\td')
  })

  it('JSON 转义后加引号', () => {
    expect(ok(escapeString('a"b', 'json'))).toBe('"a\\"b"')
  })

  it('往返还原', () => {
    const input = 'quote" and \'single\' and \\ backslash\nnew line'
    expect(ok(unescapeString(ok(escapeString(input, 'js'))))).toBe(input)
  })

  it('反斜杠只转义一次', () => {
    expect(ok(escapeString('a\\b', 'java'))).toBe('a\\\\b')
    expect(ok(unescapeString('a\\\\b'))).toBe('a\\b')
  })
})

describe('Cron 表达式', () => {
  it('解析并给出后续 3 次时间', () => {
    const result = ok(parseCron('*/5 * * * *', 3))
    expect(result.nextDates).toHaveLength(3)
    expect(result.nextDates[0].getTime()).toBeLessThan(result.nextDates[1].getTime())
    expect(result.description.length).toBeGreaterThan(0)
    expect(result.fields.minute).toBe('*/5')
  })

  it('非法表达式返回错误', () => {
    expect(parseCron('not a cron').ok).toBe(false)
    expect(parseCron('99 99 * * *').ok).toBe(false)
  })
})

describe('相似度', () => {
  it.each([
    ['kitten', 'sitting', 3],
    ['', 'abc', 3],
    ['same', 'same', 0],
    ['', '', 0],
  ])('levenshtein(%s, %s) = %i', (a, b, expected) => {
    expect(levenshteinDistance(a, b)).toBe(expected)
  })

  it('相似度在 0-1 之间', () => {
    expect(textSimilarity('abc', 'abc')).toBe(1)
    expect(textSimilarity('', '')).toBe(1)
    expect(textSimilarity('abc', 'xyz')).toBe(0)
    expect(textSimilarity('hello', 'hallo')).toBeCloseTo(0.8)
  })
})
