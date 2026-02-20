import { useState, useMemo } from 'react'
import { Plus, Trash2, Copy, Check } from 'lucide-react'
import { ToolLayout } from '@/components/tool/ToolLayout'
import { meta } from './meta'
import { generateBoxShadow, type BoxShadowConfig } from '@it-toolbox/core'

const DEFAULT_SHADOW: BoxShadowConfig = {
  x: 0,
  y: 4,
  blur: 6,
  spread: -1,
  color: 'rgba(0, 0, 0, 0.1)',
  inset: false,
}

export default function BoxShadowGen() {
  const [shadows, setShadows] = useState<BoxShadowConfig[]>([DEFAULT_SHADOW])
  const [copied, setCopied] = useState(false)

  const cssCode = useMemo(() => {
    return `box-shadow: ${generateBoxShadow(shadows)};`
  }, [shadows])

  const updateShadow = (index: number, updates: Partial<BoxShadowConfig>) => {
    setShadows((prev) =>
      prev.map((s, i) => (i === index ? { ...s, ...updates } : s))
    )
  }

  const addShadow = () => {
    setShadows((prev) => [...prev, { ...DEFAULT_SHADOW }])
  }

  const removeShadow = (index: number) => {
    if (shadows.length > 1) {
      setShadows((prev) => prev.filter((_, i) => i !== index))
    }
  }

  const copyToClipboard = async () => {
    await navigator.clipboard.writeText(cssCode)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const reset = () => {
    setShadows([DEFAULT_SHADOW])
  }

  return (
    <ToolLayout meta={meta} onReset={reset} outputValue={cssCode}>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-text-primary">阴影配置</h3>
            <button
              onClick={addShadow}
              className="btn-ghost text-xs flex items-center gap-1"
            >
              <Plus className="w-3 h-3" />
              添加阴影
            </button>
          </div>

          <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
            {shadows.map((shadow, index) => (
              <div
                key={index}
                className="bg-bg-raised border border-border-base rounded-lg p-4 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-text-muted">
                    阴影 {index + 1}
                  </span>
                  {shadows.length > 1 && (
                    <button
                      onClick={() => removeShadow(index)}
                      className="text-text-muted hover:text-red-400 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-text-muted block mb-1">X 偏移</label>
                    <input
                      type="number"
                      value={shadow.x}
                      onChange={(e) =>
                        updateShadow(index, { x: parseInt(e.target.value) || 0 })
                      }
                      className="w-full px-2 py-1.5 bg-bg-base border border-border-base rounded text-sm text-text-primary"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-text-muted block mb-1">Y 偏移</label>
                    <input
                      type="number"
                      value={shadow.y}
                      onChange={(e) =>
                        updateShadow(index, { y: parseInt(e.target.value) || 0 })
                      }
                      className="w-full px-2 py-1.5 bg-bg-base border border-border-base rounded text-sm text-text-primary"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-text-muted block mb-1">模糊</label>
                    <input
                      type="number"
                      value={shadow.blur}
                      onChange={(e) =>
                        updateShadow(index, { blur: parseInt(e.target.value) || 0 })
                      }
                      min="0"
                      className="w-full px-2 py-1.5 bg-bg-base border border-border-base rounded text-sm text-text-primary"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-text-muted block mb-1">扩展</label>
                    <input
                      type="number"
                      value={shadow.spread}
                      onChange={(e) =>
                        updateShadow(index, { spread: parseInt(e.target.value) || 0 })
                      }
                      className="w-full px-2 py-1.5 bg-bg-base border border-border-base rounded text-sm text-text-primary"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="flex-1">
                    <label className="text-xs text-text-muted block mb-1">颜色</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={shadow.color.startsWith('rgba') ? '#000000' : shadow.color}
                        onChange={(e) =>
                          updateShadow(index, { color: e.target.value })
                        }
                        className="w-8 h-8 rounded cursor-pointer border border-border-base"
                      />
                      <input
                        type="text"
                        value={shadow.color}
                        onChange={(e) =>
                          updateShadow(index, { color: e.target.value })
                        }
                        className="flex-1 px-2 py-1.5 bg-bg-base border border-border-base rounded text-xs text-text-primary font-mono"
                      />
                    </div>
                  </div>
                  <div className="flex items-center gap-2 pt-5">
                    <input
                      type="checkbox"
                      id={`inset-${index}`}
                      checked={shadow.inset}
                      onChange={(e) =>
                        updateShadow(index, { inset: e.target.checked })
                      }
                      className="w-4 h-4 rounded border-border-base"
                    />
                    <label
                      htmlFor={`inset-${index}`}
                      className="text-xs text-text-muted"
                    >
                      内阴影
                    </label>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-sm font-medium text-text-primary">预览</h3>
          <div className="bg-bg-raised border border-border-base rounded-lg p-8 flex items-center justify-center min-h-[300px]">
            <div
              className="w-48 h-48 bg-white rounded-lg transition-all duration-200"
              style={{ boxShadow: generateBoxShadow(shadows) }}
            />
          </div>

          <div className="bg-bg-raised border border-border-base rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-text-muted">CSS 代码</span>
              <button
                onClick={copyToClipboard}
                className="btn-ghost text-xs flex items-center gap-1"
              >
                {copied ? (
                  <>
                    <Check className="w-3 h-3 text-green-400" />
                    已复制
                  </>
                ) : (
                  <>
                    <Copy className="w-3 h-3" />
                    复制
                  </>
                )}
              </button>
            </div>
            <pre className="text-xs font-mono text-text-primary bg-bg-base p-3 rounded overflow-x-auto">
              {cssCode}
            </pre>
          </div>
        </div>
      </div>
    </ToolLayout>
  )
}
