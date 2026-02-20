import { useState, useEffect } from 'react'
import { Copy, Check } from 'lucide-react'
import { ToolLayout } from '@/components/tool/ToolLayout'
import { convertColor, rgbToHex, type RGB, type ColorConversion } from '@core/index'
import { useAppStore } from '@/store/app'
import { useClipboard } from '@/hooks/useClipboard'
import { meta } from './meta'

export default function ColorPicker() {
  const [hex, setHex] = useState('#6ee7b7')
  const [rgb, setRgb] = useState<RGB>({ r: 110, g: 231, b: 183 })
  const [color, setColor] = useState<ColorConversion | null>(null)
  const { addRecentTool } = useAppStore()
  const { copy } = useClipboard()
  const [copiedField, setCopiedField] = useState<string | null>(null)

  useEffect(() => {
    const result = convertColor(hex)
    if (result.ok) {
      setColor(result.value)
      setRgb(result.value.rgb)
    }
  }, [hex])

  const handleHexChange = (value: string) => {
    setHex(value)
    addRecentTool(meta.id)
  }

  const handleRgbChange = (component: keyof RGB, value: number) => {
    const newRgb = { ...rgb, [component]: Math.min(255, Math.max(0, value)) }
    setRgb(newRgb)
    setHex(rgbToHex(newRgb))
    addRecentTool(meta.id)
  }

  const handleCopy = (field: string, value: string) => {
    copy(value)
    setCopiedField(field)
    setTimeout(() => setCopiedField(null), 2000)
  }

  const reset = () => {
    setHex('#6ee7b7')
    setRgb({ r: 110, g: 231, b: 183 })
  }

  const outputValue = color ? `HEX: ${color.hex}\nRGB: rgb(${color.rgb.r}, ${color.rgb.g}, ${color.rgb.b})\nHSL: hsl(${color.hsl.h}, ${color.hsl.s}%, ${color.hsl.l}%)\nHSV: hsv(${color.hsv.h}, ${color.hsv.s}%, ${color.hsv.v}%)\nCMYK: cmyk(${color.cmyk.c}%, ${color.cmyk.m}%, ${color.cmyk.y}%, ${color.cmyk.k}%)` : ''

  return (
    <ToolLayout meta={meta} onReset={reset} outputValue={outputValue}>
      <div className="flex items-start gap-6 h-[calc(100vh-12rem)]">
        <div className="w-64 flex-shrink-0 space-y-4">
          <div>
            <label className="text-xs font-medium text-text-muted uppercase tracking-wider mb-2 block">颜色预览</label>
            <div
              className="w-full h-32 rounded-xl border border-border-base shadow-inner"
              style={{ backgroundColor: hex }}
            />
          </div>

          <div>
            <label className="text-xs font-medium text-text-muted uppercase tracking-wider mb-2 block">HEX</label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={hex}
                onChange={e => handleHexChange(e.target.value)}
                className="w-10 h-10 rounded-lg cursor-pointer border-0"
              />
              <input
                type="text"
                value={hex}
                onChange={e => handleHexChange(e.target.value)}
                className="flex-1 px-3 py-2 rounded-lg bg-bg-surface border border-border-base text-sm font-mono text-text-primary focus:outline-none focus:border-accent"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-text-muted uppercase tracking-wider mb-2 block">RGB</label>
            <div className="space-y-2">
              {(['r', 'g', 'b'] as const).map(c => (
                <div key={c} className="flex items-center gap-2">
                  <span className="w-4 text-xs text-text-muted uppercase">{c}</span>
                  <input
                    type="range"
                    min={0}
                    max={255}
                    value={rgb[c]}
                    onChange={e => handleRgbChange(c, parseInt(e.target.value))}
                    className="flex-1 accent-accent"
                  />
                  <input
                    type="number"
                    min={0}
                    max={255}
                    value={rgb[c]}
                    onChange={e => handleRgbChange(c, parseInt(e.target.value) || 0)}
                    className="w-14 px-2 py-1 rounded-lg bg-bg-surface border border-border-base text-xs font-mono text-text-primary focus:outline-none focus:border-accent"
                  />
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="flex-1 space-y-3">
          {color && (
            <>
              <ColorField
                label="HEX"
                value={color.hex}
                onCopy={() => handleCopy('hex', color.hex)}
                copied={copiedField === 'hex'}
              />
              <ColorField
                label="RGB"
                value={`rgb(${color.rgb.r}, ${color.rgb.g}, ${color.rgb.b})`}
                onCopy={() => handleCopy('rgb', `rgb(${color.rgb.r}, ${color.rgb.g}, ${color.rgb.b})`)}
                copied={copiedField === 'rgb'}
              />
              <ColorField
                label="HSL"
                value={`hsl(${color.hsl.h}, ${color.hsl.s}%, ${color.hsl.l}%)`}
                onCopy={() => handleCopy('hsl', `hsl(${color.hsl.h}, ${color.hsl.s}%, ${color.hsl.l}%)`)}
                copied={copiedField === 'hsl'}
              />
              <ColorField
                label="HSV"
                value={`hsv(${color.hsv.h}, ${color.hsv.s}%, ${color.hsv.v}%)`}
                onCopy={() => handleCopy('hsv', `hsv(${color.hsv.h}, ${color.hsv.s}%, ${color.hsv.v}%)`)}
                copied={copiedField === 'hsv'}
              />
              <ColorField
                label="CMYK"
                value={`cmyk(${color.cmyk.c}%, ${color.cmyk.m}%, ${color.cmyk.y}%, ${color.cmyk.k}%)`}
                onCopy={() => handleCopy('cmyk', `cmyk(${color.cmyk.c}%, ${color.cmyk.m}%, ${color.cmyk.y}%, ${color.cmyk.k}%)`)}
                copied={copiedField === 'cmyk'}
              />
            </>
          )}
        </div>
      </div>
    </ToolLayout>
  )
}

function ColorField({ label, value, onCopy, copied }: { label: string; value: string; onCopy: () => void; copied: boolean }) {
  return (
    <div className="flex items-center justify-between p-3 rounded-lg bg-bg-surface border border-border-base hover:border-border-strong transition-colors group">
      <div className="flex-1 min-w-0">
        <div className="text-xs text-text-muted mb-1">{label}</div>
        <p className="font-mono text-sm text-text-primary">{value}</p>
      </div>
      <button
        onClick={onCopy}
        className="ml-2 p-1.5 rounded opacity-0 group-hover:opacity-100 hover:bg-bg-raised transition-all"
      >
        {copied ? <Check className="w-4 h-4 text-accent" /> : <Copy className="w-4 h-4 text-text-muted" />}
      </button>
    </div>
  )
}
