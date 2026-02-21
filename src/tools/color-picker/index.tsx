import { useState, useEffect, useCallback } from 'react'
import { Copy, Check, RefreshCw } from 'lucide-react'
import chroma from 'chroma-js'
import { ToolLayout } from '@/components/tool/ToolLayout'
import { useAppStore } from '@/store/app'
import { useClipboard } from '@/hooks/useClipboard'
import { meta } from './meta'

interface ColorFormats {
  hex: string
  hexAlpha: string
  rgb: string
  rgba: string
  hsl: string
  hsla: string
  hsv: string
  cmyk: string
  lab: string
  oklch: string
  css: string
}

function computeFormats(hex: string, alpha: number): ColorFormats | null {
  try {
    const c = chroma(hex).alpha(alpha)
    const [r, g, b] = c.rgb()
    const [h, s, l] = c.hsl()
    const [hv, sv, v] = c.hsv()
    const [L, a_, b_] = c.lab()
    const [lc, cc, hc] = c.oklch()
    // CMYK
    const r1 = r / 255, g1 = g / 255, b1 = b / 255
    const k = 1 - Math.max(r1, g1, b1)
    const cm = k === 1 ? 0 : (1 - r1 - k) / (1 - k)
    const ym = k === 1 ? 0 : (1 - g1 - k) / (1 - k)
    const km = k === 1 ? 0 : (1 - b1 - k) / (1 - k)

    return {
      hex: c.hex('rgb'),
      hexAlpha: c.hex('rgba'),
      rgb: `rgb(${Math.round(r)}, ${Math.round(g)}, ${Math.round(b)})`,
      rgba: `rgba(${Math.round(r)}, ${Math.round(g)}, ${Math.round(b)}, ${alpha.toFixed(2)})`,
      hsl: `hsl(${Math.round(h ?? 0)}, ${Math.round((s ?? 0) * 100)}%, ${Math.round((l ?? 0) * 100)}%)`,
      hsla: `hsla(${Math.round(h ?? 0)}, ${Math.round((s ?? 0) * 100)}%, ${Math.round((l ?? 0) * 100)}%, ${alpha.toFixed(2)})`,
      hsv: `hsv(${Math.round(hv ?? 0)}, ${Math.round((sv ?? 0) * 100)}%, ${Math.round((v ?? 0) * 100)}%)`,
      cmyk: `cmyk(${Math.round(cm * 100)}%, ${Math.round(ym * 100)}%, ${Math.round(km * 100)}%, ${Math.round(k * 100)}%)`,
      lab: `lab(${L.toFixed(1)}, ${a_.toFixed(1)}, ${b_.toFixed(1)})`,
      oklch: `oklch(${(lc ?? 0).toFixed(3)}, ${(cc ?? 0).toFixed(3)}, ${Math.round(hc ?? 0)}°)`,
      css: c.css(),
    }
  } catch {
    return null
  }
}

const FORMAT_GROUPS = [
  { key: 'hex',     label: 'HEX' },
  { key: 'hexAlpha', label: 'HEX+α' },
  { key: 'rgb',     label: 'RGB' },
  { key: 'rgba',    label: 'RGBA' },
  { key: 'hsl',     label: 'HSL' },
  { key: 'hsla',    label: 'HSLA' },
  { key: 'hsv',     label: 'HSV' },
  { key: 'cmyk',    label: 'CMYK' },
  { key: 'lab',     label: 'CIE Lab' },
  { key: 'oklch',   label: 'OKLch' },
]

export default function ColorPicker() {
  const [hex, setHex] = useState('#6ee7b7')
  const [alpha, setAlpha] = useState(1)
  const [formats, setFormats] = useState<ColorFormats | null>(null)
  const [inputError, setInputError] = useState(false)
  const { addRecentTool } = useAppStore()
  const { copy } = useClipboard()
  const [copiedKey, setCopiedKey] = useState<string | null>(null)

  useEffect(() => {
    try {
      chroma(hex) // validate
      setInputError(false)
      setFormats(computeFormats(hex, alpha))
    } catch {
      setInputError(true)
    }
  }, [hex, alpha])

  const handleCopy = (key: string, value: string) => {
    copy(value)
    setCopiedKey(key)
    setTimeout(() => setCopiedKey(null), 2000)
  }

  const handleTextInput = useCallback((val: string) => {
    addRecentTool(meta.id)
    setHex(val)
  }, [addRecentTool])

  const randomColor = () => {
    const c = chroma.random()
    setHex(c.hex())
    addRecentTool(meta.id)
  }

  const outputValue = formats
    ? Object.entries(formats).map(([k, v]) => `${k.toUpperCase()}: ${v}`).join('\n')
    : ''

  return (
    <ToolLayout meta={meta} onReset={() => { setHex('#6ee7b7'); setAlpha(1) }} outputValue={outputValue}>
      <div className="flex items-start gap-6">
        {/* Left: color inputs */}
        <div className="w-64 shrink-0 flex flex-col gap-4">
          {/* Preview */}
          <div
            className="w-full h-32 rounded-xl border border-border-base shadow-inner transition-colors"
            style={{ backgroundColor: formats?.rgba ?? hex }}
          />

          {/* Picker + hex input */}
          <div>
            <label className="text-xs font-medium text-text-muted uppercase tracking-wider mb-2 block">颜色</label>
            <div className="flex items-center gap-2">
              <input type="color" value={hex.slice(0, 7)} onChange={e => { setHex(e.target.value); addRecentTool(meta.id) }}
                className="w-10 h-10 rounded-lg cursor-pointer border-0 bg-transparent" />
              <input
                type="text"
                value={hex}
                onChange={e => handleTextInput(e.target.value)}
                className={`flex-1 px-3 py-2 rounded-lg bg-bg-surface border text-sm font-mono text-text-primary focus:outline-none ${inputError ? 'border-red-500' : 'border-border-base focus:border-accent'}`}
                placeholder="#rrggbb"
              />
              <button onClick={randomColor} title="随机颜色"
                className="p-2 rounded-lg bg-bg-raised hover:bg-bg-surface border border-border-base transition-colors">
                <RefreshCw className="w-4 h-4 text-text-muted" />
              </button>
            </div>
          </div>

          {/* Alpha slider */}
          <div>
            <label className="text-xs font-medium text-text-muted uppercase tracking-wider mb-2 block">透明度: {Math.round(alpha * 100)}%</label>
            <input type="range" min={0} max={1} step={0.01} value={alpha} onChange={e => setAlpha(+e.target.value)}
              className="w-full accent-[var(--color-accent)]" />
          </div>

          {/* Luminance info */}
          {formats && (
            <div className="text-xs text-text-muted space-y-1">
              <div>相对亮度: <span className="font-mono text-text-primary">{(chroma(hex).luminance() * 100).toFixed(1)}%</span></div>
              <div>感知亮度: <span className="font-mono text-text-primary">{chroma(hex).lab()[0].toFixed(1)}</span></div>
            </div>
          )}
        </div>

        {/* Right: all formats */}
        <div className="flex-1 flex flex-col gap-2">
          {formats && FORMAT_GROUPS.map(({ key, label }) => {
            const value = formats[key as keyof ColorFormats]
            return (
              <div key={key}
                className="flex items-center justify-between p-3 rounded-lg bg-bg-surface border border-border-base hover:border-border-strong transition-colors group">
                <div className="flex-1 min-w-0">
                  <div className="text-xs text-text-muted mb-0.5">{label}</div>
                  <p className="font-mono text-sm text-text-primary">{value}</p>
                </div>
                <div className="flex items-center gap-2 ml-3">
                  <div className="w-5 h-5 rounded border border-border-base shrink-0" style={{ backgroundColor: formats.rgba }} />
                  <button onClick={() => handleCopy(key, value)}
                    className="p-1.5 rounded opacity-0 group-hover:opacity-100 hover:bg-bg-raised transition-all">
                    {copiedKey === key ? <Check className="w-4 h-4 text-accent" /> : <Copy className="w-4 h-4 text-text-muted" />}
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </ToolLayout>
  )
}
