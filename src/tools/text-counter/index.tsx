import { useState, useMemo } from 'react'
import { ToolLayout } from '@/components/tool/ToolLayout'
import { countText, type TextStats } from '@core/index'
import { useAppStore } from '@/store/app'
import { meta } from './meta'

export default function TextCounter() {
  const [input, setInput] = useState('')
  const { addRecentTool } = useAppStore()

  const stats: TextStats = useMemo(() => countText(input), [input])

  const reset = () => {
    setInput('')
  }

  const outputValue = `字符: ${stats.characters}
单词: ${stats.words}
行数: ${stats.lines}
字节: ${stats.bytes}`

  return (
    <ToolLayout meta={meta} onReset={reset} outputValue={outputValue}>
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3 mb-4">
        <StatCard label="字符" value={stats.characters} />
        <StatCard label="无空格" value={stats.charactersNoSpaces} />
        <StatCard label="单词" value={stats.words} />
        <StatCard label="行数" value={stats.lines} />
        <StatCard label="字节" value={stats.bytes} />
        <StatCard label="段落" value={stats.paragraphs} />
        <StatCard label="句子" value={stats.sentences} />
        <StatCard label="阅读时间" value={stats.readingTime} small />
      </div>

      <div className="flex-1 min-h-0">
        <textarea
          className="tool-input h-full font-mono text-xs leading-relaxed"
          value={input}
          onChange={e => { setInput(e.target.value); addRecentTool(meta.id) }}
          placeholder="输入或粘贴文本进行统计...&#10;&#10;支持统计：&#10;• 字符数（含/不含空格）&#10;• 单词数&#10;• 行数&#10;• 字节数&#10;• 段落数&#10;• 句子数&#10;• 阅读时间估算"
          spellCheck={false}
        />
      </div>

      <div className="mt-4 p-4 rounded-xl bg-bg-surface border border-border-base">
        <h3 className="text-xs font-medium text-text-muted uppercase tracking-wider mb-3">详细统计</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div>
            <div className="text-xs text-text-muted mb-1">阅读时间</div>
            <div className="text-lg font-semibold text-text-primary">{stats.readingTime}</div>
            <div className="text-xs text-text-muted">按 200 词/分钟</div>
          </div>
          <div>
            <div className="text-xs text-text-muted mb-1">朗读时间</div>
            <div className="text-lg font-semibold text-text-primary">{stats.speakingTime}</div>
            <div className="text-xs text-text-muted">按 150 词/分钟</div>
          </div>
          <div>
            <div className="text-xs text-text-muted mb-1">平均词长</div>
            <div className="text-lg font-semibold text-text-primary">
              {stats.words > 0 ? (stats.charactersNoSpaces / stats.words).toFixed(1) : 0}
            </div>
            <div className="text-xs text-text-muted">字符/词</div>
          </div>
          <div>
            <div className="text-xs text-text-muted mb-1">平均行长</div>
            <div className="text-lg font-semibold text-text-primary">
              {stats.lines > 0 ? (stats.characters / stats.lines).toFixed(1) : 0}
            </div>
            <div className="text-xs text-text-muted">字符/行</div>
          </div>
        </div>
      </div>
    </ToolLayout>
  )
}

function StatCard({ label, value, small = false }: { label: string; value: string | number; small?: boolean }) {
  return (
    <div className="p-3 rounded-xl bg-bg-surface border border-border-base text-center">
      <div className={`font-semibold text-text-primary ${small ? 'text-sm' : 'text-xl tabular-nums'}`}>
        {value}
      </div>
      <div className="text-xs text-text-muted mt-1">{label}</div>
    </div>
  )
}
