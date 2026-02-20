import { useState } from 'react'
import { ToolLayout } from '@/components/tool/ToolLayout'
import { meta } from './meta'
import { transformText } from '@it-toolbox/core'

const OPERATIONS = [
  { id: 'uppercase', label: '转大写' },
  { id: 'lowercase', label: '转小写' },
  { id: 'capitalize', label: '首字母大写' },
  { id: 'reverse', label: '反转文本' },
  { id: 'trim', label: '去除首尾空白' },
  { id: 'trim-lines', label: '去除每行首尾空白' },
  { id: 'sort-lines', label: '排序行 (升序)' },
  { id: 'sort-lines-desc', label: '排序行 (降序)' },
  { id: 'remove-empty-lines', label: '删除空行' },
  { id: 'remove-duplicate-lines', label: '删除重复行' },
  { id: 'shuffle-lines', label: '随机打乱行' },
  { id: 'number-lines', label: '添加行号' },
]

export default function TextTransform() {
  const [input, setInput] = useState('')
  const [output, setOutput] = useState('')
  const [selectedOps, setSelectedOps] = useState<string[]>([])

  const handleTransform = () => {
    if (!input.trim()) {
      setOutput('')
      return
    }

    const result = transformText(input, selectedOps)
    if (result.ok) {
      setOutput(result.value)
    }
  }

  const toggleOp = (opId: string) => {
    setSelectedOps((prev) =>
      prev.includes(opId) ? prev.filter((id) => id !== opId) : [...prev, opId]
    )
  }

  return (
    <ToolLayout meta={meta}>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-text-primary mb-2">选择操作（按顺序执行）</label>
          <div className="flex flex-wrap gap-2">
            {OPERATIONS.map((op) => (
              <button
                key={op.id}
                onClick={() => toggleOp(op.id)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  selectedOps.includes(op.id)
                    ? 'bg-accent-primary text-white'
                    : 'bg-bg-secondary text-text-secondary hover:bg-bg-tertiary'
                }`}
              >
                {op.label}
              </button>
            ))}
          </div>
          {selectedOps.length > 0 && (
            <div className="mt-2 text-sm text-text-secondary">
              执行顺序: {selectedOps.map((id) => OPERATIONS.find((op) => op.id === id)?.label).join(' → ')}
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">输入文本</label>
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="输入文本..."
              className="w-full h-80 px-3 py-2 bg-bg-secondary border border-border-primary rounded-lg text-text-primary placeholder-text-tertiary focus:outline-none focus:ring-2 focus:ring-accent-primary font-mono text-sm resize-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">输出结果</label>
            <textarea
              value={output}
              readOnly
              placeholder="转换结果..."
              className="w-full h-80 px-3 py-2 bg-bg-secondary border border-border-primary rounded-lg text-text-primary placeholder-text-tertiary font-mono text-sm resize-none"
            />
          </div>
        </div>

        <div className="flex gap-2">
          <button
            onClick={handleTransform}
            disabled={selectedOps.length === 0}
            className="px-4 py-2 bg-accent-primary text-white rounded-lg text-sm font-medium hover:bg-accent-secondary transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            执行转换
          </button>
          <button
            onClick={() => {
              setInput('')
              setOutput('')
              setSelectedOps([])
            }}
            className="px-4 py-2 bg-bg-secondary text-text-secondary rounded-lg text-sm font-medium hover:bg-bg-tertiary transition-colors"
          >
            清空
          </button>
          {output && (
            <button
              onClick={() => navigator.clipboard.writeText(output)}
              className="px-4 py-2 bg-bg-secondary text-text-secondary rounded-lg text-sm font-medium hover:bg-bg-tertiary transition-colors"
            >
              复制结果
            </button>
          )}
        </div>
      </div>
    </ToolLayout>
  )
}
