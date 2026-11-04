import { useState, useMemo } from 'react'
import { Copy } from 'lucide-react'
import { ToolLayout } from '@/components/tool/ToolLayout'
import { useClipboard } from '@/hooks/useClipboard'
import { meta } from './meta'
import { md5 } from '@core/crypto'
import { encodeBase64 } from '@core/encoding'

type TransformFn = (input: string) => string

const transforms: Array<{ id: string; name: string; fn: TransformFn }> = [
  { id: 'lower', name: '小写', fn: s => s.toLowerCase() },
  { id: 'upper', name: '大写', fn: s => s.toUpperCase() },
  { id: 'capitalize', name: '首字母大写', fn: s => s.replace(/\b\w/g, c => c.toUpperCase()) },
  { id: 'reverse', name: '反转', fn: s => s.split('').reverse().join('') },
  { id: 'base64-encode', name: 'Base64 编码', fn: s => {
    const result = encodeBase64(s)
    return result.ok ? result.value : ''
  }},
  { id: 'url-encode', name: 'URL 编码', fn: s => encodeURIComponent(s) },
  { id: 'html-encode', name: 'HTML 实体', fn: s => s.replace(/[&<>"']/g, c => `&#${c.charCodeAt(0)};`) },
  { id: 'json-stringify', name: 'JSON 字符串化', fn: s => JSON.stringify(s) },
  { id: 'md5', name: 'MD5 哈希', fn: s => {
    const result = md5(s)
    return result.ok ? result.value : ''
  }},
  { id: 'length', name: '字符数', fn: s => String(s.length) },
  { id: 'words', name: '单词数', fn: s => String(s.trim().split(/\s+/).filter(Boolean).length) },
  { id: 'lines', name: '行数', fn: s => String(s.split('\n').length) },
]

export default function ToolCompare() {
  const [input, setInput] = useState('')
  const [selectedTools, setSelectedTools] = useState<string[]>(['lower', 'upper', 'reverse'])
  const { copy } = useClipboard()

  const results = useMemo(() => {
    if (!input.trim()) return []
    
    return selectedTools.map(id => {
      const transform = transforms.find(t => t.id === id)
      if (!transform) return { id, name: id, result: '', error: true }
      
      try {
        return { id, name: transform.name, result: transform.fn(input), error: false }
      } catch {
        return { id, name: transform.name, result: 'Error', error: true }
      }
    })
  }, [input, selectedTools])

  const toggleTool = (id: string) => {
    setSelectedTools(prev => 
      prev.includes(id) ? prev.filter(t => t !== id) : [...prev, id]
    )
  }

  const reset = () => {
    setInput('')
    setSelectedTools(['lower', 'upper', 'reverse'])
  }

  return (
    <ToolLayout meta={meta} onReset={reset}>
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <label className="text-xs font-medium text-text-muted uppercase tracking-wider">输入数据</label>
          <textarea
            className="tool-input font-mono text-sm h-24 resize-none"
            placeholder="输入需要对比处理的数据..."
            value={input}
            onChange={e => setInput(e.target.value)}
            spellCheck={false}
          />
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-xs font-medium text-text-muted uppercase tracking-wider">选择工具（可多选）</label>
          <div className="flex flex-wrap gap-1.5">
            {transforms.map(t => (
              <button
                key={t.id}
                onClick={() => toggleTool(t.id)}
                className={`px-2.5 py-1.5 text-xs rounded-md transition-colors ${
                  selectedTools.includes(t.id)
                    ? 'bg-accent text-white'
                    : 'bg-bg-surface text-text-muted hover:text-text-primary border border-border-base'
                }`}
              >
                {t.name}
              </button>
            ))}
          </div>
        </div>

        {results.length > 0 && input.trim() && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {results.map(({ id, name, result, error }) => (
              <div
                key={id}
                className="bg-bg-surface rounded-lg border border-border-base overflow-hidden"
              >
                <div className="px-3 py-2 bg-bg-raised border-b border-border-base flex items-center justify-between">
                  <span className="text-xs font-medium text-text-primary">{name}</span>
                  <button
                    onClick={() => copy(result)}
                    className="p-1 rounded hover:bg-bg-surface transition-colors"
                  >
                    <Copy className="w-3 h-3 text-text-muted" />
                  </button>
                </div>
                <div className="p-3">
                  <div className={`font-mono text-sm break-all ${error ? 'text-rose-400' : 'text-text-secondary'}`}>
                    {result || <span className="text-text-muted italic">空</span>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {!input.trim() && (
          <div className="text-center py-8 text-text-muted text-sm">
            输入数据后，将同时显示所有选中工具的处理结果
          </div>
        )}
      </div>
    </ToolLayout>
  )
}
