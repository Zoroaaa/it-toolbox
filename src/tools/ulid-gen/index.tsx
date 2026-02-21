import { useState } from 'react'
import { ToolLayout } from '@/components/tool/ToolLayout'
import { meta } from './meta'
import { generateUlids } from '@it-toolbox/core'

export default function UlidGenTool() {
  const [count, setCount] = useState(5)
  const [ids, setIds] = useState<string[]>([])

  const handleGenerate = () => {
    setIds(generateUlids(count))
  }

  const copyAll = () => {
    navigator.clipboard.writeText(ids.join('\n'))
  }

  return (
    <ToolLayout meta={meta}>
      <div className="space-y-4">
        <div className="flex gap-4 flex-wrap items-end">
          <div className="flex items-center gap-2">
            <label className="text-sm text-text-secondary">数量:</label>
            <input
              type="number"
              value={count}
              onChange={(e) => setCount(Math.max(1, Math.min(100, Number(e.target.value))))}
              min={1}
              max={100}
              className="tool-input w-20"
            />
          </div>

          <button onClick={handleGenerate} className="btn-primary">
            生成
          </button>
        </div>

        <div className="p-4 bg-bg-surface border border-border-base rounded-lg text-sm text-text-secondary">
          <strong className="text-text-primary">ULID</strong> (Universally Unique Lexicographically Sortable Identifier) 
          是一种可按字典序排序的唯一标识符，长度为 26 个字符，使用 Crockford's Base32 编码。
        </div>

        {ids.length > 0 && (
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <label className="text-sm font-medium text-text-primary">生成结果</label>
              <button onClick={copyAll} className="btn-ghost text-sm">
                复制全部
              </button>
            </div>

            <div className="space-y-1">
              {ids.map((id, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between p-2 bg-bg-surface border border-border-base rounded-lg group"
                >
                  <code className="font-mono text-sm text-text-primary">{id}</code>
                  <button
                    onClick={() => navigator.clipboard.writeText(id)}
                    className="px-2 py-1 text-text-tertiary hover:text-text-primary text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    复制
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </ToolLayout>
  )
}
