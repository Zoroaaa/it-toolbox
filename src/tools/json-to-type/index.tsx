import { useState, useMemo } from 'react'
import { Copy, Check } from 'lucide-react'
import { ToolLayout } from '@/components/tool/ToolLayout'
import { meta } from './meta'
import { useAppStore } from '@/store/app'

type Language = 'typescript' | 'go' | 'python' | 'kotlin' | 'rust' | 'java'

interface TypeInfo {
  name: string
  type: string
  fields?: TypeInfo[]
}

function inferType(value: unknown, name: string = 'Root'): TypeInfo {
  if (value === null) {
    return { name, type: 'null' }
  }

  if (Array.isArray(value)) {
    if (value.length === 0) {
      return { name, type: 'any[]' }
    }
    const itemType = inferType(value[0], 'item')
    return { name, type: `${itemType.type}[]` }
  }

  if (typeof value === 'object') {
    const fields: TypeInfo[] = []
    for (const [key, val] of Object.entries(value as Record<string, unknown>)) {
      fields.push(inferType(val, key))
    }
    return { name, type: 'object', fields }
  }

  if (typeof value === 'string') {
    return { name, type: 'string' }
  }

  if (typeof value === 'number') {
    return { name, type: 'number' }
  }

  if (typeof value === 'boolean') {
    return { name, type: 'boolean' }
  }

  return { name, type: 'any' }
}

function toPascalCase(str: string): string {
  return str
    .replace(/[-_](.)/g, (_, c) => c.toUpperCase())
    .replace(/^(.)/, (_, c) => c.toUpperCase())
}

function generateTypeScript(typeInfo: TypeInfo, indent: number = 0): string {
  const indentStr = '  '.repeat(indent)

  if (typeInfo.type !== 'object' || !typeInfo.fields) {
    return `${indentStr}type ${toPascalCase(typeInfo.name)} = ${typeInfo.type};`
  }

  const lines: string[] = []
  const typeName = toPascalCase(typeInfo.name)

  lines.push(`${indentStr}interface ${typeName} {`)

  for (const field of typeInfo.fields) {
    if (field.type === 'object' && field.fields) {
      const nestedTypeName = toPascalCase(field.name)
      lines.push(`${indentStr}  ${field.name}: ${nestedTypeName};`)
    } else {
      lines.push(`${indentStr}  ${field.name}: ${field.type};`)
    }
  }

  lines.push(`${indentStr}}`)

  for (const field of typeInfo.fields) {
    if (field.type === 'object' && field.fields) {
      lines.push('')
      lines.push(generateTypeScript(field, indent))
    }
  }

  return lines.join('\n')
}

function generateGo(typeInfo: TypeInfo): string {
  const lines: string[] = []
  const processed = new Set<string>()

  function processType(info: TypeInfo) {
    if (info.type !== 'object' || !info.fields) return

    const typeName = toPascalCase(info.name)
    if (processed.has(typeName)) return
    processed.add(typeName)

    lines.push(`type ${typeName} struct {`)

    for (const field of info.fields) {
      let goType: string
      if (field.type === 'object' && field.fields) {
        goType = toPascalCase(field.name)
        processType(field)
      } else if (field.type === 'string') {
        goType = 'string'
      } else if (field.type === 'number') {
        goType = 'float64'
      } else if (field.type === 'boolean') {
        goType = 'bool'
      } else if (field.type.endsWith('[]')) {
        const innerType = field.type.slice(0, -2)
        if (innerType === 'string') goType = '[]string'
        else if (innerType === 'number') goType = '[]float64'
        else if (innerType === 'boolean') goType = '[]bool'
        else goType = '[]interface{}'
      } else {
        goType = 'interface{}'
      }

      lines.push(`  ${toPascalCase(field.name)} ${goType} \`json:"${field.name}"\``)
    }

    lines.push('}')
    lines.push('')
  }

  processType(typeInfo)
  return lines.join('\n').trim()
}

function generatePython(typeInfo: TypeInfo): string {
  const lines: string[] = []
  const processed = new Set<string>()

  function processType(info: TypeInfo) {
    if (info.type !== 'object' || !info.fields) return

    const typeName = toPascalCase(info.name)
    if (processed.has(typeName)) return
    processed.add(typeName)

    lines.push(`class ${typeName}:`)
    lines.push('    def __init__(self, data: dict):')

    for (const field of info.fields) {
      let pyType: string
      if (field.type === 'object' && field.fields) {
        pyType = toPascalCase(field.name)
        processType(field)
      } else if (field.type === 'string') {
        pyType = 'str'
      } else if (field.type === 'number') {
        pyType = 'float'
      } else if (field.type === 'boolean') {
        pyType = 'bool'
      } else if (field.type.endsWith('[]')) {
        pyType = 'list'
      } else {
        pyType = 'Any'
      }

      lines.push(`        self.${field.name}: ${pyType} = data.get('${field.name}')`)
    }

    lines.push('')
  }

  lines.push('from typing import Any')
  lines.push('')

  processType(typeInfo)
  return lines.join('\n').trim()
}

function generateKotlin(typeInfo: TypeInfo): string {
  const lines: string[] = []
  const processed = new Set<string>()

  function processType(info: TypeInfo) {
    if (info.type !== 'object' || !info.fields) return

    const typeName = toPascalCase(info.name)
    if (processed.has(typeName)) return
    processed.add(typeName)

    const params: string[] = []

    for (const field of info.fields) {
      let ktType: string
      if (field.type === 'object' && field.fields) {
        ktType = toPascalCase(field.name)
        processType(field)
      } else if (field.type === 'string') {
        ktType = 'String'
      } else if (field.type === 'number') {
        ktType = 'Double'
      } else if (field.type === 'boolean') {
        ktType = 'Boolean'
      } else if (field.type.endsWith('[]')) {
        const innerType = field.type.slice(0, -2)
        if (innerType === 'string') ktType = 'List<String>'
        else if (innerType === 'number') ktType = 'List<Double>'
        else if (innerType === 'boolean') ktType = 'List<Boolean>'
        else ktType = 'List<Any>'
      } else {
        ktType = 'Any'
      }

      params.push(`    val ${field.name}: ${ktType}?`)
    }

    lines.push(`data class ${typeName}(`)
    lines.push(params.join(',\n'))
    lines.push(')')
    lines.push('')
  }

  processType(typeInfo)
  return lines.join('\n').trim()
}

function generateRust(typeInfo: TypeInfo): string {
  const lines: string[] = []
  const processed = new Set<string>()

  lines.push('use serde::{Deserialize, Serialize};')
  lines.push('')

  function processType(info: TypeInfo) {
    if (info.type !== 'object' || !info.fields) return

    const typeName = toPascalCase(info.name)
    if (processed.has(typeName)) return
    processed.add(typeName)

    lines.push(`#[derive(Debug, Serialize, Deserialize)]`)
    lines.push(`pub struct ${typeName} {`)

    for (const field of info.fields) {
      let rsType: string
      if (field.type === 'object' && field.fields) {
        rsType = toPascalCase(field.name)
        processType(field)
      } else if (field.type === 'string') {
        rsType = 'String'
      } else if (field.type === 'number') {
        rsType = 'f64'
      } else if (field.type === 'boolean') {
        rsType = 'bool'
      } else if (field.type.endsWith('[]')) {
        const innerType = field.type.slice(0, -2)
        if (innerType === 'string') rsType = 'Vec<String>'
        else if (innerType === 'number') rsType = 'Vec<f64>'
        else if (innerType === 'boolean') rsType = 'Vec<bool>'
        else rsType = 'Vec<serde_json::Value>'
      } else {
        rsType = 'serde_json::Value'
      }

      lines.push(`    pub ${field.name}: Option<${rsType}>,`)
    }

    lines.push('}')
    lines.push('')
  }

  processType(typeInfo)
  return lines.join('\n').trim()
}

function generateJava(typeInfo: TypeInfo): string {
  const lines: string[] = []
  const processed = new Set<string>()

  function processType(info: TypeInfo) {
    if (info.type !== 'object' || !info.fields) return

    const typeName = toPascalCase(info.name)
    if (processed.has(typeName)) return
    processed.add(typeName)

    lines.push(`public class ${typeName} {`)

    for (const field of info.fields) {
      let javaType: string
      if (field.type === 'object' && field.fields) {
        javaType = toPascalCase(field.name)
        processType(field)
      } else if (field.type === 'string') {
        javaType = 'String'
      } else if (field.type === 'number') {
        javaType = 'Double'
      } else if (field.type === 'boolean') {
        javaType = 'Boolean'
      } else if (field.type.endsWith('[]')) {
        const innerType = field.type.slice(0, -2)
        if (innerType === 'string') javaType = 'List<String>'
        else if (innerType === 'number') javaType = 'List<Double>'
        else if (innerType === 'boolean') javaType = 'List<Boolean>'
        else javaType = 'List<Object>'
      } else {
        javaType = 'Object'
      }

      lines.push(`    private ${javaType} ${field.name};`)
    }

    lines.push('')
    for (const field of info.fields) {
      let javaType: string
      if (field.type === 'object' && field.fields) {
        javaType = toPascalCase(field.name)
      } else if (field.type === 'string') {
        javaType = 'String'
      } else if (field.type === 'number') {
        javaType = 'Double'
      } else if (field.type === 'boolean') {
        javaType = 'Boolean'
      } else if (field.type.endsWith('[]')) {
        javaType = 'List<?>'
      } else {
        javaType = 'Object'
      }

      const capName = field.name.charAt(0).toUpperCase() + field.name.slice(1)
      lines.push(`    public ${javaType} get${capName}() { return ${field.name}; }`)
      lines.push(`    public void set${capName}(${javaType} ${field.name}) { this.${field.name} = ${field.name}; }`)
    }

    lines.push('}')
    lines.push('')
  }

  lines.push('import java.util.List;')
  lines.push('')

  processType(typeInfo)
  return lines.join('\n').trim()
}

const LANGUAGES: { value: Language; label: string }[] = [
  { value: 'typescript', label: 'TypeScript' },
  { value: 'go', label: 'Go' },
  { value: 'python', label: 'Python' },
  { value: 'kotlin', label: 'Kotlin' },
  { value: 'rust', label: 'Rust' },
  { value: 'java', label: 'Java' },
]

export default function JsonToType() {
  const [input, setInput] = useState('')
  const [language, setLanguage] = useState<Language>('typescript')
  const [rootName, setRootName] = useState('Root')
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState('')
  const { addHistory, addRecentTool } = useAppStore()

  const typeInfo = useMemo(() => {
    if (!input.trim()) return null
    try {
      const parsed = JSON.parse(input)
      return inferType(parsed, rootName)
    } catch {
      return null
    }
  }, [input, rootName])

  const output = useMemo(() => {
    if (!typeInfo) return ''
    switch (language) {
      case 'typescript':
        return generateTypeScript(typeInfo)
      case 'go':
        return generateGo(typeInfo)
      case 'python':
        return generatePython(typeInfo)
      case 'kotlin':
        return generateKotlin(typeInfo)
      case 'rust':
        return generateRust(typeInfo)
      case 'java':
        return generateJava(typeInfo)
      default:
        return ''
    }
  }, [typeInfo, language])

  const copyOutput = async () => {
    if (!output) return
    addRecentTool(meta.id)
    await navigator.clipboard.writeText(output)
    setCopied(true)
    if (input.trim()) {
      addHistory(meta.id, input)
    }
    setTimeout(() => setCopied(false), 2000)
  }

  const reset = () => {
    setInput('')
    setRootName('Root')
    setError('')
  }

  return (
    <ToolLayout meta={meta} onReset={reset} outputValue={output}>
      <div className="space-y-4">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <label className="text-xs text-text-muted">目标语言:</label>
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value as Language)}
              className="px-3 py-1.5 bg-bg-raised border border-border-base rounded-lg text-sm text-text-primary"
            >
              {LANGUAGES.map((lang) => (
                <option key={lang.value} value={lang.value}>
                  {lang.label}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <label className="text-xs text-text-muted">根类型名:</label>
            <input
              type="text"
              value={rootName}
              onChange={(e) => setRootName(e.target.value || 'Root')}
              className="px-3 py-1.5 bg-bg-raised border border-border-base rounded-lg text-sm text-text-primary w-32"
            />
          </div>

          <button
            onClick={copyOutput}
            disabled={!output}
            className="btn-ghost flex items-center gap-1"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 text-green-400" />
                已复制
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                复制代码
              </>
            )}
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="flex flex-col gap-2">
            <label className="text-xs font-medium text-text-muted uppercase tracking-wider">
              JSON 输入
            </label>
            <textarea
              className="tool-input flex-1 font-mono text-xs leading-relaxed min-h-[400px]"
              value={input}
              onChange={(e) => {
                setInput(e.target.value)
                setError('')
              }}
              placeholder='{"name": "example", "value": 123}'
              spellCheck={false}
            />
            <div className="text-xs text-text-muted">{input.length} 字符</div>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-xs font-medium text-text-muted uppercase tracking-wider">
              {LANGUAGES.find((l) => l.value === language)?.label} 类型定义
            </label>
            {error ? (
              <div className="flex-1 rounded-lg bg-rose-500/10 border border-rose-500/30 p-4 min-h-[400px]">
                <p className="text-xs text-rose-400/80">{error}</p>
              </div>
            ) : (
              <textarea
                className="tool-input flex-1 font-mono text-xs leading-relaxed min-h-[400px]"
                value={output}
                readOnly
                placeholder="类型定义将在这里显示..."
                spellCheck={false}
              />
            )}
            {output && !error && <div className="text-xs text-text-muted">{output.length} 字符</div>}
          </div>
        </div>
      </div>
    </ToolLayout>
  )
}
