import { useState } from 'react'
import { GitCompare, Trash2 } from 'lucide-react'
import { ToolLayout } from '@/components/tool/ToolLayout'
import { meta } from './meta'
import { diffText } from '@it-toolbox/core'
import { useAppStore } from '@/store/app'

type Mode = 'chars' | 'words' | 'lines'

export default function TextDiff() {
  const [oldText, setOldText] = useState('')
  const [newText, setNewText] = useState('')
  const [mode, setMode] = useState<Mode>('lines')
  const { addRecentTool } = useAppStore()

  const diff = diffText(oldText, newText, mode)

  const reset = () => {
    setOldText('')
    setNewText('')
  }

  return (
    <ToolLayout meta={meta} onReset={reset}>
      <div className="flex items-center gap-2 mb-4 flex-wrap">
        <div className="flex items-center gap-1 bg-bg-raised rounded-lg p-1">
          {(['lines', 'words', 'chars'] as Mode[]).map(m => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors
                ${mode === m ? 'bg-accent text-bg-base' : 'text-text-muted hover:text-text-primary'}`}
            >
              {m === 'lines' ? '按行' : m === 'words' ? '按词' : '按字符'}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 h-[calc(100vh-20rem)]">
        <div className="flex flex-col gap-2">
          <label className="text-xs font-medium text-text-muted uppercase tracking-wider">原始文本</label>
          <textarea
            className="tool-input flex-1 font-mono text-xs leading-relaxed"
            value={oldText}
            onChange={e => setOldText(e.target.value)}
            placeholder="输入原始文本..."
            spellCheck={false}
          />
          <div className="text-xs text-text-muted">{oldText.length} 字符</div>
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-xs font-medium text-text-muted uppercase tracking-wider">新文本</label>
          <textarea
            className="tool-input flex-1 font-mono text-xs leading-relaxed"
            value={newText}
            onChange={e => setNewText(e.target.value)}
            placeholder="输入新文本..."
            spellCheck={false}
          />
          <div className="text-xs text-text-muted">{newText.length} 字符</div>
        </div>
      </div>

      <div className="mt-4">
        <label className="text-xs font-medium text-text-muted uppercase tracking-wider block mb-2">差异结果</label>
        <div className="w-full min-h-40 px-3 py-2 bg-bg-surface border border-border-base rounded-lg font-mono text-sm overflow-auto max-h-60">
          {diff.length === 0 ? (
            <span className="text-text-muted">暂无差异</span>
          ) : (
            diff.map((change, i) => (
              <div
                key={i}
                className={`whitespace-pre-wrap ${
                  change.type === 'added'
                    ? 'bg-green-500/20 text-green-400'
                    : change.type === 'removed'
                    ? 'bg-red-500/20 text-red-400'
                    : 'text-text-secondary'
                }`}
              >
                {change.type === 'added' && '+ '}
                {change.type === 'removed' && '- '}
                {change.value}
              </div>
            ))
          )}
        </div>
      </div>
    </ToolLayout>
  )
}
