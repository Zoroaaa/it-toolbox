import { useState, useMemo } from 'react'
import { ToolLayout } from '@/components/tool/ToolLayout'
import { meta } from './meta'
import { simulateColorBlindness, type ColorBlindnessType } from '@it-toolbox/core'

const BLINDNESS_TYPES: { value: ColorBlindnessType; label: string; description: string }[] = [
  { value: 'protanopia', label: '红色盲', description: '无法感知红色' },
  { value: 'deuteranopia', label: '绿色盲', description: '无法感知绿色' },
  { value: 'tritanopia', label: '蓝色盲', description: '无法感知蓝色' },
  { value: 'protanomaly', label: '红色弱', description: '红色感知减弱' },
  { value: 'deuteranomaly', label: '绿色弱', description: '绿色感知减弱' },
  { value: 'tritanomaly', label: '蓝色弱', description: '蓝色感知减弱' },
  { value: 'achromatopsia', label: '全色盲', description: '无法感知任何颜色' },
  { value: 'achromatomaly', label: '全色弱', description: '颜色感知严重减弱' },
]

const DEMO_COLORS = [
  '#FF0000', '#00FF00', '#0000FF', '#FFFF00', '#FF00FF', '#00FFFF',
  '#FFA500', '#800080', '#008000', '#000080', '#800000', '#008080',
  '#FFC0CB', '#A52A2A', '#D2691E', '#FFD700', '#4B0082', '#7FFF00',
]

export default function ColorBlindness() {
  const [inputColor, setInputColor] = useState('#3B82F6')

  const simulatedColors = useMemo(() => {
    const result: Record<ColorBlindnessType, string> = {} as Record<ColorBlindnessType, string>
    for (const type of BLINDNESS_TYPES) {
      result[type.value] = simulateColorBlindness(inputColor, type.value)
    }
    return result
  }, [inputColor])

  const demoPalette = useMemo(() => {
    return DEMO_COLORS.map(color => ({
      original: color,
      simulated: BLINDNESS_TYPES.reduce((acc, type) => {
        acc[type.value] = simulateColorBlindness(color, type.value)
        return acc
      }, {} as Record<ColorBlindnessType, string>),
    }))
  }, [])

  const reset = () => {
    setInputColor('#3B82F6')
  }

  return (
    <ToolLayout meta={meta} onReset={reset}>
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <label className="text-xs font-medium text-text-muted uppercase tracking-wider">选择颜色</label>
          <input
            type="color"
            value={inputColor}
            onChange={(e) => setInputColor(e.target.value)}
            className="w-12 h-10 rounded cursor-pointer border border-border-base"
          />
          <input
            type="text"
            value={inputColor}
            onChange={(e) => setInputColor(e.target.value)}
            className="tool-input font-mono w-28"
          />
        </div>

        <div>
          <h3 className="text-xs font-medium text-text-muted uppercase tracking-wider mb-3">单色模拟</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {BLINDNESS_TYPES.map((type) => (
              <div
                key={type.value}
                className="bg-bg-raised border border-border-base rounded-lg p-3"
              >
                <div
                  className="w-full h-16 rounded mb-2"
                  style={{ backgroundColor: simulatedColors[type.value] }}
                />
                <div className="text-sm font-medium text-text-primary">{type.label}</div>
                <div className="text-xs text-text-muted">{type.description}</div>
                <div className="text-xs font-mono text-text-secondary mt-1">
                  {simulatedColors[type.value]}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div>
          <h3 className="text-xs font-medium text-text-muted uppercase tracking-wider mb-3">对比原图</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2">
            {demoPalette.map((item, index) => (
              <div key={index} className="space-y-1">
                <div
                  className="w-full h-8 rounded"
                  style={{ backgroundColor: item.original }}
                />
                <div className="text-xs text-center text-text-muted font-mono">
                  {item.original}
                </div>
              </div>
            ))}
          </div>
        </div>

        {BLINDNESS_TYPES.map((type) => (
          <div key={type.value}>
            <h3 className="text-xs font-medium text-text-muted uppercase tracking-wider mb-3">{type.label}视图</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2">
              {demoPalette.map((item, index) => (
                <div key={index} className="space-y-1">
                  <div
                    className="w-full h-8 rounded"
                    style={{ backgroundColor: item.simulated[type.value] }}
                  />
                  <div className="text-xs text-center text-text-muted font-mono">
                    {item.simulated[type.value]}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}

        <div className="bg-bg-raised border border-border-base rounded-lg p-4">
          <h3 className="text-xs font-medium text-text-muted uppercase tracking-wider mb-2">色盲类型说明</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs text-text-muted">
            <div><strong>红色盲:</strong> 约1%男性，无法区分红绿色</div>
            <div><strong>绿色盲:</strong> 约5%男性，最常见的色盲类型</div>
            <div><strong>蓝色盲:</strong> 极罕见，蓝黄色混淆</div>
            <div><strong>全色盲:</strong> 极罕见，只能看到灰度</div>
          </div>
        </div>
      </div>
    </ToolLayout>
  )
}
