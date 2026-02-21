import { useState, useCallback } from 'react'
import { RefreshCw, Upload, Download } from 'lucide-react'
import imageCompression from 'browser-image-compression'
import { ToolLayout } from '@/components/tool/ToolLayout'
import { useAppStore } from '@/store/app'
import { meta } from './meta'

type OutputFormat = 'image/jpeg' | 'image/png' | 'image/webp'

const FORMAT_OPTIONS: { value: OutputFormat; label: string; ext: string; desc: string }[] = [
  { value: 'image/jpeg', label: 'JPEG', ext: 'jpg', desc: '有损压缩，体积小，不支持透明' },
  { value: 'image/png', label: 'PNG', ext: 'png', desc: '无损压缩，支持透明通道' },
  { value: 'image/webp', label: 'WebP', ext: 'webp', desc: '现代格式，优于 JPEG/PNG' },
]

interface ConvertItem {
  id: string
  name: string
  file: File
  originalSize: number
  previewUrl: string
  outputUrl?: string
  outputSize?: number
  status: 'pending' | 'processing' | 'done' | 'error'
  error?: string
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / (1024 * 1024)).toFixed(2) + ' MB'
}

export default function ImageConvert() {
  const [items, setItems] = useState<ConvertItem[]>([])
  const [outputFormat, setOutputFormat] = useState<OutputFormat>('image/webp')
  const [quality, setQuality] = useState(90)
  const [bgColor, setBgColor] = useState('#ffffff')
  const [processing, setProcessing] = useState(false)
  const { addRecentTool } = useAppStore()

  const addFiles = useCallback((files: FileList | File[]) => {
    const newItems: ConvertItem[] = Array.from(files)
      .filter(f => f.type.startsWith('image/'))
      .map(f => ({
        id: Math.random().toString(36).slice(2),
        name: f.name,
        file: f,
        originalSize: f.size,
        previewUrl: URL.createObjectURL(f),
        status: 'pending',
      }))
    setItems(prev => [...prev, ...newItems])
  }, [])

  const convertFile = useCallback(async (item: ConvertItem): Promise<void> => {
    return new Promise((resolve) => {
      const img = new Image()
      img.onload = () => {
        const canvas = document.createElement('canvas')
        canvas.width = img.naturalWidth
        canvas.height = img.naturalHeight
        const ctx = canvas.getContext('2d')!

        // Fill background for JPEG (remove transparency)
        if (outputFormat === 'image/jpeg') {
          ctx.fillStyle = bgColor
          ctx.fillRect(0, 0, canvas.width, canvas.height)
        }
        ctx.drawImage(img, 0, 0)

        canvas.toBlob(blob => {
          if (!blob) {
            setItems(prev => prev.map(i => i.id === item.id ? { ...i, status: 'error', error: '转换失败' } : i))
            resolve()
            return
          }
          const url = URL.createObjectURL(blob)
          setItems(prev => prev.map(i => i.id === item.id ? {
            ...i, outputUrl: url, outputSize: blob.size, status: 'done'
          } : i))
          resolve()
        }, outputFormat, quality / 100)
      }
      img.onerror = () => {
        setItems(prev => prev.map(i => i.id === item.id ? { ...i, status: 'error', error: '图片加载失败' } : i))
        resolve()
      }
      img.src = item.previewUrl
    })
  }, [outputFormat, quality, bgColor])

  const convertAll = useCallback(async () => {
    const pending = items.filter(i => i.status === 'pending' || i.status === 'error')
    if (!pending.length) return
    addRecentTool(meta.id)
    setProcessing(true)

    for (const item of pending) {
      setItems(prev => prev.map(i => i.id === item.id ? { ...i, status: 'processing' } : i))
      await convertFile(item)
    }
    setProcessing(false)
  }, [items, convertFile, addRecentTool])

  const downloadItem = (item: ConvertItem) => {
    if (!item.outputUrl) return
    const ext = FORMAT_OPTIONS.find(f => f.value === outputFormat)?.ext ?? 'jpg'
    const base = item.name.replace(/\.[^.]+$/, '')
    const a = document.createElement('a')
    a.href = item.outputUrl
    a.download = `${base}.${ext}`
    a.click()
  }

  const reset = () => {
    items.forEach(i => {
      URL.revokeObjectURL(i.previewUrl)
      if (i.outputUrl) URL.revokeObjectURL(i.outputUrl)
    })
    setItems([])
  }

  return (
    <ToolLayout meta={meta} onReset={reset}>
      <div className="flex flex-col gap-4">

        {/* Format selector */}
        <div className="flex gap-2">
          {FORMAT_OPTIONS.map(opt => (
            <button
              key={opt.value}
              onClick={() => setOutputFormat(opt.value)}
              className={`flex-1 p-3 rounded-xl border text-left text-sm transition-colors ${
                outputFormat === opt.value
                  ? 'border-accent bg-accent/10 text-accent'
                  : 'border-border-base bg-bg-surface text-text-secondary hover:bg-bg-raised'
              }`}
            >
              <div className="font-bold">{opt.label}</div>
              <div className="text-xs opacity-70 mt-0.5">{opt.desc}</div>
            </button>
          ))}
        </div>

        {/* Options */}
        <div className="grid grid-cols-2 gap-4 p-4 bg-bg-surface border border-border-base rounded-xl">
          {outputFormat !== 'image/png' && (
            <div>
              <label className="text-xs text-text-muted mb-1.5 block">质量: <span className="text-text-primary font-mono">{quality}%</span></label>
              <input type="range" min={10} max={100} value={quality} onChange={e => setQuality(+e.target.value)} className="w-full accent-[var(--color-accent)]" />
            </div>
          )}
          {outputFormat === 'image/jpeg' && (
            <div>
              <label className="text-xs text-text-muted mb-1.5 block">透明区域填充色</label>
              <div className="flex items-center gap-2">
                <input type="color" value={bgColor} onChange={e => setBgColor(e.target.value)} className="w-8 h-8 rounded cursor-pointer border border-border-base" />
                <span className="font-mono text-sm text-text-muted">{bgColor}</span>
              </div>
            </div>
          )}
        </div>

        {/* Upload zone */}
        <label
          className="border-2 border-dashed border-border-base rounded-xl p-8 text-center hover:border-accent transition-colors cursor-pointer"
          onDrop={e => { e.preventDefault(); addFiles(e.dataTransfer.files) }}
          onDragOver={e => e.preventDefault()}
        >
          <Upload className="w-8 h-8 text-text-muted mx-auto mb-2" />
          <p className="text-text-secondary text-sm">拖拽图片到此处，或点击添加</p>
          <p className="text-xs text-text-muted mt-1">可批量转换</p>
          <input type="file" multiple accept="image/*" className="hidden" onChange={e => { if (e.target.files) addFiles(e.target.files); e.target.value = '' }} />
        </label>

        {/* File list */}
        {items.length > 0 && (
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-text-secondary">{items.length} 个文件</span>
              <button
                onClick={convertAll}
                disabled={processing || items.every(i => i.status === 'done')}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-accent text-bg-base text-sm font-medium hover:bg-accent/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                {processing ? '转换中...' : '开始转换'}
              </button>
            </div>
            {items.map(item => (
              <div key={item.id} className="flex items-center gap-3 p-3 bg-bg-surface border border-border-base rounded-lg">
                <img src={item.previewUrl} alt={item.name} className="w-12 h-12 object-cover rounded border border-border-base" />
                <div className="flex-1 min-w-0">
                  <div className="text-sm text-text-primary truncate">{item.name}</div>
                  <div className="flex items-center gap-2 text-xs text-text-muted mt-0.5">
                    <span>{item.file.type.split('/')[1]?.toUpperCase() ?? '?'}</span>
                    <span>→</span>
                    <span>{FORMAT_OPTIONS.find(f => f.value === outputFormat)?.label}</span>
                    <span>{formatBytes(item.originalSize)}</span>
                    {item.status === 'done' && item.outputSize && (
                      <span className="text-green-400">→ {formatBytes(item.outputSize)}</span>
                    )}
                    {item.status === 'processing' && <span className="text-accent">转换中...</span>}
                    {item.status === 'error' && <span className="text-red-400">{item.error}</span>}
                  </div>
                </div>
                {item.status === 'done' && (
                  <button onClick={() => downloadItem(item)} className="p-1.5 rounded-md hover:bg-bg-raised transition-colors">
                    <Download className="w-4 h-4 text-text-muted" />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </ToolLayout>
  )
}
