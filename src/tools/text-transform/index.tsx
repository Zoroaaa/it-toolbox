import { useState, useCallback } from 'react'
import { Wand2, RotateCcw, Copy, Check } from 'lucide-react'
import { ToolLayout } from '@/components/tool/ToolLayout'
import { meta } from './meta'
import { transformText } from '@it-toolbox/core'
import { useAppStore } from '@/store/app'
import { useClipboard } from '@/hooks/useClipboard'

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
  const { addHistory, addRecentTool } = useAppStore()
  const { copy, copied } = useClipboard()

  const handleTransform = useCallback(() => {
    if (!input.trim()) {
      setOutput('')
      return
    }
    addRecentTool(meta.id)
    const result = transformText(input, selectedOps)
    if (result.ok) {
      setOutput(result.value)
      addHistory(meta.id, input)
    }
  }, [input, selectedOps, addHistory, addRecentTool])

  const toggleOp = (opId: string) => {
    setSelectedOps((prev) =>
      prev.includes(opId) ? prev.filter((id) => id !== opId) : [...prev, opId]
    )
  }

  const reset = () => {
    setInput('')
    setOutput('')
    setSelectedOps([])
  }

  return (
    <ToolLayout meta={meta} onReset={reset} outputValue={output}>
      <div className="flex items-center gap-2 mb-4 flex-wrap">
        <button onClick={handleTransform} disabled={selectedOps.length === 0} className="btn-primary">
          <Wand2 className="w-4 h-4" />
          执行转换
        </button>
        {output && (
          <button onClick={() => copy(output)} className="btn-ghost">
            {copied ? <Check className="w-4 h-4 text-accent" /> : <Copy className="w-4 h-4" />}
            {copied ? '已复制' : '复制结果'}
          </button>
        )}
      </div>

      <div className="mb-4">
        <label className="text-xs font-medium text-text-muted uppercase tracking-wider block mb-2">选择操作（按顺序执行）</label>
        <div className="flex flex-wrap gap-2">
          {OPERATIONS.map((op) => (
            <button
              key={op.id}
              onClick={() => toggleOp(op.id)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                selectedOps.includes(op.id)
                  ? 'bg-accent text-bg-base'
                  : 'bg-bg-surface text-text-secondary hover:bg-bg-raised border border-border-base'
              }`}
            >
              {op.label}
            </button>
          ))}
        </div>
        {selectedOps.length > 0 && (
          <div className="mt-2 text-sm text-text-muted">
            执行顺序: {selectedOps.map((id) => OPERATIONS.find((op) => op.id === id)?.label).join(' → ')}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 h-[calc(100vh-24rem)]">
        <div className="flex flex-col gap-2">
          <label className="text-xs font-medium text-text-muted uppercase tracking-wider">输入文本</label>
          <textarea
            className="tool-input flex-1 font-mono text-xs leading-relaxed"
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="输入文本..."
            spellCheck={false}
          />
          <div className="text-xs text-text-muted">{input.length} 字符</div>
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-xs font-medium text-text-muted uppercase tracking-wider">输出结果</label>
          <textarea
            className="tool-input flex-1 font-mono text-xs leading-relaxed"
            value={output}
            readOnly
            placeholder="转换结果将在这里显示..."
            spellCheck={false}
          />
          <div className="text-xs text-text-muted">{output.length} 字符</div>
        </div>
      </div>
    </ToolLayout>
  )
}
