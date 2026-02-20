import { useState, useMemo } from 'react'
import { ToolLayout } from '@/components/tool/ToolLayout'
import { meta } from './meta'
import { checkContrast, type ContrastResult } from '@it-toolbox/core'

export default function ContrastCheckerTool() {
  const [foreground, setForeground] = useState('#000000')
  const [background, setBackground] = useState('#ffffff')

  const result = useMemo<ContrastResult | null>(() => {
    const r = checkContrast(foreground, background)
    return r.ok ? r.value : null
  }, [foreground, background])

  const getGradeColor = (pass: boolean) => (pass ? 'text-green-400' : 'text-red-400')

  return (
    <ToolLayout meta={meta}>
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-text-secondary mb-2">前景色 (文字)</label>
            <div className="flex gap-2">
              <input
                type="color"
                value={foreground}
                onChange={(e) => setForeground(e.target.value)}
                className="w-12 h-10 rounded cursor-pointer border border-border-primary"
              />
              <input
                type="text"
                value={foreground}
                onChange={(e) => setForeground(e.target.value)}
                className="flex-1 px-3 py-2 bg-bg-secondary border border-border-primary rounded-lg text-text-primary font-mono text-sm focus:outline-none focus:ring-2 focus:ring-accent-primary"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm text-text-secondary mb-2">背景色</label>
            <div className="flex gap-2">
              <input
                type="color"
                value={background}
                onChange={(e) => setBackground(e.target.value)}
                className="w-12 h-10 rounded cursor-pointer border border-border-primary"
              />
              <input
                type="text"
                value={background}
                onChange={(e) => setBackground(e.target.value)}
                className="flex-1 px-3 py-2 bg-bg-secondary border border-border-primary rounded-lg text-text-primary font-mono text-sm focus:outline-none focus:ring-2 focus:ring-accent-primary"
              />
            </div>
          </div>
        </div>

        <div
          className="p-8 rounded-lg border border-border-primary text-center"
          style={{ backgroundColor: background, color: foreground }}
        >
          <div className="text-2xl font-bold mb-2">预览文本</div>
          <div className="text-base">这是一段预览文本，用于展示颜色对比效果。</div>
          <div className="text-sm mt-2 opacity-75">This is a preview text to demonstrate the color contrast.</div>
        </div>

        {result && (
          <div className="p-4 bg-bg-secondary border border-border-primary rounded-lg">
            <div className="text-center mb-4">
              <div className="text-4xl font-bold text-text-primary">{result.ratio.toFixed(2)}:1</div>
              <div className="text-sm text-text-secondary">对比度</div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-3 bg-bg-tertiary rounded-lg">
                <div className="text-xs text-text-tertiary mb-1">AA 普通文本</div>
                <div className={`text-lg font-bold ${getGradeColor(result.aaNormal)}`}>
                  {result.aaNormal ? '✓ 通过' : '✗ 未通过'}
                </div>
                <div className="text-xs text-text-tertiary">≥ 4.5:1</div>
              </div>

              <div className="text-center p-3 bg-bg-tertiary rounded-lg">
                <div className="text-xs text-text-tertiary mb-1">AA 大文本</div>
                <div className={`text-lg font-bold ${getGradeColor(result.aaLarge)}`}>
                  {result.aaLarge ? '✓ 通过' : '✗ 未通过'}
                </div>
                <div className="text-xs text-text-tertiary">≥ 3:1</div>
              </div>

              <div className="text-center p-3 bg-bg-tertiary rounded-lg">
                <div className="text-xs text-text-tertiary mb-1">AAA 普通文本</div>
                <div className={`text-lg font-bold ${getGradeColor(result.aaaNormal)}`}>
                  {result.aaaNormal ? '✓ 通过' : '✗ 未通过'}
                </div>
                <div className="text-xs text-text-tertiary">≥ 7:1</div>
              </div>

              <div className="text-center p-3 bg-bg-tertiary rounded-lg">
                <div className="text-xs text-text-tertiary mb-1">AAA 大文本</div>
                <div className={`text-lg font-bold ${getGradeColor(result.aaaLarge)}`}>
                  {result.aaaLarge ? '✓ 通过' : '✗ 未通过'}
                </div>
                <div className="text-xs text-text-tertiary">≥ 4.5:1</div>
              </div>
            </div>
          </div>
        )}

        <div className="p-4 bg-bg-secondary border border-border-primary rounded-lg text-sm text-text-secondary">
          <h4 className="font-medium text-text-primary mb-2">WCAG 对比度标准说明</h4>
          <ul className="list-disc list-inside space-y-1">
            <li><strong>AA 级别</strong>：普通文本需要至少 4.5:1，大文本需要至少 3:1</li>
            <li><strong>AAA 级别</strong>：普通文本需要至少 7:1，大文本需要至少 4.5:1</li>
            <li><strong>大文本</strong>：至少 18pt 或 14pt 粗体</li>
          </ul>
        </div>
      </div>
    </ToolLayout>
  )
}
