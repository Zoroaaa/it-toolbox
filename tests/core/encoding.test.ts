import { describe, it, expect } from 'vitest'
import {
  encodeBase64,
  decodeBase64,
  encodeBase64Url,
  decodeBase64Url,
  encodeUrl,
  decodeUrl,
  encodeUrlFull,
  decodeUrlFull,
  encodeHtmlEntities,
  decodeHtmlEntities,
  encodeHex,
  decodeHex,
  textToUnicode,
  unicodeToText,
  textToMorse,
  morseToText,
  textToBinary,
  binaryToText,
  rot13,
  caesarCipher,
  getAsciiTable,
  searchAscii,
  fileToBase64,
} from '@core/encoding'

const ok = <T,>(r: { ok: true; value: T } | { ok: false; error: string }): T => {
  if (!r.ok) throw new Error(`expected ok, got error: ${r.error}`)
  return r.value
}

describe('Base64', () => {
  it.each([
    ['hello', 'aGVsbG8='],
    ['', ''],
    ['中文', '5Lit5paH'],
    ['a b', 'YSBi'],
  ])('encodeBase64(%s)', (input, expected) => {
    expect(ok(encodeBase64(input))).toBe(expected)
  })

  it('decodeBase64 还原 UTF-8', () => {
    expect(ok(decodeBase64('5Lit5paH'))).toBe('中文')
    expect(ok(decodeBase64(' aGVsbG8= '))).toBe('hello')
  })

  it('decodeBase64 对非法输入返回错误', () => {
    expect(decodeBase64('!!!').ok).toBe(false)
  })

  it('base64url 去除填充且可还原', () => {
    const encoded = ok(encodeBase64Url('hello?world/中文'))
    expect(encoded).not.toMatch(/[+/=]/)
    expect(ok(decodeBase64Url(encoded))).toBe('hello?world/中文')
  })

  it('fileToBase64 读取文件', async () => {
    const file = new File(['hello'], 'a.txt', { type: 'text/plain' })
    expect(ok(await fileToBase64(file))).toBe('aGVsbG8=')
  })
})

describe('URL 编解码', () => {
  it.each([
    ['a b&c', 'a%20b%26c'],
    ['中文', '%E4%B8%AD%E6%96%87'],
  ])('encodeUrl(%s)', (input, expected) => {
    expect(ok(encodeUrl(input))).toBe(expected)
  })

  it('decodeUrl 解码并拒绝非法序列', () => {
    expect(ok(decodeUrl('%E4%B8%AD'))).toBe('中')
    expect(decodeUrl('%E4').ok).toBe(false)
  })

  it('encodeUrlFull 保留 URL 结构字符', () => {
    const url = 'https://a.com/b?c=1&d=2'
    expect(ok(encodeUrlFull(url))).toBe(url)
    expect(ok(decodeUrlFull(url))).toBe(url)
  })
})

describe('HTML 实体', () => {
  it('编码特殊字符且不重复编码 &', () => {
    expect(ok(encodeHtmlEntities('<a href="x">&</a>'))).toBe(
      '&lt;a href=&quot;x&quot;&gt;&amp;&lt;/a&gt;',
    )
  })

  it('解码命名实体与数字实体', () => {
    expect(ok(decodeHtmlEntities('&lt;&amp;&#65;&#x42;'))).toBe('<&AB')
  })

  it('中英文混合往返', () => {
    const input = '© 2026 <IT> "工具箱" & more'
    expect(ok(decodeHtmlEntities(ok(encodeHtmlEntities(input))))).toBe(input)
  })
})

describe('Hex', () => {
  it('编码与分隔符', () => {
    expect(ok(encodeHex('AB'))).toBe('4142')
    expect(ok(encodeHex('AB', ':'))).toBe('41:42')
    expect(ok(encodeHex('中'))).toBe('e4b8ad')
  })

  it('解码忽略分隔符', () => {
    expect(ok(decodeHex('41:42'))).toBe('AB')
    expect(ok(decodeHex('e4 b8 ad'))).toBe('中')
  })

  it('奇数长度返回错误', () => {
    expect(decodeHex('abc').ok).toBe(false)
  })
})

describe('Unicode', () => {
  it('输出码点与多种格式', () => {
    const result = ok(textToUnicode('A中'))
    expect(result.codePoints).toHaveLength(2)
    expect(result.codePoints[0].code).toBe('U+0041')
    expect(result.codePoints[1].code).toBe('U+4E2D')
    expect(result.formats.uEscape).toBe('\\u0041\\u4e2d')
    expect(result.formats.htmlEntity).toBe('&#65;&#20013;')
  })

  it('从多种格式还原', () => {
    expect(ok(unicodeToText('\\u4e2d&#20013;&#x4e2d;U+4E2D'))).toBe('中中中中')
  })
})

describe('摩斯与二进制', () => {
  it('SOS 往返', () => {
    expect(ok(textToMorse('SOS'))).toBe('... --- ...')
    expect(ok(morseToText('... --- ...'))).toBe('SOS')
  })

  it('空格映射为单词分隔', () => {
    expect(ok(textToMorse('A B'))).toBe('.- / -...')
    expect(ok(morseToText('.- / -...'))).toBe('A B')
  })

  it('二进制编码与还原', () => {
    expect(ok(textToBinary('A'))).toBe('01000001')
    expect(ok(binaryToText('01000001 01000010'))).toBe('AB')
    expect(binaryToText('0100000').ok).toBe(false)
  })
})

describe('ROT13 与 Caesar', () => {
  it.each([
    ['Hello', 'Uryyb'],
    ['abc XYZ', 'nop KLM'],
    ['123!', '123!'],
  ])('rot13(%s)', (input, expected) => {
    expect(ok(rot13(input))).toBe(expected)
  })

  it('caesarCipher 支持正负位移', () => {
    expect(ok(caesarCipher('abc', 1))).toBe('bcd')
    expect(ok(caesarCipher('bcd', -1))).toBe('abc')
    expect(ok(caesarCipher('z', 1))).toBe('a')
  })
})

describe('ASCII 表', () => {
  it('包含 128 个条目', () => {
    expect(getAsciiTable()).toHaveLength(128)
  })

  it.each([
    ['A', 65],
    ['0x41', 65],
    ['65', 65],
    ['space', 32],
  ])('searchAscii(%s) 命中 %i', (query, code) => {
    expect(searchAscii(query).some((e) => e.code === code)).toBe(true)
  })
})
