import { useState, useCallback } from 'react'
import { ArrowRightLeft, Copy, Check } from 'lucide-react'
import { ToolLayout } from '@/components/tool/ToolLayout'
import { convertCase, type CaseType } from '@core/index'
import { useAppStore } from '@/store/app'
import { useClipboard } from '@/hooks/useClipboard'
import { meta } from './meta'

const caseTypes: { type: CaseType; label: string; example: string }[] = [
  { type: 'camel', label: 'camelCase', example: 'helloWorld' },
  { type: 'pascal', label: 'PascalCase', example: 'HelloWorld' },
  { type: 'snake', label: 'snake_case', example: 'hello_world' },
  { type: 'kebab', label: 'kebab-case', example: 'hello-world' },
  { type: 'constant', label: 'CONSTANT', example: 'HELLO_WORLD' },
  { type: 'upper', label: 'UPPERCASE', example: 'HELLO WORLD' },
  { type: 'lower', label: 'lowercase', example: 'hello world' },
  { type: 'title', label: 'Title Case', example: 'Hello World' },
  { type: 'sentence', label: 'Sentence', example: 'Hello world' },
]

export default function CaseConverter() {
  const [input, setInput] = useState('')
  const [results, setResults] = useState<Record<CaseType, string>>({} as Record<CaseType, string>)
  const { addHistory, addRecentTool } = useAppStore()
  const { copy, copied } = useClipboard()
  const [copiedType, setCopiedType] = useState<CaseType | null>(null)

  const convert = useCallback(() => {
    if (!input.trim()) return
    addRecentTool(meta.id)

    const newResults: Record<CaseType, string> = {} as Record<CaseType, string>
    caseTypes.forEach(({ type }) => {
      const result = convertCase(input, type)
      newResults[type] = result.ok ? result.value : ''
    })

    setResults(newResults)
    addHistory(meta.id, input)
  }, [input, addHistory, addRecentTool])

  const handleCopy = (type: CaseType, text: string) => {
    copy(text)
    setCopiedType(type)
    setTimeout(() => setCopiedType(null), 2000)
  }

  const reset = () => {
    setInput('')
    setResults({} as Record<CaseType, string>)
  }

  const outputValue = Object.entries(results).map(([k, v]) => `${k}: ${v}`).join('\n')

  return (
    <ToolLayout meta={meta} onReset={reset} outputValue={outputValue}>
      <div className="flex items-center gap-2 mb-4">
        <button onClick={convert} className="btn-primary">
          <ArrowRightLeft className="w-4 h-4" />
          转换
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 h-[calc(100vh-16rem)]">
        <div className="flex flex-col gap-2">
          <label className="text-xs font-medium text-text-muted uppercase tracking-wider">输入文本</label>
          <textarea
            className="tool-input flex-1 font-mono text-xs leading-relaxed"
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="输入要转换的文本...&#10;支持各种命名格式自动识别"
            spellCheck={false}
          />
          <div className="text-xs text-text-muted">{input.length} 字符</div>
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-xs font-medium text-text-muted uppercase tracking-wider">转换结果</label>
          {Object.keys(results).length > 0 ? (
            <div className="flex-1 overflow-y-auto space-y-2">
              {caseTypes.map(({ type, label, example }) => (
                <div
                  key={type}
                  className="flex items-center justify-between p-3 rounded-lg bg-bg-surface border border-border-base hover:border-border-strong transition-colors group"
                >
                  <div className="flex-1 min-w-0">
                    <div className="text-xs text-text-muted mb-1">{label}</div>
                    <p className="font-mono text-sm text-text-primary truncate">
                      {results[type] || <span className="text-text-muted">{example}</span>}
                    </p>
                  </div>
                  <button
                    onClick={() => handleCopy(type, results[type])}
                    className="ml-2 p-1.5 rounded opacity-0 group-hover:opacity-100 hover:bg-bg-raised transition-all"
                  >
                    {copied && copiedType === type ? (
                      <Check className="w-4 h-4 text-accent" />
                    ) : (
                      <Copy className="w-4 h-4 text-text-muted" />
                    )}
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex-1 rounded-lg bg-bg-raised border border-border-base flex items-center justify-center">
              <p className="text-text-muted text-sm">输入文本后点击转换</p>
            </div>
          )}
        </div>
      </div>
    </ToolLayout>
  )
}
