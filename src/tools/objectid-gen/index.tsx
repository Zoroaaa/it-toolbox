import { useState } from 'react'
import { ToolLayout } from '@/components/tool/ToolLayout'
import { meta } from './meta'
import { generateObjectId, parseObjectId, type ObjectIdInfo } from '@it-toolbox/core'

export default function ObjectIdGenTool() {
  const [count, setCount] = useState(5)
  const [ids, setIds] = useState<string[]>([])
  const [parseInput, setParseInput] = useState('')
  const [parsedInfo, setParsedInfo] = useState<ObjectIdInfo | null>(null)
  const [parseError, setParseError] = useState('')

  const handleGenerate = () => {
    setIds(Array.from({ length: count }, () => generateObjectId()))
  }

  const handleParse = () => {
    setParseError('')
    if (!parseInput.trim()) {
      setParsedInfo(null)
      return
    }

    const result = parseObjectId(parseInput.trim())
    if (result.ok) {
      setParsedInfo(result.value)
    } else {
      setParseError(result.error)
      setParsedInfo(null)
    }
  }

  const copyAll = () => {
    navigator.clipboard.writeText(ids.join('\n'))
  }

  return (
    <ToolLayout meta={meta}>
      <div className="space-y-6">
        <div className="space-y-4">
          <h3 className="text-sm font-medium text-text-primary">生成 ObjectId</h3>
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

        <div className="space-y-4">
          <h3 className="text-sm font-medium text-text-primary">解析 ObjectId</h3>
          <div className="flex gap-2">
            <input
              type="text"
              value={parseInput}
              onChange={(e) => setParseInput(e.target.value)}
              placeholder="输入 24 位 ObjectId..."
              className="flex-1 px-3 py-2 bg-bg-secondary border border-border-primary rounded-lg text-text-primary font-mono text-sm focus:outline-none focus:ring-2 focus:ring-accent-primary"
            />
            <button
              onClick={handleParse}
              className="px-4 py-2 bg-accent-primary text-white rounded-lg text-sm font-medium hover:bg-accent-secondary transition-colors"
            >
              解析
            </button>
          </div>

          {parseError && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
              {parseError}
            </div>
          )}

          {parsedInfo && (
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-bg-secondary border border-border-primary rounded-lg">
                <div className="text-sm text-text-secondary mb-1">时间戳</div>
                <div className="font-mono text-text-primary">{parsedInfo.timestamp.toLocaleString()}</div>
              </div>
              <div className="p-4 bg-bg-secondary border border-border-primary rounded-lg">
                <div className="text-sm text-text-secondary mb-1">机器 ID</div>
                <div className="font-mono text-text-primary">{parsedInfo.machineId}</div>
              </div>
              <div className="p-4 bg-bg-secondary border border-border-primary rounded-lg">
                <div className="text-sm text-text-secondary mb-1">进程 ID</div>
                <div className="font-mono text-text-primary">{parsedInfo.processId}</div>
              </div>
              <div className="p-4 bg-bg-secondary border border-border-primary rounded-lg">
                <div className="text-sm text-text-secondary mb-1">计数器</div>
                <div className="font-mono text-text-primary">{parsedInfo.counter}</div>
              </div>
            </div>
          )}
        </div>
      </div>
    </ToolLayout>
  )
}
