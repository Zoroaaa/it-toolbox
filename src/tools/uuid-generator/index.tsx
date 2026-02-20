import { useState, useCallback } from 'react'
import { RefreshCw, Download } from 'lucide-react'
import { ToolLayout } from '@/components/tool/ToolLayout'
import { generateUUIDs } from '@core/index'
import { useAppStore } from '@/store/app'
import { meta } from './meta'

export default function UuidGenerator() {
  const [uuids, setUuids] = useState<string[]>([])
  const [count, setCount] = useState(10)
  const [uppercase, setUppercase] = useState(false)
  const [noHyphens, setNoHyphens] = useState(false)
  const { addRecentTool } = useAppStore()

  const generate = useCallback(() => {
    addRecentTool(meta.id)
    const result = generateUUIDs(count, { uppercase, noHyphens })
    setUuids(result)
  }, [count, uppercase, noHyphens, addRecentTool])

  const reset = () => {
    setUuids([])
    setCount(10)
    setUppercase(false)
    setNoHyphens(false)
  }

  const outputValue = uuids.join('\n')

  const downloadAsText = () => {
    const blob = new Blob([outputValue], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'uuids.txt'
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <ToolLayout meta={meta} onReset={reset} outputValue={outputValue}>
      <div className="flex items-center gap-4 mb-4 flex-wrap">
        <button onClick={generate} className="btn-primary">
          <RefreshCw className="w-4 h-4" />
          生成
        </button>

        <div className="flex items-center gap-2">
          <label className="text-xs text-text-muted">数量</label>
          <input
            type="number"
            min={1}
            max={1000}
            value={count}
            onChange={e => setCount(Math.min(1000, Math.max(1, parseInt(e.target.value) || 1)))}
            className="w-20 px-2 py-1.5 rounded-lg bg-bg-surface border border-border-base text-sm text-text-primary focus:outline-none focus:border-accent"
          />
        </div>

        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={uppercase}
            onChange={e => setUppercase(e.target.checked)}
            className="w-4 h-4 rounded border-border-base bg-bg-surface accent-accent"
          />
          <span className="text-sm text-text-secondary">大写</span>
        </label>

        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={noHyphens}
            onChange={e => setNoHyphens(e.target.checked)}
            className="w-4 h-4 rounded border-border-base bg-bg-surface accent-accent"
          />
          <span className="text-sm text-text-secondary">无连字符</span>
        </label>

        {uuids.length > 0 && (
          <button onClick={downloadAsText} className="btn-ghost ml-auto">
            <Download className="w-4 h-4" />
            下载
          </button>
        )}
      </div>

      <div className="flex-1 min-h-0">
        {uuids.length > 0 ? (
          <div className="h-full overflow-y-auto rounded-lg bg-bg-surface border border-border-base p-4">
            <pre className="font-mono text-xs text-text-primary leading-relaxed">{uuids.join('\n')}</pre>
          </div>
        ) : (
          <div className="h-full rounded-lg bg-bg-raised border border-border-base flex items-center justify-center">
            <p className="text-text-muted text-sm">点击"生成"按钮创建 UUID</p>
          </div>
        )}
      </div>

      {uuids.length > 0 && (
        <div className="mt-2 text-xs text-text-muted">
          已生成 {uuids.length} 个 UUID
        </div>
      )}
    </ToolLayout>
  )
}
