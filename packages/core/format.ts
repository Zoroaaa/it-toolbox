import { Result } from './common'

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

export function formatXml(xml: string, indent: number = 2): Result<string> {
  try {
    const parser = new DOMParser()
    const doc = parser.parseFromString(xml, 'text/xml')
    const error = doc.querySelector('parsererror')
    if (error) {
      return { ok: false, error: 'Invalid XML: ' + error.textContent }
    }
    
    const format = (node: Node, level: number): string => {
      const indentStr = ' '.repeat(indent * level)
      
      if (node.nodeType === Node.TEXT_NODE) {
        const text = node.textContent?.trim()
        return text ? text : ''
      }
      
      if (node.nodeType === Node.ELEMENT_NODE) {
        const element = node as Element
        const children = Array.from(element.childNodes)
          .filter(c => c.nodeType === Node.ELEMENT_NODE || (c.nodeType === Node.TEXT_NODE && c.textContent?.trim()))
        
        let result = `${indentStr}<${element.tagName}`
        
        for (const attr of Array.from(element.attributes)) {
          result += ` ${attr.name}="${attr.value}"`
        }
        
        if (children.length === 0) {
          result += ' />\n'
        } else if (children.length === 1 && children[0].nodeType === Node.TEXT_NODE) {
          result += `>${children[0].textContent?.trim()}</${element.tagName}>\n`
        } else {
          result += '>\n'
          for (const child of children) {
            result += format(child, level + 1)
          }
          result += `${indentStr}</${element.tagName}>\n`
        }
        return result
      }
      
      return ''
    }
    
    const result = format(doc.documentElement, 0)
    return { ok: true, value: result }
  } catch (e) {
    return { ok: false, error: (e as Error).message }
  }
}

export function minifyXml(xml: string): Result<string> {
  try {
    return { ok: true, value: xml.replace(/>\s+</g, '><').replace(/\s+/g, ' ').trim() }
  } catch (e) {
    return { ok: false, error: (e as Error).message }
  }
}

const ALLOWED_TAGS = new Set([
  'a', 'p', 'br', 'hr', 'span', 'div', 'strong', 'b', 'em', 'i', 'u', 's', 'del', 'ins',
  'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'ul', 'ol', 'li', 'blockquote', 'pre', 'code',
  'table', 'thead', 'tbody', 'tfoot', 'tr', 'th', 'td', 'img', 'figure', 'figcaption',
  'sup', 'sub', 'kbd', 'mark', 'dl', 'dt', 'dd', 'details', 'summary',
])

const ALLOWED_ATTRS = new Set([
  'href', 'title', 'alt', 'src', 'class', 'colspan', 'rowspan', 'start', 'lang', 'id',
])

const SAFE_URL = /^(?:https?:|mailto:|tel:|#|\/|\.{1,2}\/)/i

function sanitizeElement(element: Element): void {
  for (const child of Array.from(element.children)) {
    const tag = child.tagName.toLowerCase()

    if (!ALLOWED_TAGS.has(tag)) {
      if (tag === 'script' || tag === 'style' || tag === 'iframe' || tag === 'object' || tag === 'embed') {
        child.remove()
        continue
      }
      // 其他未知标签保留文字内容，去掉标签本身
      sanitizeElement(child)
      const parent = child.parentNode
      while (child.firstChild) parent?.insertBefore(child.firstChild, child)
      child.remove()
      continue
    }

    for (const attr of Array.from(child.attributes)) {
      const name = attr.name.toLowerCase()
      const isEvent = name.startsWith('on')
      const isUnsafeUrl =
        (name === 'href' || name === 'src') &&
        !SAFE_URL.test(attr.value) &&
        !(name === 'src' && /^data:image\//i.test(attr.value))

      if (isEvent || !ALLOWED_ATTRS.has(name) || isUnsafeUrl) {
        child.removeAttribute(attr.name)
      }
    }

    if (tag === 'a' && child.getAttribute('href')) {
      child.setAttribute('rel', 'noopener noreferrer')
    }

    sanitizeElement(child)
  }
}

/**
 * 白名单净化 Markdown 渲染结果：仅保留安全标签、属性与协议，移除事件处理器。
 * 无 DOM 环境（如 SSR）时退化为正则清理。
 */
export function sanitizeMarkdownHtml(html: string): string {
  if (typeof DOMParser === 'undefined') {
    return html
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/on\w+\s*=\s*"[^"]*"/gi, '')
      .replace(/on\w+\s*=\s*'[^']*'/gi, '')
      .replace(/\s(href|src)\s*=\s*(["'])\s*javascript:[^"']*\2/gi, '')
  }

  // 先移除可执行/嵌入类标签，避免解析器执行脚本，也减少 DOM 遍历成本
  const preCleaned = html
    .replace(/<script\b[\s\S]*?<\/script>/gi, '')
    .replace(/<style\b[\s\S]*?<\/style>/gi, '')
    .replace(/<iframe\b[\s\S]*?<\/iframe>/gi, '')
    .replace(/<(?:object|embed)\b[^>]*>/gi, '')

  const doc = new DOMParser().parseFromString(preCleaned, 'text/html')
  sanitizeElement(doc.body)
  return doc.body.innerHTML
}
