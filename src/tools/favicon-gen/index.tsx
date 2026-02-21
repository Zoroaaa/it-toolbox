import { useState, useCallback } from 'react'
import { Globe, Upload, Download, Package } from 'lucide-react'
import JSZip from 'jszip'
import { ToolLayout } from '@/components/tool/ToolLayout'
import { useAppStore } from '@/store/app'
import { meta } from './meta'

const ALL_SIZES = [
  { size: 16,  label: 'favicon-16x16.png',    desc: '浏览器标签' },
  { size: 32,  label: 'favicon-32x32.png',    desc: '浏览器标签（高分辨率）' },
  { size: 48,  label: 'favicon-48x48.png',    desc: 'Windows Site' },
  { size: 64,  label: 'favicon-64x64.png',    desc: '书签栏' },
  { size: 96,  label: 'favicon-96x96.png',    desc: 'Google TV' },
  { size: 128, label: 'favicon-128x128.png',  desc: 'Chrome Web Store' },
  { size: 180, label: 'apple-touch-icon.png', desc: 'iOS Safari' },
  { size: 192, label: 'android-chrome-192x192.png', desc: 'Android Chrome' },
  { size: 512, label: 'android-chrome-512x512.png', desc: 'PWA 启动图标' },
]

const WEB_MANIFEST_TEMPLATE = (name: string) => JSON.stringify({
  name,
  short_name: name,
  icons: [
    { src: '/android-chrome-192x192.png', sizes: '192x192', type: 'image/png' },
    { src: '/android-chrome-512x512.png', sizes: '512x512', type: 'image/png' },
  ],
  theme_color: '#ffffff',
  background_color: '#ffffff',
  display: 'standalone',
}, null, 2)

const HTML_SNIPPET = `<link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png">
<link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png">
<link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png">
<link rel="manifest" href="/site.webmanifest">`

interface GeneratedFavicon { size: number; label: string; desc: string; dataUrl: string }

async function renderSize(img: HTMLImageElement, size: number): Promise<string> {
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')!
  ctx.imageSmoothingEnabled = true
  ctx.imageSmoothingQuality = 'high'
  ctx.clearRect(0, 0, size, size)
  ctx.drawImage(img, 0, 0, size, size)
  return canvas.toDataURL('image/png')
}

async function dataUrlToUint8Array(dataUrl: string): Promise<Uint8Array> {
  const res = await fetch(dataUrl)
  const buf = await res.arrayBuffer()
  return new Uint8Array(buf)
}

export default function FaviconGenerator() {
  const [sourceImage, setSourceImage] = useState<string | null>(null)
  const [favicons, setFavicons] = useState<GeneratedFavicon[]>([])
  const [generating, setGenerating] = useState(false)
  const [selectedSizes, setSelectedSizes] = useState<number[]>([16, 32, 48, 180, 192, 512])
  const [siteName, setSiteName] = useState('My App')
  const { addRecentTool } = useAppStore()

  const loadImage = useCallback((src: string): Promise<HTMLImageElement> => {
    return new Promise((resolve, reject) => {
      const img = new window.Image()
      img.onload = () => resolve(img)
      img.onerror = reject
      img.src = src
    })
  }, [])

  const handleFile = useCallback((file: File) => {
    if (!file.type.startsWith('image/')) return
    const reader = new FileReader()
    reader.onload = ev => { setSourceImage(ev.target?.result as string); setFavicons([]) }
    reader.readAsDataURL(file)
  }, [])

  const toggleSize = (size: number) => {
    setSelectedSizes(prev =>
      prev.includes(size) ? prev.filter(s => s !== size) : [...prev, size]
    )
  }

  const generateFavicons = useCallback(async () => {
    if (!sourceImage || selectedSizes.length === 0) return
    addRecentTool(meta.id)
    setGenerating(true)
    try {
      const img = await loadImage(sourceImage)
      const results: GeneratedFavicon[] = []
      for (const entry of ALL_SIZES.filter(e => selectedSizes.includes(e.size))) {
        const dataUrl = await renderSize(img, entry.size)
        results.push({ ...entry, dataUrl })
      }
      setFavicons(results)
    } finally {
      setGenerating(false)
    }
  }, [sourceImage, selectedSizes, loadImage, addRecentTool])

  const downloadSingle = (fav: GeneratedFavicon) => {
    const a = document.createElement('a')
    a.href = fav.dataUrl
    a.download = fav.label
    a.click()
  }

  const downloadZip = useCallback(async () => {
    if (favicons.length === 0) return
    const zip = new JSZip()
    const folder = zip.folder('favicon')!

    for (const fav of favicons) {
      const bytes = await dataUrlToUint8Array(fav.dataUrl)
      folder.file(fav.label, bytes)
    }
    // Add web manifest
    folder.file('site.webmanifest', WEB_MANIFEST_TEMPLATE(siteName))
    // Add HTML snippet as README
    folder.file('html-snippet.txt', HTML_SNIPPET)

    const blob = await zip.generateAsync({ type: 'blob', compression: 'DEFLATE' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'favicon-pack.zip'
    a.click()
    URL.revokeObjectURL(url)
  }, [favicons, siteName])

  const reset = () => { setSourceImage(null); setFavicons([]) }

  return (
    <ToolLayout meta={meta} onReset={reset}>
      <div className="flex flex-col gap-4">

        {/* Upload */}
        {!sourceImage ? (
          <label
            className="border-2 border-dashed border-border-base rounded-xl p-12 text-center hover:border-accent transition-colors cursor-pointer"
            onDrop={e => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) handleFile(f) }}
            onDragOver={e => e.preventDefault()}
          >
            <Globe className="w-10 h-10 text-text-muted mx-auto mb-3" />
            <p className="text-text-secondary mb-2">上传图片生成全套 Favicon</p>
            <p className="text-xs text-text-muted mb-4">推荐使用 512×512 或更大的正方形 SVG/PNG 图片</p>
            <span className="px-4 py-2 rounded-lg bg-accent text-bg-base text-sm font-medium">
              <Upload className="w-4 h-4 inline mr-2" />选择图片
            </span>
            <input type="file" accept="image/*" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = '' }} />
          </label>
        ) : (
          <div className="flex gap-4">
            {/* Preview + controls */}
            <div className="flex flex-col gap-3 w-48 shrink-0">
              <img src={sourceImage} alt="source" className="w-full rounded-lg border border-border-base object-contain max-h-48" />
              <input
                value={siteName}
                onChange={e => setSiteName(e.target.value)}
                placeholder="站点名称（用于 manifest）"
                className="px-3 py-1.5 rounded-lg bg-bg-surface border border-border-base text-sm text-text-primary focus:outline-none focus:border-accent"
              />
              <label className="px-3 py-1.5 rounded-lg bg-bg-raised text-text-secondary text-xs text-center cursor-pointer hover:bg-bg-surface transition-colors">
                更换图片
                <input type="file" accept="image/*" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = '' }} />
              </label>
            </div>

            {/* Size selector */}
            <div className="flex-1">
              <p className="text-xs text-text-muted mb-2">选择要生成的尺寸</p>
              <div className="grid grid-cols-3 gap-2 mb-3">
                {ALL_SIZES.map(entry => (
                  <button
                    key={entry.size}
                    onClick={() => toggleSize(entry.size)}
                    className={`p-2 rounded-lg border text-left text-xs transition-colors ${
                      selectedSizes.includes(entry.size)
                        ? 'border-accent bg-accent/10 text-accent'
                        : 'border-border-base bg-bg-surface text-text-muted hover:bg-bg-raised'
                    }`}
                  >
                    <div className="font-mono font-medium">{entry.size}×{entry.size}</div>
                    <div className="opacity-70 truncate mt-0.5">{entry.desc}</div>
                  </button>
                ))}
              </div>
              <button
                onClick={generateFavicons}
                disabled={selectedSizes.length === 0 || generating}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-accent text-bg-base text-sm font-medium hover:bg-accent/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Globe className="w-4 h-4" />
                {generating ? '生成中...' : `生成 ${selectedSizes.length} 个尺寸`}
              </button>
            </div>
          </div>
        )}

        {/* Results */}
        {favicons.length > 0 && (
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-text-primary">生成结果 ({favicons.length} 个文件)</h3>
              <button
                onClick={downloadZip}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-accent text-bg-base text-sm font-medium hover:bg-accent/90 transition-colors"
              >
                <Package className="w-3.5 h-3.5" />ZIP 打包下载
              </button>
            </div>

            {/* HTML snippet */}
            <div className="bg-bg-surface border border-border-base rounded-lg p-3">
              <p className="text-xs text-text-muted mb-2">HTML 代码片段（添加到 &lt;head&gt;）</p>
              <pre className="text-xs font-mono text-text-primary overflow-x-auto">{HTML_SNIPPET}</pre>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {favicons.map(fav => (
                <div key={fav.size} className="flex items-center gap-3 p-3 bg-bg-surface border border-border-base rounded-lg">
                  <img
                    src={fav.dataUrl}
                    alt={fav.label}
                    style={{ width: Math.min(fav.size, 40), height: Math.min(fav.size, 40) }}
                    className="shrink-0 rounded border border-border-base"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-mono text-text-primary truncate">{fav.label}</p>
                    <p className="text-xs text-text-muted">{fav.desc}</p>
                  </div>
                  <button onClick={() => downloadSingle(fav)} className="p-1.5 rounded-md hover:bg-bg-raised transition-colors shrink-0">
                    <Download className="w-4 h-4 text-text-muted" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </ToolLayout>
  )
}
