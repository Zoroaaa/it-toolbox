import { useState } from 'react'
import { ToolLayout } from '@/components/tool/ToolLayout'
import { meta } from './meta'
import { generateNanoIds } from '@it-toolbox/core'

export default function NanoIdGenTool() {
  const [count, setCount] = useState(5)
  const [size, setSize] = useState(21)
  const [ids, setIds] = useState<string[]>([])

  const handleGenerate = () => {
    setIds(generateNanoIds(count, size))
  }

  const copyAll = () => {
    navigator.clipboard.writeText(ids.join('\n'))
  }

  return (
    <ToolLayout meta={meta}>
      <div className="space-y-4">
        <div className="flex gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <label className="text-sm text-text-secondary">数量:</label>
            <input
              type="number"
              value={count}
              onChange={(e) => setCount(Math.max(1, Math.min(100, Number(e.target.value))))}
              min={1}
              max={100}
              className="w-20 px-3 py-1.5 bg-bg-secondary border border-border-primary rounded-lg text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-accent-primary"
            />
          </div>

          <div className="flex items-center gap-2">
            <label className="text-sm text-text-secondary">长度:</label>
            <input
              type="number"
              value={size}
              onChange={(e) => setSize(Math.max(1, Math.min(256, Number(e.target.value))))}
              min={1}
              max={256}
              className="w-20 px-3 py-1.5 bg-bg-secondary border border-border-primary rounded-lg text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-accent-primary"
            />
          </div>

          <button
            onClick={handleGenerate}
            className="px-4 py-2 bg-accent-primary text-white rounded-lg text-sm font-medium hover:bg-accent-secondary transition-colors"
          >
            生成
          </button>
        </div>

        {ids.length > 0 && (
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <label className="text-sm font-medium text-text-primary">生成结果</label>
              <button
                onClick={copyAll}
                className="px-3 py-1 bg-bg-secondary text-text-secondary rounded text-sm hover:bg-bg-tertiary transition-colors"
              >
                复制全部
              </button>
            </div>

            <div className="space-y-1">
              {ids.map((id, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between p-2 bg-bg-secondary border border-border-primary rounded-lg group"
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
