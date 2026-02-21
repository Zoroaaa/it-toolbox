import { useState } from 'react'
import { Sparkles, Copy, Check, AlertCircle, Play } from 'lucide-react'
import { ToolLayout } from '@/components/tool/ToolLayout'
import { useClipboard } from '@/hooks/useClipboard'
import { meta } from './meta'

interface RegexResult {
  pattern: string
  flags: string
  explanation: string
}

export default function AiRegexGenerator() {
  const [description, setDescription] = useState('')
  const [result, setResult] = useState<RegexResult | null>(null)
  const [testInput, setTestInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const { copy, copied } = useClipboard()

  const generate = async () => {
    if (!description.trim()) return
    setLoading(true); setError(''); setResult(null)
    try {
      const res = await fetch('/api/ai/regex', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description }),
      })
      const json = await res.json() as { success: boolean; data?: RegexResult; error?: string }
      if (json.success && json.data) {
        setResult(json.data)
      } else {
        setError(json.error ?? 'AI 请求失败')
      }
    } catch (e) {
      setError('网络错误：' + (e as Error).message)
    } finally {
      setLoading(false)
    }
  }

  const regex = result ? new RegExp(result.pattern, result.flags) : null
  const matches = regex && testInput ? [...testInput.matchAll(new RegExp(result!.pattern, result!.flags + (result!.flags.includes('g') ? '' : 'g')))] : []
  const fullPattern = result ? `/${result.pattern}/${result.flags}` : ''

  const highlighted = regex && testInput
    ? testInput.replace(new RegExp(result!.pattern, result!.flags.includes('g') ? result!.flags : result!.flags + 'g'), match =>
        `<mark class="bg-accent/30 text-text-primary rounded px-0.5">${match}</mark>`)
    : testInput

  const examples = [
    '匹配中国大陆手机号',
    '验证邮箱地址格式',
    '提取 URL 中的域名',
    '匹配 IPv4 地址',
    '匹配 HTML 标签',
    '提取 #标签',
  ]

  return (
    <ToolLayout meta={meta} onReset={() => { setDescription(''); setResult(null); setTestInput(''); setError('') }}>
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <label className="text-xs font-medium text-text-muted uppercase tracking-wider">描述你想匹配的内容</label>
          <div className="flex gap-2">
            <input
              className="tool-input flex-1"
              placeholder="例如：匹配所有以 .com 或 .cn 结尾的域名"
              value={description}
              onChange={e => setDescription(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && generate()}
            />
            <button onClick={generate} disabled={loading || !description.trim()} className="btn-primary gap-2 whitespace-nowrap">
              <Sparkles className="w-4 h-4" />
              {loading ? '生成中...' : 'AI 生成'}
            </button>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {examples.map(ex => (
              <button key={ex} onClick={() => setDescription(ex)}
                className="px-2 py-1 text-xs rounded-md bg-bg-raised text-text-muted hover:text-text-primary hover:bg-bg-surface border border-border-base transition-colors">
                {ex}
              </button>
            ))}
          </div>
        </div>

        {error && (
          <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 flex gap-2 text-xs text-rose-400">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />{error}
          </div>
        )}

        {result && (
          <>
            <div className="bg-bg-surface rounded-lg border border-border-base p-4 flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-text-muted uppercase tracking-wider">生成的正则表达式</span>
                <button onClick={() => copy(fullPattern)} className="btn-ghost text-xs gap-1">
                  {copied ? <Check className="w-3.5 h-3.5 text-accent" /> : <Copy className="w-3.5 h-3.5" />}
                  复制
                </button>
              </div>
              <div className="font-mono text-lg text-accent bg-bg-raised rounded-lg px-4 py-3 break-all">
                {fullPattern}
              </div>
              <div className="text-xs text-text-secondary leading-relaxed">
                <span className="font-medium text-text-primary">说明：</span>{result.explanation}
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <label className="text-xs font-medium text-text-muted uppercase tracking-wider flex-1">测试输入</label>
                {matches.length > 0 && (
                  <span className="text-xs text-emerald-400 flex items-center gap-1">
                    <Play className="w-3 h-3" /> 找到 {matches.length} 个匹配
                  </span>
                )}
              </div>
              <textarea
                className="tool-input font-mono text-sm h-24 resize-none"
                placeholder="在这里粘贴文本，测试正则效果..."
                value={testInput}
                onChange={e => setTestInput(e.target.value)}
                spellCheck={false}
              />
              {testInput && (
                <div className="bg-bg-raised rounded-lg border border-border-base p-3 text-sm font-mono text-text-primary leading-relaxed"
                  dangerouslySetInnerHTML={{ __html: highlighted }} />
              )}
            </div>
          </>
        )}
      </div>
    </ToolLayout>
  )
}
