import { useState, useEffect, useCallback, useMemo } from 'react'
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
  luminance: number
  perceivedLightness: number
}

function computeFormats(hex: string, alpha: number): ColorFormats | null {
  try {
    const c = chroma(hex).alpha(alpha)
    const [r, g, b] = c.rgb()
    const [h, s, l] = c.hsl()
    const [hv, sv, v] = c.hsv()
    const [L, a_, b_] = c.lab()
    const [lc, cc, hc] = c.oklch()
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
      luminance: c.luminance(),
      perceivedLightness: L,
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

const DEFAULT_COLOR = '#6ee7b7'
const DEFAULT_FORMATS = computeFormats(DEFAULT_COLOR, 1)!

function isValidHexLength(hex: string): boolean {
  if (hex.startsWith('#')) {
    const len = hex.length
    return len === 4 || len === 7 || len === 9
  }
  return hex.length >= 3
}

export default function ColorPicker() {
  const [hex, setHex] = useState(DEFAULT_COLOR)
  const [alpha, setAlpha] = useState(1)
  const [formats, setFormats] = useState<ColorFormats>(DEFAULT_FORMATS)
  const [inputError, setInputError] = useState(false)
  const addRecentTool = useAppStore((s) => s.addRecentTool)
  const { copy } = useClipboard()
  const [copiedKey, setCopiedKey] = useState<string | null>(null)

  useEffect(() => {
    if (!isValidHexLength(hex)) {
      setInputError(false)
      return
    }
    try {
      chroma(hex)
      setInputError(false)
      const newFormats = computeFormats(hex, alpha)
      if (newFormats) {
        setFormats(newFormats)
      }
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

  const outputValue = useMemo(() => 
    Object.entries(formats).filter(([k]) => k !== 'luminance' && k !== 'perceivedLightness').map(([k, v]) => `${k.toUpperCase()}: ${v}`).join('\n'),
    [formats]
  )

  const safeColorForInput = hex.length >= 7 ? hex.slice(0, 7) : DEFAULT_COLOR

  return (
    <ToolLayout meta={meta} onReset={() => { setHex(DEFAULT_COLOR); setAlpha(1); setFormats(DEFAULT_FORMATS) }} outputValue={outputValue}>
      <div className="flex items-start gap-6">
        <div className="w-64 shrink-0 flex flex-col gap-4">
          <div
            className="w-full h-32 rounded-xl border border-border-base shadow-inner transition-colors"
            style={{ backgroundColor: formats.rgba }}
          />

          <div>
            <label className="text-xs font-medium text-text-muted uppercase tracking-wider mb-2 block">颜色</label>
            <div className="flex items-center gap-2">
              <input type="color" value={safeColorForInput} onChange={e => { setHex(e.target.value); addRecentTool(meta.id) }}
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

          <div>
            <label className="text-xs font-medium text-text-muted uppercase tracking-wider mb-2 block">透明度: {Math.round(alpha * 100)}%</label>
            <input type="range" min={0} max={1} step={0.01} value={alpha} onChange={e => setAlpha(+e.target.value)}
              className="w-full accent-[var(--color-accent)]" />
          </div>

          <div className="text-xs text-text-muted space-y-1">
            <div>相对亮度: <span className="font-mono text-text-primary">{(formats.luminance * 100).toFixed(1)}%</span></div>
            <div>感知亮度: <span className="font-mono text-text-primary">{formats.perceivedLightness.toFixed(1)}</span></div>
          </div>
        </div>

        <div className="flex-1 flex flex-col gap-2">
          {FORMAT_GROUPS.map(({ key, label }) => {
            const value = formats[key as keyof ColorFormats] as string
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
