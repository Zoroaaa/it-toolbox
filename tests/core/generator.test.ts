import { describe, it, expect } from 'vitest'
import {
  generateUUID,
  generateUUIDs,
  generateNanoId,
  generateNanoIds,
  generateUlid,
  generateUlids,
  generateObjectId,
  parseObjectId,
  generatePassword,
  generatePasswords,
  checkPasswordStrength,
  generateLoremIpsum,
  generatePlaceholderSvg,
} from '@core/generator'
import { generateFakeData, generateFakeJson } from '@core/generator-fake'

const ok = <T,>(r: { ok: true; value: T } | { ok: false; error: string }): T => {
  if (!r.ok) throw new Error(r.error)
  return r.value
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/

describe('标识符生成', () => {
  it('UUID v4 格式', () => {
    expect(generateUUID()).toMatch(UUID_RE)
  })

  it('UUID 批量与选项', () => {
    const list = generateUUIDs(5)
    expect(list).toHaveLength(5)
    expect(new Set(list).size).toBe(5)
    expect(generateUUIDs(3, { uppercase: true })[0]).toMatch(/[A-F]/)
    expect(generateUUIDs(3, { noHyphens: true })[0]).not.toContain('-')
  })

  it('UUID 数量上限 1000', () => {
    expect(generateUUIDs(5000)).toHaveLength(1000)
  })

  it('NanoID 长度与字符集', () => {
    expect(generateNanoId()).toHaveLength(21)
    expect(generateNanoId(10)).toHaveLength(10)
    expect(generateNanoId(10)).toMatch(/^[A-Za-z0-9_-]+$/)
    expect(generateNanoIds(3, 8)).toHaveLength(3)
  })

  it('ULID 26 位且唯一', () => {
    const a = generateUlid()
    const b = generateUlid()
    expect(a).toHaveLength(26)
    expect(b).toHaveLength(26)
    expect(new Set([a, b]).size).toBe(2)
    expect(generateUlids(2)).toHaveLength(2)
  })

  it('ObjectID 生成与解析', () => {
    const id = generateObjectId()
    expect(id).toMatch(/^[0-9a-f]{24}$/)
    const parsed = ok(parseObjectId(id))
    expect(Math.abs(parsed.timestamp.getTime() - Date.now())).toBeLessThan(3000)
    expect(parsed.id).toBe(id)
  })

  it.each(['', 'short', 'zzzzzzzzzzzzzzzzzzzzzzzz', '0123456789abcdef0123456'])(
    'parseObjectId 非法输入 %s',
    (id) => {
      expect(parseObjectId(id).ok).toBe(false)
    },
  )
})

describe('密码生成', () => {
  const all = { length: 20, uppercase: true, lowercase: true, numbers: true, symbols: true }

  it('长度与字符集符合配置', () => {
    const pwd = ok(generatePassword(all))
    expect(pwd).toHaveLength(20)
    expect(pwd).toMatch(/^[A-Za-z0-9!@#$%^&*()_+\-=[\]{}|;:,.<>?]+$/)
  })

  it('仅小写时不含其他字符', () => {
    const pwd = ok(
      generatePassword({ length: 30, uppercase: false, lowercase: true, numbers: false, symbols: false }),
    )
    expect(pwd).toMatch(/^[a-z]+$/)
  })

  it('excludeSimilar 排除易混字符', () => {
    const pwd = ok(generatePassword({ ...all, length: 200, excludeSimilar: true }))
    expect(pwd).not.toMatch(/[O0Il1]/)
  })

  it('未选择字符类型返回错误', () => {
    expect(
      generatePassword({ length: 10, uppercase: false, lowercase: false, numbers: false, symbols: false }).ok,
    ).toBe(false)
  })

  it('批量生成上限 100', () => {
    expect(ok(generatePasswords(150, all))).toHaveLength(100)
    expect(ok(generatePasswords(3, all))).toHaveLength(3)
  })

  it('密码强度分级', () => {
    const weak = checkPasswordStrength('123')
    const strong = checkPasswordStrength('Xq7!mN#2pL9@vR4$')
    expect(weak.score).toBeGreaterThanOrEqual(0)
    expect(weak.score).toBeLessThan(strong.score)
    expect(typeof strong.label).toBe('string')
    expect(strong.label.length).toBeGreaterThan(0)
  })
})

describe('文本与假数据', () => {
  it('英文单词生成指定数量', () => {
    const text = ok(generateLoremIpsum({ type: 'words', count: 5, language: 'en' }))
    expect(text.split(' ')).toHaveLength(5)
  })

  it('中文句子以句号结尾', () => {
    const text = ok(generateLoremIpsum({ type: 'sentences', count: 2, language: 'zh' }))
    expect(text.endsWith('。')).toBe(true)
  })

  it('段落以空行分隔', () => {
    const text = ok(generateLoremIpsum({ type: 'paragraphs', count: 2, language: 'en' }))
    expect(text.split('\n\n')).toHaveLength(2)
  })

  it('假数据支持多种类型', () => {
    expect(generateFakeData('email', 3)).toHaveLength(3)
    expect(String(generateFakeData('email', 1)[0])).toContain('@')
    expect(typeof generateFakeData('number', 1)[0]).toBe('number')
    expect(typeof generateFakeData('boolean', 1)[0]).toBe('boolean')
  })

  it('未知类型回退为单词', () => {
    expect(typeof generateFakeData('unknown-type', 1)[0]).toBe('string')
  })

  it('按 schema 生成 JSON', () => {
    const list = generateFakeJson({ name: 'name', email: 'email' }, 2) as Array<Record<string, unknown>>
    expect(list).toHaveLength(2)
    expect(Object.keys(list[0])).toEqual(['name', 'email'])
    expect(String(list[0].email)).toContain('@')
  })

  it('占位图 SVG 包含尺寸与文字', () => {
    const svg = generatePlaceholderSvg({ width: 300, height: 200, bgColor: '#eee', textColor: '#333' })
    expect(svg).toContain('width="300"')
    expect(svg).toContain('height="200"')
    expect(svg).toContain('300 × 200')
    const custom = generatePlaceholderSvg({
      width: 10,
      height: 10,
      bgColor: '#000',
      textColor: '#fff',
      text: 'Hello',
    })
    expect(custom).toContain('>Hello<')
  })
})
