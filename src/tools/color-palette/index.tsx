import { useState, useMemo } from 'react'
import { Copy, Check } from 'lucide-react'
import chroma from 'chroma-js'
import { ToolLayout } from '@/components/tool/ToolLayout'
import { useAppStore } from '@/store/app'
import { useClipboard } from '@/hooks/useClipboard'
import { meta } from './meta'

type Scheme = 'analogous' | 'complementary' | 'triadic' | 'tetradic' | 'split-complementary' | 'monochromatic' | 'shades'

const SCHEMES: { value: Scheme; label: string; desc: string }[] = [
  { value: 'analogous',           label: '类比色',     desc: '相邻色相，和谐自然' },
  { value: 'complementary',       label: '互补色',     desc: '对立色相，强烈对比' },
  { value: 'split-complementary', label: '分割互补',   desc: '互补色两侧，平衡对比' },
  { value: 'triadic',             label: '三角配色',   desc: '120° 间距，均衡活力' },
  { value: 'tetradic',            label: '四角配色',   desc: '90° 间距，丰富多样' },
  { value: 'monochromatic',       label: '单色系',     desc: '同色相，明度变化' },
  { value: 'shades',              label: '色阶',       desc: '渐变色阶，10级梯度' },
]

function generatePalette(base: string, scheme: Scheme): string[] {
  try {
    const c = chroma(base)
    const [h, s, l] = c.hsl()
    const deg = (offset: number) => chroma.hsl(((h ?? 0) + offset + 360) % 360, s ?? 0.5, l ?? 0.5).hex()

    switch (scheme) {
      case 'analogous':
        return [-30, -15, 0, 15, 30].map(deg)
      case 'complementary':
        return [0, 30, 60, 180, 210, 240].map(deg)
      case 'split-complementary':
        return [deg(0), deg(150), deg(210)]
      case 'triadic':
        return [deg(0), deg(120), deg(240)]
      case 'tetradic':
        return [deg(0), deg(90), deg(180), deg(270)]
      case 'monochromatic':
        return [0.15, 0.3, 0.45, l ?? 0.5, 0.6, 0.75, 0.85].map(lv =>
          chroma.hsl(h ?? 0, s ?? 0.5, lv).hex()
        )
      case 'shades':
        return chroma.scale([chroma(base).brighten(2), base, chroma(base).darken(2)])
          .mode('lab').colors(10)
      default:
        return [base]
    }
  } catch {
    return [base]
  }
}

function contrastRatio(c1: string, c2: string): number {
  try {
    return chroma.contrast(c1, c2)
  } catch {
    return 1
  }
}

function wcagLevel(ratio: number): { label: string; color: string } {
  if (ratio >= 7)   return { label: 'AAA', color: 'text-green-400' }
  if (ratio >= 4.5) return { label: 'AA',  color: 'text-emerald-400' }
  if (ratio >= 3)   return { label: 'AA Large', color: 'text-yellow-400' }
  return { label: 'Fail', color: 'text-red-400' }
}

export default function ColorPaletteGenerator() {
  const [baseColor, setBaseColor] = useState('#6366f1')
  const [scheme, setScheme] = useState<Scheme>('analogous')
  const { addRecentTool } = useAppStore()
  const { copy } = useClipboard()
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null)

  const palette = useMemo(() => generatePalette(baseColor, scheme), [baseColor, scheme])

  const handleCopy = (hex: string, idx: number) => {
    copy(hex)
    setCopiedIdx(idx)
    setTimeout(() => setCopiedIdx(null), 2000)
    addRecentTool(meta.id)
  }

  const copyAll = () => {
    copy(palette.join('\n'))
  }

  return (
    <ToolLayout meta={meta} onReset={() => setBaseColor('#6366f1')}>
      <div className="flex flex-col gap-5">
        {/* Base color + scheme */}
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <input type="color" value={baseColor}
              onChange={e => { setBaseColor(e.target.value); addRecentTool(meta.id) }}
              className="w-10 h-10 rounded-lg cursor-pointer border-0" />
            <input type="text" value={baseColor}
              onChange={e => { setBaseColor(e.target.value); addRecentTool(meta.id) }}
              className="w-28 px-3 py-2 rounded-lg bg-bg-surface border border-border-base text-sm font-mono text-text-primary focus:outline-none focus:border-accent" />
          </div>
          <button onClick={copyAll}
            className="ml-auto flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-bg-raised hover:bg-bg-surface border border-border-base text-sm text-text-secondary transition-colors">
            <Copy className="w-3.5 h-3.5" />复制全部
          </button>
        </div>

        {/* Scheme selector */}
        <div className="flex flex-wrap gap-2">
          {SCHEMES.map(s => (
            <button key={s.value} onClick={() => setScheme(s.value)}
              title={s.desc}
              className={`px-3 py-1.5 rounded-lg border text-sm transition-colors ${
                scheme === s.value
                  ? 'border-accent bg-accent/10 text-accent'
                  : 'border-border-base bg-bg-surface text-text-secondary hover:bg-bg-raised'
              }`}>
              {s.label}
            </button>
          ))}
        </div>

        {/* Palette bar */}
        <div className="flex h-20 rounded-xl overflow-hidden border border-border-base">
          {palette.map((hex, i) => (
            <div key={hex + i} style={{ backgroundColor: hex }} className="flex-1 cursor-pointer hover:flex-[1.5] transition-all duration-200"
              onClick={() => handleCopy(hex, i)} title={hex} />
          ))}
        </div>

        {/* Color cards with WCAG */}
        <div className={`grid gap-3 ${palette.length <= 5 ? 'grid-cols-5' : palette.length <= 7 ? 'grid-cols-7' : 'grid-cols-5'}`}>
          {palette.map((hex, i) => {
            const onWhite = contrastRatio(hex, '#ffffff')
            const onBlack = contrastRatio(hex, '#000000')
            const best = onWhite >= onBlack ? { bg: '#ffffff', ratio: onWhite } : { bg: '#000000', ratio: onBlack }
            const wcag = wcagLevel(best.ratio)
            return (
              <div key={hex + i} className="flex flex-col gap-2">
                <div
                  className="rounded-xl border border-border-base cursor-pointer h-24 flex items-end p-2 transition-transform hover:scale-105"
                  style={{ backgroundColor: hex }}
                  onClick={() => handleCopy(hex, i)}
                >
                  <button className="w-full flex items-center justify-center">
                    {copiedIdx === i
                      ? <Check className="w-4 h-4 text-white drop-shadow" />
                      : <Copy className="w-4 h-4 text-white drop-shadow opacity-70" />}
                  </button>
                </div>
                <div className="text-center">
                  <div className="font-mono text-xs text-text-primary">{hex.toUpperCase()}</div>
                  <div className={`text-xs ${wcag.color}`}>{wcag.label} ({best.ratio.toFixed(1)}:1)</div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Contrast table */}
        <div className="bg-bg-surface border border-border-base rounded-xl p-4">
          <h3 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-3">WCAG 对比度矩阵</h3>
          <div className="overflow-x-auto">
            <table className="text-xs font-mono w-full">
              <thead>
                <tr>
                  <th className="text-left text-text-muted pr-3 pb-2">颜色</th>
                  <th className="text-text-muted pb-2 px-2">on White</th>
                  <th className="text-text-muted pb-2 px-2">on Black</th>
                  <th className="text-text-muted pb-2 px-2">大文本</th>
                  <th className="text-text-muted pb-2 px-2">正文</th>
                </tr>
              </thead>
              <tbody>
                {palette.map((hex, i) => {
                  const onW = contrastRatio(hex, '#ffffff')
                  const onB = contrastRatio(hex, '#000000')
                  return (
                    <tr key={hex + i} className="border-t border-border-base">
                      <td className="py-1.5 pr-3">
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 rounded border border-border-base" style={{ backgroundColor: hex }} />
                          {hex.toUpperCase()}
                        </div>
                      </td>
                      <td className="text-center px-2">{onW.toFixed(1)}:1</td>
                      <td className="text-center px-2">{onB.toFixed(1)}:1</td>
                      <td className={`text-center px-2 ${wcagLevel(Math.max(onW, onB)).color}`}>
                        {Math.max(onW, onB) >= 3 ? '✓' : '✗'}
                      </td>
                      <td className={`text-center px-2 ${wcagLevel(Math.max(onW, onB)).color}`}>
                        {Math.max(onW, onB) >= 4.5 ? '✓' : '✗'}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </ToolLayout>
  )
}
