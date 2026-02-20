import { useState, useMemo } from 'react'
import { AlertCircle } from 'lucide-react'
import { ToolLayout } from '@/components/tool/ToolLayout'
import { testRegex } from '@core/index'
import { meta } from './meta'

const COMMON_REGEX = [
  { name: '邮箱', pattern: '[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}' },
  { name: '手机号(中国)', pattern: '1[3-9]\\d{9}' },
  { name: 'URL', pattern: 'https?://[\\w.-]+(?:/[\\w./-]*)?' },
  { name: 'IPv4', pattern: '\\b(?:\\d{1,3}\\.){3}\\d{1,3}\\b' },
  { name: '日期 YYYY-MM-DD', pattern: '\\d{4}-\\d{2}-\\d{2}' },
  { name: '时间 HH:MM:SS', pattern: '\\d{2}:\\d{2}:\\d{2}' },
  { name: '身份证号', pattern: '\\d{17}[\\dXx]' },
  { name: '十六进制颜色', pattern: '#[0-9a-fA-F]{6}' },
]

export default function RegexTester() {
  const [pattern, setPattern] = useState('')
  const [input, setInput] = useState('')
  const [flags, setFlags] = useState('g')

  const result = useMemo(() => {
    if (!pattern) return { matches: [], error: undefined }
    return testRegex(pattern, input, flags)
  }, [pattern, input, flags])

  const highlightedText = useMemo(() => {
    if (!pattern || result.error || result.matches.length === 0) return input

    let highlighted = ''
    let lastIndex = 0

    result.matches.forEach(match => {
      highlighted += input.slice(lastIndex, match.start)
      highlighted += `<mark class="bg-accent/30 text-accent rounded px-0.5">${input.slice(match.start, match.end)}</mark>`
      lastIndex = match.end
    })

    highlighted += input.slice(lastIndex)
    return highlighted
  }, [pattern, input, result])

  const toggleFlag = (flag: string) => {
    setFlags(prev => prev.includes(flag) ? prev.replace(flag, '') : prev + flag)
  }

  const reset = () => {
    setPattern('')
    setInput('')
    setFlags('g')
  }

  const outputValue = result.matches.map(m => m.match).join('\n')

  return (
    <ToolLayout meta={meta} onReset={reset} outputValue={outputValue}>
      <div className="flex items-center gap-2 mb-4 flex-wrap">
        <div className="flex-1 min-w-64">
          <input
            type="text"
            value={pattern}
            onChange={e => setPattern(e.target.value)}
            placeholder="输入正则表达式..."
            className="w-full px-3 py-2 rounded-lg bg-bg-surface border border-border-base font-mono text-sm text-text-primary focus:outline-none focus:border-accent"
          />
        </div>

        <div className="flex items-center gap-1 bg-bg-raised rounded-lg p-1">
          {['g', 'i', 'm', 's'].map(f => (
            <button
              key={f}
              onClick={() => toggleFlag(f)}
              className={`px-2.5 py-1 rounded-md text-xs font-mono font-medium transition-colors
                ${flags.includes(f) ? 'bg-accent text-bg-base' : 'text-text-muted hover:text-text-primary'}`}
              title={f === 'g' ? '全局匹配' : f === 'i' ? '忽略大小写' : f === 'm' ? '多行模式' : 'dotAll'}
            >
              {f}
            </button>
          ))}
        </div>

        <select
          onChange={e => setPattern(e.target.value)}
          className="px-3 py-2 rounded-lg bg-bg-surface border border-border-base text-sm text-text-primary focus:outline-none focus:border-accent"
          defaultValue=""
        >
          <option value="" disabled>常用正则</option>
          {COMMON_REGEX.map(r => (
            <option key={r.name} value={r.pattern}>{r.name}</option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 h-[calc(100vh-20rem)]">
        <div className="flex flex-col gap-2">
          <label className="text-xs font-medium text-text-muted uppercase tracking-wider">测试文本</label>
          <textarea
            className="tool-input flex-1 font-mono text-xs leading-relaxed"
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="输入要测试的文本..."
            spellCheck={false}
          />
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-xs font-medium text-text-muted uppercase tracking-wider">
            匹配结果
            {result.matches.length > 0 && (
              <span className="ml-2 text-accent">{result.matches.length} 个匹配</span>
            )}
          </label>
          {result.error ? (
            <div className="flex-1 rounded-lg bg-rose-500/10 border border-rose-500/30 p-4 flex items-start gap-3">
              <AlertCircle className="w-4 h-4 text-rose-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-rose-500 mb-1">正则表达式错误</p>
                <p className="text-xs text-rose-400/80">{result.error}</p>
              </div>
            </div>
          ) : (
            <div
              className="tool-input flex-1 font-mono text-xs leading-relaxed whitespace-pre-wrap"
              dangerouslySetInnerHTML={{ __html: highlightedText || '<span class="text-text-muted">匹配结果将在这里高亮显示...</span>' }}
            />
          )}
        </div>
      </div>

      {result.matches.length > 0 && !result.error && (
        <div className="mt-4">
          <label className="text-xs font-medium text-text-muted uppercase tracking-wider mb-2 block">匹配详情</label>
          <div className="max-h-40 overflow-y-auto space-y-2">
            {result.matches.map((m, i) => (
              <div key={i} className="flex items-center gap-3 p-2 rounded-lg bg-bg-surface border border-border-base">
                <span className="text-xs text-text-muted w-8">#{i + 1}</span>
                <span className="font-mono text-sm text-text-primary flex-1 truncate">{m.match}</span>
                <span className="text-xs text-text-muted">[{m.start}-{m.end}]</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </ToolLayout>
  )
}
