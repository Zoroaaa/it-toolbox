import { useState, useMemo } from 'react'
import { Download, Copy, Check } from 'lucide-react'
import { ToolLayout } from '@/components/tool/ToolLayout'
import { meta } from './meta'

export default function PlaceholderImg() {
  const [width, setWidth] = useState(300)
  const [height, setHeight] = useState(200)
  const [bgColor, setBgColor] = useState('#CCCCCC')
  const [textColor, setTextColor] = useState('#333333')
  const [text, setText] = useState('')
  const [fontSize, setFontSize] = useState(24)
  const [copied, setCopied] = useState(false)

  const displayText = useMemo(() => {
    return text || `${width} × ${height}`
  }, [text, width, height])

  const svgCode = useMemo(() => {
    return `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
  <rect width="100%" height="100%" fill="${bgColor}"/>
  <text x="50%" y="50%" font-family="Arial, sans-serif" font-size="${fontSize}" fill="${textColor}" text-anchor="middle" dominant-baseline="middle">${displayText}</text>
</svg>`
  }, [width, height, bgColor, textColor, displayText, fontSize])

  const dataUrl = useMemo(() => {
    return `data:image/svg+xml,${encodeURIComponent(svgCode)}`
  }, [svgCode])

  const copySvg = async () => {
    await navigator.clipboard.writeText(svgCode)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const downloadSvg = () => {
    const blob = new Blob([svgCode], { type: 'image/svg+xml' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `placeholder-${width}x${height}.svg`
    a.click()
    URL.revokeObjectURL(url)
  }

  const downloadPng = () => {
    const img = new Image()
    img.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = width
      canvas.height = height
      const ctx = canvas.getContext('2d')
      if (ctx) {
        ctx.drawImage(img, 0, 0)
        canvas.toBlob((blob) => {
          if (blob) {
            const url = URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = url
            a.download = `placeholder-${width}x${height}.png`
            a.click()
            URL.revokeObjectURL(url)
          }
        })
      }
    }
    img.src = dataUrl
  }

  const reset = () => {
    setWidth(300)
    setHeight(200)
    setBgColor('#CCCCCC')
    setTextColor('#333333')
    setText('')
    setFontSize(24)
  }

  const presetSizes = [
    { label: '16:9', w: 1920, h: 1080 },
    { label: '4:3', w: 800, h: 600 },
    { label: '1:1', w: 500, h: 500 },
    { label: '头像', w: 200, h: 200 },
    { label: 'Banner', w: 1200, h: 300 },
    { label: '缩略图', w: 150, h: 150 },
  ]

  return (
    <ToolLayout meta={meta} onReset={reset}>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div>
            <label className="tool-label block mb-2">
              预设尺寸
            </label>
            <div className="flex flex-wrap gap-2">
              {presetSizes.map((preset) => (
                <button
                  key={preset.label}
                  onClick={() => {
                    setWidth(preset.w)
                    setHeight(preset.h)
                  }}
                  className="px-3 py-1.5 bg-bg-raised border border-border-base rounded-lg text-xs text-text-secondary hover:bg-bg-overlay transition-colors"
                >
                  {preset.label} ({preset.w}×{preset.h})
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="tool-label block mb-2">
                宽度
              </label>
              <input
                type="number"
                value={width}
                onChange={(e) => setWidth(parseInt(e.target.value) || 1)}
                min="1"
                max="4096"
                className="tool-input w-full"
              />
            </div>
            <div>
              <label className="tool-label block mb-2">
                高度
              </label>
              <input
                type="number"
                value={height}
                onChange={(e) => setHeight(parseInt(e.target.value) || 1)}
                min="1"
                max="4096"
                className="tool-input w-full"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="tool-label block mb-2">
                背景颜色
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={bgColor}
                  onChange={(e) => setBgColor(e.target.value)}
                  className="w-10 h-10 rounded cursor-pointer border border-border-base"
                />
                <input
                  type="text"
                  value={bgColor}
                  onChange={(e) => setBgColor(e.target.value)}
                  className="tool-input flex-1 font-mono"
                />
              </div>
            </div>
            <div>
              <label className="tool-label block mb-2">
                文字颜色
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={textColor}
                  onChange={(e) => setTextColor(e.target.value)}
                  className="w-10 h-10 rounded cursor-pointer border border-border-base"
                />
                <input
                  type="text"
                  value={textColor}
                  onChange={(e) => setTextColor(e.target.value)}
                  className="tool-input flex-1 font-mono"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="tool-label block mb-2">
              显示文字 (留空显示尺寸)
            </label>
            <input
              type="text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder={`${width} × ${height}`}
              className="tool-input w-full"
            />
          </div>

          <div>
            <label className="tool-label block mb-2">
              字体大小: {fontSize}px
            </label>
            <input
              type="range"
              value={fontSize}
              onChange={(e) => setFontSize(parseInt(e.target.value))}
              min="8"
              max="72"
              className="w-full"
            />
          </div>

          <div className="flex gap-2">
            <button onClick={downloadSvg} className="btn-primary flex items-center gap-2">
              <Download className="w-4 h-4" />
              下载 SVG
            </button>
            <button onClick={downloadPng} className="btn-secondary flex items-center gap-2">
              <Download className="w-4 h-4" />
              下载 PNG
            </button>
            <button onClick={copySvg} className="btn-ghost flex items-center gap-2">
              {copied ? (
                <>
                  <Check className="w-4 h-4 text-green-400" />
                  已复制
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  复制 SVG
                </>
              )}
            </button>
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-sm font-medium text-text-primary">预览</h3>
          <div className="bg-bg-raised border border-border-base rounded-lg p-4 flex items-center justify-center min-h-[300px] overflow-auto">
            <img
              src={dataUrl}
              alt="Placeholder"
              style={{ maxWidth: '100%', maxHeight: '300px' }}
            />
          </div>

          <div className="bg-bg-raised border border-border-base rounded-lg p-4">
            <h3 className="tool-label mb-2">
              SVG 代码
            </h3>
            <pre className="text-xs font-mono text-text-primary bg-bg-base p-3 rounded overflow-x-auto whitespace-pre-wrap">
              {svgCode}
            </pre>
          </div>
        </div>
      </div>
    </ToolLayout>
  )
}
