import { useState } from 'react'
import { Copy, Check, AlertCircle, Sparkles } from 'lucide-react'
import { ToolLayout } from '@/components/tool/ToolLayout'
import { useClipboard } from '@/hooks/useClipboard'
import { meta } from './meta'
import { callAi } from '@/lib/ai'

interface NamingResult {
  suggestions: Array<{
    name: string
    type: 'variable' | 'function' | 'class' | 'constant'
    style: string
    explanation: string
  }>
}

type NamingStyle = 'camelCase' | 'PascalCase' | 'snake_case' | 'kebab-case' | 'CONSTANT'
type NamingType = 'variable' | 'function' | 'class' | 'constant'

export default function AiNaming() {
  const [description, setDescription] = useState('')
  const [style, setStyle] = useState<NamingStyle>('camelCase')
  const [type, setType] = useState<NamingType>('variable')
  const [result, setResult] = useState<NamingResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const { copy, copied } = useClipboard()

  const generate = async () => {
    if (!description.trim()) return
    setLoading(true)
    setError('')
    setResult(null)
    try {
      const ai = await callAi<NamingResult>('naming', { description, style, type })
      if (ai.ok) setResult(ai.data)
      else setError(ai.error)
    } catch (e) {
      setError('网络错误：' + (e as Error).message)
    } finally {
      setLoading(false)
    }
  }

  const styles: NamingStyle[] = ['camelCase', 'PascalCase', 'snake_case', 'kebab-case', 'CONSTANT']
  const types: NamingType[] = ['variable', 'function', 'class', 'constant']

  const examples = [
    '获取用户信息',
    '计算两个日期之间的天数',
    '验证邮箱地址格式',
    '发送HTTP请求',
    '处理文件上传',
  ]

  return (
    <ToolLayout meta={meta} onReset={() => { setDescription(''); setResult(null); setError('') }}>
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <label className="text-xs font-medium text-text-muted uppercase tracking-wider">描述功能</label>
          <input
            className="tool-input"
            placeholder="例如：获取用户列表数据"
            value={description}
            onChange={e => setDescription(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && generate()}
          />
          <div className="flex flex-wrap gap-1.5">
            {examples.map(ex => (
              <button
                key={ex}
                onClick={() => setDescription(ex)}
                className="px-2 py-1 text-xs rounded-md bg-bg-raised text-text-muted hover:text-text-primary hover:bg-bg-surface border border-border-base transition-colors"
              >
                {ex}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-2">
            <label className="text-xs font-medium text-text-muted uppercase tracking-wider">命名风格</label>
            <select
              className="tool-input"
              value={style}
              onChange={e => setStyle(e.target.value as NamingStyle)}
            >
              {styles.map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-xs font-medium text-text-muted uppercase tracking-wider">类型</label>
            <select
              className="tool-input"
              value={type}
              onChange={e => setType(e.target.value as NamingType)}
            >
              {types.map(t => (
                <option key={t} value={t}>
                  {t === 'variable' ? '变量' : t === 'function' ? '函数' : t === 'class' ? '类' : '常量'}
                </option>
              ))}
            </select>
          </div>
        </div>

        <button
          onClick={generate}
          disabled={loading || !description.trim()}
          className="btn-primary gap-2"
        >
          <Sparkles className="w-4 h-4" />
          {loading ? '生成中...' : 'AI 生成命名'}
        </button>

        {error && (
          <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 flex gap-2 text-xs text-rose-400">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            {error}
          </div>
        )}

        {result && (
          <div className="flex flex-col gap-3">
            <div className="bg-bg-surface rounded-lg border border-border-base overflow-hidden">
              <div className="px-4 py-2 bg-bg-raised border-b border-border-base">
                <span className="text-xs font-medium text-text-muted uppercase tracking-wider">推荐命名</span>
              </div>
              <div className="divide-y divide-border-base">
                {result.suggestions.map((suggestion, i) => (
                  <div key={i} className="p-4 flex items-center justify-between gap-4 hover:bg-bg-raised/50 transition-colors">
                    <div className="flex-1 min-w-0">
                      <div className="font-mono text-accent text-lg truncate">{suggestion.name}</div>
                      <div className="text-xs text-text-muted mt-1">{suggestion.explanation}</div>
                    </div>
                    <button
                      onClick={() => copy(suggestion.name)}
                      className="btn-ghost text-xs gap-1 shrink-0"
                    >
                      {copied ? <Check className="w-3.5 h-3.5 text-accent" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </ToolLayout>
  )
}
