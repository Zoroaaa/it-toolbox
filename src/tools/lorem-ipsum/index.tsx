import { useState, useCallback } from 'react'
import { RefreshCw, Copy, Check } from 'lucide-react'
import { ToolLayout } from '@/components/tool/ToolLayout'
import { generateLoremIpsum } from '@core/index'
import { useAppStore } from '@/store/app'
import { useClipboard } from '@/hooks/useClipboard'
import { meta } from './meta'

type GenType = 'paragraphs' | 'sentences' | 'words'
type Language = 'en' | 'zh'

export default function LoremIpsum() {
  const [output, setOutput] = useState('')
  const [type, setType] = useState<GenType>('paragraphs')
  const [count, setCount] = useState(3)
  const [language, setLanguage] = useState<Language>('en')
  const { addRecentTool } = useAppStore()
  const { copy, copied } = useClipboard()

  const generate = useCallback(() => {
    addRecentTool(meta.id)
    const result = generateLoremIpsum({ type, count, language })
    if (result.ok) {
      setOutput(result.value)
    }
  }, [type, count, language, addRecentTool])

  const reset = () => {
    setOutput('')
    setType('paragraphs')
    setCount(3)
    setLanguage('en')
  }

  return (
    <ToolLayout meta={meta} onReset={reset} outputValue={output}>
      <div className="flex items-center gap-4 mb-4 flex-wrap">
        <button onClick={generate} className="btn-primary">
          <RefreshCw className="w-4 h-4" />
          生成
        </button>

        <div className="flex items-center gap-1 bg-bg-raised rounded-lg p-1">
          {(['paragraphs', 'sentences', 'words'] as GenType[]).map(t => (
            <button
              key={t}
              onClick={() => setType(t)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors
                ${type === t ? 'bg-accent text-bg-base' : 'text-text-muted hover:text-text-primary'}`}
            >
              {t === 'paragraphs' ? '段落' : t === 'sentences' ? '句子' : '单词'}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <label className="text-xs text-text-muted">数量</label>
          <input
            type="number"
            min={1}
            max={100}
            value={count}
            onChange={e => setCount(Math.min(100, Math.max(1, parseInt(e.target.value) || 1)))}
            className="w-16 px-2 py-1.5 rounded-lg bg-bg-surface border border-border-base text-sm text-text-primary focus:outline-none focus:border-accent"
          />
        </div>

        <div className="flex items-center gap-1 bg-bg-raised rounded-lg p-1">
          {(['en', 'zh'] as Language[]).map(l => (
            <button
              key={l}
              onClick={() => setLanguage(l)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors
                ${language === l ? 'bg-accent text-bg-base' : 'text-text-muted hover:text-text-primary'}`}
            >
              {l === 'en' ? '英文' : '中文'}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 min-h-0">
        {output ? (
          <div className="h-full overflow-y-auto rounded-lg bg-bg-surface border border-border-base p-4">
            <pre className="text-sm text-text-primary whitespace-pre-wrap leading-relaxed">{output}</pre>
          </div>
        ) : (
          <div className="h-full rounded-lg bg-bg-raised border border-border-base flex items-center justify-center">
            <p className="text-text-muted text-sm">配置选项后点击生成</p>
          </div>
        )}
      </div>

      {output && (
        <div className="mt-2 flex items-center justify-between text-xs text-text-muted">
          <span>{output.length} 字符</span>
          <button onClick={() => copy(output)} className="btn-ghost py-1">
            {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
            {copied ? '已复制' : '复制'}
          </button>
        </div>
      )}
    </ToolLayout>
  )
}
