import { useState, useCallback, useRef } from 'react'
import { Upload, Copy, Check } from 'lucide-react'
import ColorThief from 'colorthief'
import { ToolLayout } from '@/components/tool/ToolLayout'
import { useAppStore } from '@/store/app'
import { useClipboard } from '@/hooks/useClipboard'
import { meta } from './meta'

interface Color {
  hex: string
  rgb: [number, number, number]
  pct: number
}

function rgbToHex(r: number, g: number, b: number): string {
  return '#' + [r, g, b].map(v => v.toString(16).padStart(2, '0')).join('')
}

function rgbToHsl(r: number, g: number, b: number): string {
  const rn = r / 255, gn = g / 255, bn = b / 255
  const max = Math.max(rn, gn, bn), min = Math.min(rn, gn, bn)
  const l = (max + min) / 2
  if (max === min) return `hsl(0, 0%, ${Math.round(l * 100)}%)`
  const s = l > 0.5 ? (max - min) / (2 - max - min) : (max - min) / (max + min)
  let h = 0
  if (max === rn) h = ((gn - bn) / (max - min) + 6) % 6
  else if (max === gn) h = (bn - rn) / (max - min) + 2
  else h = (rn - gn) / (max - min) + 4
  return `hsl(${Math.round(h * 60)}, ${Math.round(s * 100)}%, ${Math.round(l * 100)}%)`
}

export default function ColorExtractor() {
  const [colors, setColors] = useState<Color[]>([])
  const [previewUrl, setPreviewUrl] = useState('')
  const [colorCount, setColorCount] = useState(8)
  const [error, setError] = useState('')
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null)
  const imgRef = useRef<HTMLImageElement>(null)
  const { addRecentTool } = useAppStore()
  const { copy } = useClipboard()

  const extractColors = useCallback((img: HTMLImageElement, count: number) => {
    const thief = new ColorThief()
    try {
      const palette = thief.getPalette(img, count)
      if (!palette) return

      // Estimate rough dominance by sampling the image
      const canvas = document.createElement('canvas')
      canvas.width = Math.min(img.naturalWidth, 200)
      canvas.height = Math.min(img.naturalHeight, 200)
      const ctx = canvas.getContext('2d')!
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
      const pixelData = imageData.data
      const totalPixels = canvas.width * canvas.height

      // Count pixels closest to each palette color
      const counts = new Array(palette.length).fill(0)
      for (let i = 0; i < pixelData.length; i += 4) {
        const r = pixelData[i], g = pixelData[i + 1], b = pixelData[i + 2]
        let bestIdx = 0, bestDist = Infinity
        palette.forEach(([pr, pg, pb], idx) => {
          const dist = (r - pr) ** 2 + (g - pg) ** 2 + (b - pb) ** 2
          if (dist < bestDist) { bestDist = dist; bestIdx = idx }
        })
        counts[bestIdx]++
      }

      const result: Color[] = palette.map(([r, g, b], i) => ({
        hex: rgbToHex(r, g, b),
        rgb: [r, g, b],
        pct: Math.round((counts[i] / totalPixels) * 100),
      }))
      result.sort((a, b) => b.pct - a.pct)
      setColors(result)
    } catch (e) {
      setError('颜色提取失败')
    }
  }, [])

  const handleFile = useCallback((file: File) => {
    if (!file.type.startsWith('image/')) { setError('请上传图片文件'); return }
    addRecentTool(meta.id)
    setError('')
    setColors([])

    const url = URL.createObjectURL(file)
    setPreviewUrl(prev => { if (prev) URL.revokeObjectURL(prev); return url })

    // Image must be loaded before ColorThief can work
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => {
      if (imgRef.current) {
        imgRef.current.src = url
      }
      extractColors(img, colorCount)
    }
    img.onerror = () => setError('图片加载失败')
    img.src = url
  }, [colorCount, extractColors, addRecentTool])

  const handleReExtract = useCallback(() => {
    if (!imgRef.current?.src) return
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => extractColors(img, colorCount)
    img.src = imgRef.current.src
  }, [colorCount, extractColors])

  const handleCopy = (color: Color, idx: number, format: 'hex' | 'rgb' | 'hsl') => {
    let val = color.hex
    if (format === 'rgb') val = `rgb(${color.rgb.join(', ')})`
    if (format === 'hsl') val = rgbToHsl(...color.rgb)
    copy(val)
    setCopiedIdx(idx)
    setTimeout(() => setCopiedIdx(null), 2000)
  }

  const [copyFormat, setCopyFormat] = useState<'hex' | 'rgb' | 'hsl'>('hex')

  const reset = () => { setColors([]); setPreviewUrl(''); setError('') }

  return (
    <ToolLayout meta={meta} onReset={reset}>
      <div className="flex flex-col gap-4">

        {/* Upload */}
        {!previewUrl && (
          <label
            className="border-2 border-dashed border-border-base rounded-xl p-12 text-center hover:border-accent transition-colors cursor-pointer"
            onDrop={e => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) handleFile(f) }}
            onDragOver={e => e.preventDefault()}
          >
            <Upload className="w-10 h-10 text-text-muted mx-auto mb-3" />
            <p className="text-text-secondary mb-2">拖拽图片到此处，或点击选择</p>
            <p className="text-xs text-text-muted">使用 ColorThief 提取主色调</p>
            <input type="file" accept="image/*" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = '' }} />
          </label>
        )}

        {error && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 text-red-400 text-sm">{error}</div>
        )}

        {previewUrl && (
          <div className="grid grid-cols-3 gap-4">
            {/* Left: image + controls */}
            <div className="flex flex-col gap-3">
              <img
                ref={imgRef}
                src={previewUrl}
                alt="preview"
                className="w-full rounded-lg border border-border-base object-contain max-h-48"
                crossOrigin="anonymous"
              />

              <div className="flex flex-col gap-2">
                <label className="text-xs text-text-muted">提取颜色数量: {colorCount}</label>
                <input
                  type="range" min={2} max={16} value={colorCount}
                  onChange={e => setColorCount(+e.target.value)}
                  className="w-full accent-[var(--color-accent)]"
                />
                <button
                  onClick={handleReExtract}
                  className="px-3 py-1.5 rounded-lg bg-accent text-bg-base text-xs font-medium hover:bg-accent/90 transition-colors"
                >
                  重新提取
                </button>
                <label className="px-3 py-1.5 rounded-lg bg-bg-raised text-text-secondary text-xs text-center cursor-pointer hover:bg-bg-surface transition-colors">
                  换一张图片
                  <input type="file" accept="image/*" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = '' }} />
                </label>
              </div>

              {/* Copy format selector */}
              <div className="flex gap-1">
                {(['hex', 'rgb', 'hsl'] as const).map(fmt => (
                  <button
                    key={fmt}
                    onClick={() => setCopyFormat(fmt)}
                    className={`flex-1 px-2 py-1 rounded text-xs font-mono transition-colors ${
                      copyFormat === fmt ? 'bg-accent text-bg-base' : 'bg-bg-surface text-text-muted'
                    }`}
                  >
                    {fmt.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>

            {/* Right: palette */}
            <div className="col-span-2 flex flex-col gap-2">
              {/* Color bar */}
              {colors.length > 0 && (
                <div className="h-8 rounded-lg overflow-hidden flex">
                  {colors.map(c => (
                    <div key={c.hex} style={{ backgroundColor: c.hex, width: `${c.pct || 1}%` }} title={c.hex} />
                  ))}
                </div>
              )}

              {/* Color swatches */}
              <div className="flex flex-col gap-2">
                {colors.map((color, idx) => (
                  <div key={color.hex} className="flex items-center gap-3 p-2 rounded-lg bg-bg-surface border border-border-base hover:bg-bg-raised transition-colors">
                    <div
                      className="w-10 h-10 rounded-md border border-border-base shrink-0 shadow-sm"
                      style={{ backgroundColor: color.hex }}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="font-mono text-sm text-text-primary">{color.hex.toUpperCase()}</div>
                      <div className="text-xs text-text-muted">rgb({color.rgb.join(', ')})</div>
                    </div>
                    <div className="text-xs text-text-muted w-10 text-right shrink-0">{color.pct}%</div>
                    <button
                      onClick={() => handleCopy(color, idx, copyFormat)}
                      className="p-1.5 rounded-md bg-bg-raised hover:bg-bg-base transition-colors shrink-0"
                    >
                      {copiedIdx === idx ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5 text-text-muted" />}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </ToolLayout>
  )
}
