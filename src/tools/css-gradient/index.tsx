import { useState, useMemo } from 'react'
import { ToolLayout } from '@/components/tool/ToolLayout'
import { meta } from './meta'
import { generateCssGradient, type GradientStop } from '@it-toolbox/core'

export default function CssGradientTool() {
  const [type, setType] = useState<'linear' | 'radial' | 'conic'>('linear')
  const [angle, setAngle] = useState(90)
  const [stops, setStops] = useState<GradientStop[]>([
    { color: '#3b82f6', position: 0 },
    { color: '#8b5cf6', position: 100 },
  ])

  const addStop = () => {
    const newPosition = stops.length > 0 ? (stops[stops.length - 1].position + 50) % 100 : 50
    setStops([...stops, { color: '#000000', position: newPosition }])
  }

  const removeStop = (index: number) => {
    if (stops.length > 2) {
      setStops(stops.filter((_, i) => i !== index))
    }
  }

  const updateStop = (index: number, field: 'color' | 'position', value: string | number) => {
    const newStops = [...stops]
    newStops[index] = { ...newStops[index], [field]: value }
    setStops(newStops)
  }

  const css = useMemo(() => {
    return generateCssGradient({ type, angle, stops })
  }, [type, angle, stops])

  const previewStyle = useMemo(() => ({
    background: css,
  }), [css])

  return (
    <ToolLayout meta={meta}>
      <div className="space-y-4">
        <div className="flex gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <label className="text-sm text-text-secondary">类型:</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as 'linear' | 'radial' | 'conic')}
              className="px-3 py-1.5 bg-bg-secondary border border-border-primary rounded-lg text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-accent-primary"
            >
              <option value="linear">线性渐变</option>
              <option value="radial">径向渐变</option>
              <option value="conic">锥形渐变</option>
            </select>
          </div>

          {type === 'linear' && (
            <div className="flex items-center gap-2">
              <label className="text-sm text-text-secondary">角度:</label>
              <input
                type="number"
                value={angle}
                onChange={(e) => setAngle(Number(e.target.value))}
                min={0}
                max={360}
                className="w-20 px-3 py-1.5 bg-bg-secondary border border-border-primary rounded-lg text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-accent-primary"
              />
              <span className="text-text-secondary">°</span>
            </div>
          )}
        </div>

        <div className="p-4 bg-bg-secondary border border-border-primary rounded-lg">
          <div className="flex items-center justify-between mb-3">
            <label className="text-sm font-medium text-text-primary">颜色节点</label>
            <button
              onClick={addStop}
              className="px-3 py-1 bg-accent-primary text-white rounded text-sm hover:bg-accent-secondary transition-colors"
            >
              添加节点
            </button>
          </div>

          <div className="space-y-2">
            {stops.map((stop, index) => (
              <div key={index} className="flex items-center gap-3">
                <input
                  type="color"
                  value={stop.color}
                  onChange={(e) => updateStop(index, 'color', e.target.value)}
                  className="w-10 h-10 rounded cursor-pointer border border-border-primary"
                />
                <input
                  type="number"
                  value={stop.position}
                  onChange={(e) => updateStop(index, 'position', Number(e.target.value))}
                  min={0}
                  max={100}
                  className="w-20 px-3 py-1.5 bg-bg-tertiary border border-border-primary rounded-lg text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-accent-primary"
                />
                <span className="text-text-secondary">%</span>
                {stops.length > 2 && (
                  <button
                    onClick={() => removeStop(index)}
                    className="text-red-400 hover:text-red-300 text-sm"
                  >
                    删除
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        <div
          className="w-full h-48 rounded-lg border border-border-primary"
          style={previewStyle}
        />

        <div className="p-4 bg-bg-secondary border border-border-primary rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-medium text-text-primary">CSS 代码</label>
            <button
              onClick={() => navigator.clipboard.writeText(`background: ${css};`)}
              className="px-3 py-1 bg-bg-tertiary text-text-secondary rounded text-sm hover:bg-border-primary transition-colors"
            >
              复制
            </button>
          </div>
          <code className="block text-sm font-mono text-text-primary break-all">
            background: {css};
          </code>
        </div>
      </div>
    </ToolLayout>
  )
}
