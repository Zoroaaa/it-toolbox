import { useState } from 'react'
import { ToolLayout } from '@/components/tool/ToolLayout'
import { meta } from './meta'
import { diffText } from '@it-toolbox/core'

export default function TextDiff() {
  const [oldText, setOldText] = useState('')
  const [newText, setNewText] = useState('')
  const [mode, setMode] = useState<'chars' | 'words' | 'lines'>('lines')

  const diff = diffText(oldText, newText, mode)

  return (
    <ToolLayout meta={meta}>
      <div className="space-y-4">
        <div className="flex items-center gap-4">
          <label className="text-sm text-text-secondary">对比模式:</label>
          <select
            value={mode}
            onChange={(e) => setMode(e.target.value as 'chars' | 'words' | 'lines')}
            className="px-3 py-1.5 bg-bg-secondary border border-border-primary rounded-lg text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-accent-primary"
          >
            <option value="lines">按行</option>
            <option value="words">按词</option>
            <option value="chars">按字符</option>
          </select>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">原始文本</label>
            <textarea
              value={oldText}
              onChange={(e) => setOldText(e.target.value)}
              placeholder="输入原始文本..."
              className="w-full h-60 px-3 py-2 bg-bg-secondary border border-border-primary rounded-lg text-text-primary placeholder-text-tertiary focus:outline-none focus:ring-2 focus:ring-accent-primary font-mono text-sm resize-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">新文本</label>
            <textarea
              value={newText}
              onChange={(e) => setNewText(e.target.value)}
              placeholder="输入新文本..."
              className="w-full h-60 px-3 py-2 bg-bg-secondary border border-border-primary rounded-lg text-text-primary placeholder-text-tertiary focus:outline-none focus:ring-2 focus:ring-accent-primary font-mono text-sm resize-none"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-text-primary mb-2">差异结果</label>
          <div className="w-full min-h-60 px-3 py-2 bg-bg-secondary border border-border-primary rounded-lg font-mono text-sm overflow-auto">
            {diff.length === 0 ? (
              <span className="text-text-tertiary">暂无差异</span>
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

        <div className="flex gap-2">
          <button
            onClick={() => {
              setOldText('')
              setNewText('')
            }}
            className="px-4 py-2 bg-bg-secondary text-text-secondary rounded-lg text-sm font-medium hover:bg-bg-tertiary transition-colors"
          >
            清空
          </button>
        </div>
      </div>
    </ToolLayout>
  )
}
