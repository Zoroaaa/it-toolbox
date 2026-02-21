import { useState, useCallback } from 'react'
import { Crop, Upload, Download, Lock, Unlock } from 'lucide-react'
import { ToolLayout } from '@/components/tool/ToolLayout'
import { useAppStore } from '@/store/app'
import { meta } from './meta'

type ResizeMode = 'fit' | 'fill' | 'stretch' | 'crop'

interface ResizeItem {
  name: string
  file: File
  preview: string
  originalWidth: number
  originalHeight: number
  result: { url: string; width: number; height: number } | null
}

function formatBytes(b: number) {
  if (b < 1024) return b + ' B'
  if (b < 1024 * 1024) return (b / 1024).toFixed(1) + ' KB'
  return (b / 1024 / 1024).toFixed(2) + ' MB'
}

async function resizeImage(
  file: File,
  targetW: number,
  targetH: number,
  mode: ResizeMode,
  bgColor: string
): Promise<{ url: string; width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new window.Image()
    img.onload = () => {
      const srcW = img.width, srcH = img.height
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')!

      canvas.width = targetW
      canvas.height = targetH
      ctx.fillStyle = bgColor
      ctx.fillRect(0, 0, targetW, targetH)

      if (mode === 'stretch') {
        ctx.drawImage(img, 0, 0, targetW, targetH)
      } else if (mode === 'fit') {
        const scale = Math.min(targetW / srcW, targetH / srcH)
        const w = srcW * scale, h = srcH * scale
        const x = (targetW - w) / 2, y = (targetH - h) / 2
        ctx.drawImage(img, x, y, w, h)
      } else if (mode === 'fill') {
        const scale = Math.max(targetW / srcW, targetH / srcH)
        const w = srcW * scale, h = srcH * scale
        const x = (targetW - w) / 2, y = (targetH - h) / 2
        ctx.drawImage(img, x, y, w, h)
      } else if (mode === 'crop') {
        const scale = Math.max(targetW / srcW, targetH / srcH)
        const w = srcW * scale, h = srcH * scale
        const sx = (w - targetW) / 2 / scale
        const sy = (h - targetH) / 2 / scale
        const sw = targetW / scale
        const sh = targetH / scale
        ctx.drawImage(img, sx, sy, sw, sh, 0, 0, targetW, targetH)
      }

      canvas.toBlob((blob) => {
        if (!blob) { reject(new Error('失败')); return }
        resolve({ url: URL.createObjectURL(blob), width: targetW, height: targetH })
      }, 'image/png')
    }
    img.onerror = () => reject(new Error('加载失败'))
    img.src = URL.createObjectURL(file)
  })
}

const PRESETS = [
  { label: '1:1 (正方形)', w: 800, h: 800 },
  { label: '16:9', w: 1920, h: 1080 },
  { label: '4:3', w: 1280, h: 960 },
  { label: '1200×630 (OG)', w: 1200, h: 630 },
  { label: '512×512', w: 512, h: 512 },
  { label: '256×256', w: 256, h: 256 },
]

export default function ImageResize() {
  const [items, setItems] = useState<ResizeItem[]>([])
  const [width, setWidth] = useState(800)
  const [height, setHeight] = useState(600)
  const [mode, setMode] = useState<ResizeMode>('fit')
  const [lockAspect, setLockAspect] = useState(false)
  const [bgColor, setBgColor] = useState('#ffffff')
  const [processing, setProcessing] = useState(false)
  const [aspectRatio, setAspectRatio] = useState(4 / 3)
  const { addRecentTool } = useAppStore()

  const handleFiles = useCallback((files: FileList | File[]) => {
    addRecentTool(meta.id)
    const newItems: ResizeItem[] = []
    Array.from(files).filter(f => f.type.startsWith('image/')).forEach(f => {
      const img = new window.Image()
      const url = URL.createObjectURL(f)
      img.onload = () => {
        setItems(prev => [...prev, {
          name: f.name, file: f, preview: url,
          originalWidth: img.width, originalHeight: img.height, result: null,
        }])
      }
      img.src = url
    })
  }, [addRecentTool])

  const resizeAll = useCallback(async () => {
    setProcessing(true)
    const updated = await Promise.all(
      items.map(async item => {
        try {
          const result = await resizeImage(item.file, width, height, mode, bgColor)
          return { ...item, result }
        } catch {
          return item
        }
      })
    )
    setItems(updated)
    setProcessing(false)
  }, [items, width, height, mode, bgColor])

  const downloadAll = () => {
    items.forEach(item => {
      if (!item.result) return
      const base = item.name.replace(/\.[^.]+$/, '')
      const a = document.createElement('a')
      a.href = item.result.url
      a.download = `${base}_${width}x${height}.png`
      a.click()
    })
  }

  const handleWidthChange = (v: number) => {
    setWidth(v)
    if (lockAspect) setHeight(Math.round(v / aspectRatio))
  }

  const handleHeightChange = (v: number) => {
    setHeight(v)
    if (lockAspect) setWidth(Math.round(v * aspectRatio))
  }

  const toggleLock = () => {
    if (!lockAspect) setAspectRatio(width / height)
    setLockAspect(!lockAspect)
  }

  const MODE_OPTIONS: { value: ResizeMode; label: string; desc: string }[] = [
    { value: 'fit', label: '适应', desc: '保持比例，留白填充' },
    { value: 'fill', label: '填充', desc: '保持比例，溢出裁剪' },
    { value: 'crop', label: '居中裁剪', desc: '居中裁剪至目标尺寸' },
    { value: 'stretch', label: '拉伸', desc: '强制拉伸填满' },
  ]

  const reset = () => setItems([])

  return (
    <ToolLayout meta={meta} onReset={reset}>
      <div className="flex flex-col gap-4">
        {/* Controls */}
        <div className="p-4 bg-bg-surface border border-border-base rounded-xl">
          <div className="grid grid-cols-2 gap-6">
            {/* Size inputs */}
            <div className="space-y-3">
              <label className="text-xs font-medium text-text-muted uppercase tracking-wider block">目标尺寸</label>
              <div className="flex items-center gap-2">
                <div className="flex-1">
                  <label className="text-xs text-text-muted mb-1 block">宽度 (px)</label>
                  <input
                    type="number"
                    value={width}
                    onChange={e => handleWidthChange(parseInt(e.target.value) || 1)}
                    min={1}
                    className="w-full px-3 py-2 rounded-lg bg-bg-raised border border-border-base text-sm font-mono text-text-primary focus:outline-none focus:border-accent"
                  />
                </div>
                <button
                  onClick={toggleLock}
                  className={`mt-4 p-2 rounded-lg transition-colors ${lockAspect ? 'text-accent bg-accent/10' : 'text-text-muted hover:text-text-primary hover:bg-bg-raised'}`}
                >
                  {lockAspect ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
                </button>
                <div className="flex-1">
                  <label className="text-xs text-text-muted mb-1 block">高度 (px)</label>
                  <input
                    type="number"
                    value={height}
                    onChange={e => handleHeightChange(parseInt(e.target.value) || 1)}
                    min={1}
                    className="w-full px-3 py-2 rounded-lg bg-bg-raised border border-border-base text-sm font-mono text-text-primary focus:outline-none focus:border-accent"
                  />
                </div>
              </div>
              {/* Presets */}
              <div className="flex flex-wrap gap-1">
                {PRESETS.map(p => (
                  <button
                    key={p.label}
                    onClick={() => { setWidth(p.w); setHeight(p.h); setLockAspect(false) }}
                    className="px-2 py-1 rounded text-xs bg-bg-raised text-text-muted hover:text-text-primary transition-colors"
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Mode */}
            <div className="space-y-2">
              <label className="text-xs font-medium text-text-muted uppercase tracking-wider block">调整模式</label>
              {MODE_OPTIONS.map(m => (
                <button
                  key={m.value}
                  onClick={() => setMode(m.value)}
                  className={`w-full flex items-center gap-3 p-2.5 rounded-lg text-left transition-colors ${
                    mode === m.value
                      ? 'bg-accent/10 border border-accent/30'
                      : 'hover:bg-bg-raised border border-transparent'
                  }`}
                >
                  <span className={`text-sm font-medium w-16 ${mode === m.value ? 'text-accent' : 'text-text-primary'}`}>{m.label}</span>
                  <span className="text-xs text-text-muted">{m.desc}</span>
                </button>
              ))}
              {mode === 'fit' && (
                <div className="flex items-center gap-2 pt-2">
                  <label className="text-xs text-text-muted">背景色：</label>
                  <input type="color" value={bgColor} onChange={e => setBgColor(e.target.value)} className="w-8 h-8 rounded" />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Upload */}
        <label
          className="flex flex-col items-center justify-center gap-3 p-6 border-2 border-dashed border-border-base rounded-xl cursor-pointer hover:border-accent/50 transition-colors"
          onDrop={e => { e.preventDefault(); handleFiles(e.dataTransfer.files) }}
          onDragOver={e => e.preventDefault()}
        >
          <Upload className="w-8 h-8 text-text-muted" />
          <p className="text-sm text-text-secondary">拖放或点击上传图片（支持批量）</p>
          <input type="file" accept="image/*" multiple className="hidden" onChange={e => e.target.files && handleFiles(e.target.files)} />
        </label>

        {items.length > 0 && (
          <>
            <div className="flex gap-2">
              <button
                onClick={resizeAll}
                disabled={processing}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-accent text-bg-base text-sm font-medium hover:bg-accent/90 transition-colors disabled:opacity-50"
              >
                <Crop className={`w-4 h-4 ${processing ? 'animate-spin' : ''}`} />
                {processing ? '处理中...' : `调整为 ${width}×${height}`}
              </button>
              {items.some(i => i.result) && (
                <button onClick={downloadAll} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-bg-raised text-text-secondary text-sm hover:text-text-primary transition-colors">
                  <Download className="w-4 h-4" />
                  下载全部
                </button>
              )}
            </div>

            <div className="space-y-3">
              {items.map((item, i) => (
                <div key={i} className="flex items-center gap-3 p-3 bg-bg-surface border border-border-base rounded-xl">
                  <img src={item.preview} alt={item.name} className="w-14 h-14 object-cover rounded-lg flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-text-primary truncate">{item.name}</p>
                    <div className="flex items-center gap-2 text-xs text-text-muted mt-1">
                      <span>{item.originalWidth}×{item.originalHeight}px</span>
                      {item.result && (
                        <>
                          <span>→</span>
                          <span className="text-accent">{item.result.width}×{item.result.height}px</span>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {item.result && (
                      <img src={item.result.url} alt="result" className="w-14 h-14 object-cover rounded-lg border border-border-base" />
                    )}
                    {item.result && (
                      <button
                        onClick={() => {
                          const base = item.name.replace(/\.[^.]+$/, '')
                          const a = document.createElement('a')
                          a.href = item.result!.url
                          a.download = `${base}_${width}x${height}.png`
                          a.click()
                        }}
                        className="p-1.5 rounded-md hover:bg-bg-raised text-text-muted"
                      >
                        <Download className="w-4 h-4" />
                      </button>
                    )}
                    <button onClick={() => setItems(p => p.filter((_, j) => j !== i))} className="p-1.5 rounded-md hover:bg-red-500/10 text-text-muted hover:text-red-400">×</button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </ToolLayout>
  )
}
