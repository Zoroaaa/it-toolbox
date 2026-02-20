import { useState, useMemo } from 'react'
import { ToolLayout } from '@/components/tool/ToolLayout'
import { meta } from './meta'
import { generateColorPalette, rgbToHex, parseHex, rgbToHsl, hslToRgb } from '@it-toolbox/core'

type SchemeType = 'analogous' | 'complementary' | 'triadic' | 'tetradic'

export default function ColorPaletteTool() {
  const [baseColor, setBaseColor] = useState('#3b82f6')
  const [scheme, setScheme] = useState<SchemeType>('analogous')

  const palette = useMemo(() => {
    return generateColorPalette(baseColor, scheme)
  }, [baseColor, scheme])

  const shades = useMemo(() => {
    const rgb = parseHex(baseColor)
    if (!rgb.ok) return []
    
    const hsl = rgbToHsl(rgb.value)
    const result: { color: string; label: string }[] = []
    
    for (let i = 95; i >= 5; i -= 10) {
      const newRgb = hslToRgb({ ...hsl, l: i })
      result.push({ color: rgbToHex(newRgb), label: `${i}%` })
    }
    
    return result
  }, [baseColor])

  return (
    <ToolLayout meta={meta}>
      <div className="space-y-6">
        <div className="flex gap-4 flex-wrap items-center">
          <div className="flex items-center gap-2">
            <label className="text-sm text-text-secondary">基础颜色:</label>
            <input
              type="color"
              value={baseColor}
              onChange={(e) => setBaseColor(e.target.value)}
              className="w-12 h-10 rounded cursor-pointer border border-border-primary"
            />
            <input
              type="text"
              value={baseColor}
              onChange={(e) => setBaseColor(e.target.value)}
              className="w-28 px-3 py-1.5 bg-bg-secondary border border-border-primary rounded-lg text-text-primary font-mono text-sm focus:outline-none focus:ring-2 focus:ring-accent-primary"
            />
          </div>

          <div className="flex items-center gap-2">
            <label className="text-sm text-text-secondary">配色方案:</label>
            <select
              value={scheme}
              onChange={(e) => setScheme(e.target.value as SchemeType)}
              className="px-3 py-1.5 bg-bg-secondary border border-border-primary rounded-lg text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-accent-primary"
            >
              <option value="analogous">类似色</option>
              <option value="complementary">互补色</option>
              <option value="triadic">三角色</option>
              <option value="tetradic">四角色</option>
            </select>
          </div>
        </div>

        <div>
          <h3 className="text-sm font-medium text-text-primary mb-3">配色方案</h3>
          <div className="flex gap-2">
            {palette.map((color, i) => (
              <div key={i} className="flex-1">
                <div
                  className="h-24 rounded-lg cursor-pointer hover:ring-2 hover:ring-accent-primary transition-all"
                  style={{ backgroundColor: color }}
                  onClick={() => navigator.clipboard.writeText(color)}
                  title={color}
                />
                <div className="mt-1 text-xs text-text-secondary text-center font-mono">{color}</div>
              </div>
            ))}
          </div>
        </div>

        <div>
          <h3 className="text-sm font-medium text-text-primary mb-3">明暗变化</h3>
          <div className="flex gap-1">
            {shades.map((item, i) => (
              <div key={i} className="flex-1">
                <div
                  className="h-16 rounded cursor-pointer hover:ring-2 hover:ring-accent-primary transition-all"
                  style={{ backgroundColor: item.color }}
                  onClick={() => navigator.clipboard.writeText(item.color)}
                  title={item.color}
                />
                <div className="mt-1 text-xs text-text-tertiary text-center">{item.label}</div>
              </div>
            ))}
          </div>
        </div>

        <p className="text-sm text-text-tertiary">点击颜色块可复制颜色值</p>
      </div>
    </ToolLayout>
  )
}
