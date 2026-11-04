import { describe, it, expect } from 'vitest'
import {
  formatJson,
  minifyJson,
  validateJson,
  formatXml,
  minifyXml,
  sanitizeMarkdownHtml,
} from '@core/format'
import { yamlToJson, jsonToYaml } from '@core/format-yaml'

const ok = <T,>(r: { ok: true; value: T } | { ok: false; error: string }): T => {
  if (!r.ok) throw new Error(r.error)
  return r.value
}

describe('JSON', () => {
  it('formatJson 按缩进格式化', () => {
    expect(ok(formatJson('{"a":1,"b":[1,2]}', 2))).toBe('{\n  "a": 1,\n  "b": [\n    1,\n    2\n  ]\n}')
  })

  it('formatJson 支持自定义缩进', () => {
    expect(ok(formatJson('{"a":1}', 4))).toContain('    "a"')
  })

  it('minifyJson 去除空白', () => {
    expect(ok(minifyJson('{ "a" : 1,\n "b": 2 }'))).toBe('{"a":1,"b":2}')
  })

  it.each([
    ['{"a":1}', 'object'],
    ['[1,2]', 'array'],
    ['"x"', 'string'],
    ['1', 'number'],
    ['null', 'object'],
  ])('validateJson(%s) 类型为 %s', (input, type) => {
    expect(ok(validateJson(input)).valid).toBe(true)
    expect(ok(validateJson(input)).type).toBe(type)
  })

  it('非法 JSON 返回错误', () => {
    expect(formatJson('{a:1}').ok).toBe(false)
    expect(minifyJson('[1,]').ok).toBe(false)
    expect(validateJson('').ok).toBe(false)
  })
})

describe('YAML', () => {
  it('yamlToJson 解析嵌套结构', () => {
    const json = ok(yamlToJson('name: test\nlist:\n  - a\n  - b'))
    expect(JSON.parse(json)).toEqual({ name: 'test', list: ['a', 'b'] })
  })

  it('jsonToYaml 输出可再次解析', () => {
    const yaml = ok(jsonToYaml('{"a":1,"b":["x"]}'))
    expect(JSON.parse(ok(yamlToJson(yaml)))).toEqual({ a: 1, b: ['x'] })
  })

  it('非法输入返回错误', () => {
    expect(yamlToJson('a: [1,').ok).toBe(false)
    expect(jsonToYaml('{bad}').ok).toBe(false)
  })
})

describe('XML', () => {
  // happy-dom 的 DOMParser 不支持 text/xml，仅在支持 XML 解析的环境下校验格式化结果
  const supportsXml = (() => {
    try {
      const doc = new DOMParser().parseFromString('<root><a>1</a></root>', 'text/xml')
      return doc.documentElement.tagName === 'root'
    } catch {
      return false
    }
  })()

  it.skipIf(!supportsXml)('格式化嵌套元素', () => {
    const result = ok(formatXml('<root><a>1</a><b><c>2</c></b></root>'))
    expect(result).toContain('<root>')
    expect(result).toContain('  <a>1</a>')
    expect(result).toContain('    <c>2</c>')
  })

  it.skipIf(!supportsXml)('自闭合标签', () => {
    expect(ok(formatXml('<root><empty/></root>'))).toContain('<empty />')
  })

  it.skipIf(!supportsXml)('非法 XML 返回错误', () => {
    expect(formatXml('<root><a></root>').ok).toBe(false)
  })

  it('formatXml 不抛异常', () => {
    expect(() => formatXml('<root/>')).not.toThrow()
  })

  it('minifyXml 压缩空白', () => {
    expect(ok(minifyXml('<a>\n  <b>1</b>\n</a>'))).toBe('<a><b>1</b></a>')
  })
})

describe('Markdown 净化', () => {
  it('移除 script 标签', () => {
    expect(sanitizeMarkdownHtml('<p>ok</p><script>alert(1)</script>')).toBe('<p>ok</p>')
  })

  it('移除内联事件', () => {
    expect(sanitizeMarkdownHtml('<img src="x" onerror="alert(1)">')).not.toContain('onerror')
    expect(sanitizeMarkdownHtml('<div onclick="alert(1)">x</div>')).not.toContain('onclick')
  })

  it.each([
    '<iframe src="https://evil.com"></iframe>',
    '<object data="x"></object>',
    '<embed src="x">',
    '<style>body{display:none}</style>',
  ])('移除危险标签：%s', (payload) => {
    const result = sanitizeMarkdownHtml(`<p>safe</p>${payload}`)
    expect(result).toBe('<p>safe</p>')
  })

  it('拦截 javascript: 协议', () => {
    expect(sanitizeMarkdownHtml('<a href="javascript:alert(1)">x</a>')).not.toContain('javascript:')
    expect(sanitizeMarkdownHtml('<img src="javascript:alert(1)">')).not.toContain('javascript:')
  })

  it('保留安全链接并补 rel', () => {
    const result = sanitizeMarkdownHtml('<a href="https://example.com" title="t">link</a>')
    expect(result).toContain('href="https://example.com"')
    expect(result).toContain('rel="noopener noreferrer"')
  })

  it('保留正常内容与表格结构', () => {
    const html = '<h1>标题</h1><table><thead><tr><th>a</th></tr></thead><tbody><tr><td>1</td></tr></tbody></table>'
    expect(sanitizeMarkdownHtml(html)).toBe(html)
  })

  it('未知标签保留文字', () => {
    expect(sanitizeMarkdownHtml('<p>a<custom>b</custom>c</p>')).toBe('<p>abc</p>')
  })
})
