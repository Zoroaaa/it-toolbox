import { describe, it, expect } from 'vitest'
import {
  parseCookies,
  buildCookieHeader,
  isKnownCookieAttribute,
  type ParsedCookie,
} from '@core/cookie'

const parse = (input: string): ParsedCookie[] => {
  const result = parseCookies(input)
  if (!result.ok) throw new Error(result.error)
  return result.value
}

describe('parseCookies — 请求 Cookie', () => {
  it('解析单行多个键值对', () => {
    const cookies = parse('session=abc123; theme=dark; lang=zh-CN')
    expect(cookies.map((c) => `${c.name}=${c.value}`)).toEqual([
      'session=abc123',
      'theme=dark',
      'lang=zh-CN',
    ])
    expect(cookies.every((c) => c.source === 'request')).toBe(true)
  })

  it('去掉 Cookie: 前缀，大小写不敏感', () => {
    expect(parse('cookie: a=1')).toHaveLength(1)
    expect(parse('COOKIE: a=1')[0].name).toBe('a')
  })

  it('值中包含等号时只按第一个等号切分', () => {
    expect(parse('token=abc==')[0].value).toBe('abc==')
  })

  it('去掉值两侧的双引号', () => {
    expect(parse('a="hello world"')[0].value).toBe('hello world')
  })

  it('值为空时保留', () => {
    expect(parse('empty=')[0]).toMatchObject({ name: 'empty', value: '' })
  })

  it('忽略注释行与空行', () => {
    expect(parse('# 注释\n\n a=1 \n')).toHaveLength(1)
  })

  it('忽略引号内的分号', () => {
    const cookies = parse('a="x;y"; b=2')
    expect(cookies.map((c) => c.value)).toEqual(['x;y', '2'])
  })
})

describe('parseCookies — Set-Cookie', () => {
  it('解析完整属性', () => {
    const [cookie] = parse(
      'Set-Cookie: sid=abc; Domain=example.com; Path=/app; Expires=Wed, 21 Oct 2026 07:00:00 GMT; Max-Age=3600; SameSite=Lax; HttpOnly; Secure',
    )
    expect(cookie.source).toBe('set-cookie')
    expect(cookie.name).toBe('sid')
    expect(cookie.value).toBe('abc')

    const map = Object.fromEntries(cookie.attributes.map((a) => [a.name.toLowerCase(), a.value]))
    expect(map).toMatchObject({
      domain: 'example.com',
      path: '/app',
      expires: 'Wed, 21 Oct 2026 07:00:00 GMT',
      'max-age': '3600',
      samesite: 'Lax',
      httponly: '',
      secure: '',
    })
  })

  it('多行 Set-Cookie 各自解析', () => {
    const cookies = parse(
      'Set-Cookie: a=1; Path=/\nSet-Cookie: b=2; HttpOnly\nSet-Cookie: c=3; SameSite=None; Secure',
    )
    expect(cookies).toHaveLength(3)
    expect(cookies.map((c) => c.name)).toEqual(['a', 'b', 'c'])
  })

  it('无值属性保留为空字符串且标记为已知', () => {
    const [cookie] = parse('Set-Cookie: a=1; HttpOnly; Secure; Partitioned')
    expect(cookie.attributes.map((a) => a.name)).toEqual(['HttpOnly', 'Secure', 'Partitioned'])
    expect(cookie.attributes.every((a) => a.known && a.value === '')).toBe(true)
  })

  it('非标准属性保留原值并标记为未知', () => {
    const [cookie] = parse('Set-Cookie: a=1; SameSite=Lax; Foo=bar')
    const unknown = cookie.attributes.find((a) => a.name === 'Foo')
    expect(unknown).toMatchObject({ value: 'bar', known: false })
  })

  it('值含 base64 等号字符时不破坏属性', () => {
    const [cookie] = parse('Set-Cookie: token=YWJj==; Path=/; HttpOnly')
    expect(cookie.value).toBe('YWJj==')
    expect(cookie.attributes).toHaveLength(2)
  })

  it('Expires 中的逗号不参与切分', () => {
    const [cookie] = parse('Set-Cookie: a=1; Expires=Thu, 01 Jan 2026 00:00:00 GMT')
    expect(cookie.attributes[0].value).toBe('Thu, 01 Jan 2026 00:00:00 GMT')
  })
})

describe('parseCookies — 异常输入', () => {
  it('空字符串报错', () => {
    const result = parseCookies('   ')
    expect(result.ok).toBe(false)
  })

  it('无等号的乱码报错', () => {
    const result = parseCookies('not a cookie')
    expect(result.ok).toBe(false)
  })

  it('空名字的片段被跳过，其余仍可解析', () => {
    const cookies = parse('=orphan; ok=1')
    expect(cookies.map((c) => c.name)).toEqual(['ok'])
  })
})

describe('buildCookieHeader', () => {
  it('拼接为标准请求头值', () => {
    expect(
      buildCookieHeader([
        { name: 'a', value: '1' },
        { name: 'b', value: '2' },
      ]),
    ).toBe('a=1; b=2')
  })

  it('跳过空名字', () => {
    expect(buildCookieHeader([{ name: ' ', value: 'x' }])).toBe('')
  })
})

describe('isKnownCookieAttribute', () => {
  it('识别标准属性（大小写不敏感）', () => {
    expect(isKnownCookieAttribute('HttpOnly')).toBe(true)
    expect(isKnownCookieAttribute('samesite')).toBe(true)
  })

  it('未知属性返回 false', () => {
    expect(isKnownCookieAttribute('Foo')).toBe(false)
  })
})
