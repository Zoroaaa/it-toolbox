import { Result } from './common'
import * as jsYaml from 'js-yaml'

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

export function yamlToJson(yaml: string): Result<string> {
  try {
    const parsed = jsYaml.load(yaml)
    return { ok: true, value: JSON.stringify(parsed, null, 2) }
  } catch (e) {
    return { ok: false, error: (e as Error).message }
  }
}

export function jsonToYaml(json: string): Result<string> {
  try {
    const parsed = JSON.parse(json)
    const yaml = jsYaml.dump(parsed, { indent: 2, lineWidth: -1 })
    return { ok: true, value: yaml }
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

export function sanitizeMarkdownHtml(html: string): string {
  return html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/on\w+="[^"]*"/gi, '')
    .replace(/on\w+='[^']*'/gi, '')
}
