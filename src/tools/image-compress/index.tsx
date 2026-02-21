import { useState, useCallback } from 'react'
import { Minimize, Upload, Download } from 'lucide-react'
import imageCompression from 'browser-image-compression'
import { ToolLayout } from '@/components/tool/ToolLayout'
import { useAppStore } from '@/store/app'
import { meta } from './meta'

interface ImageItem {
  id: string
  name: string
  original: File
  originalSize: number
  compressed?: Blob
  compressedSize?: number
  previewUrl: string
  compressedUrl?: string
  status: 'pending' | 'processing' | 'done' | 'error'
  error?: string
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / (1024 * 1024)).toFixed(2) + ' MB'
}

export default function ImageCompress() {
  const [items, setItems] = useState<ImageItem[]>([])
  const [quality, setQuality] = useState(80)
  const [maxSizeMB, setMaxSizeMB] = useState(1)
  const [processing, setProcessing] = useState(false)
  const { addRecentTool } = useAppStore()

  const addFiles = useCallback((files: FileList | File[]) => {
    const newItems: ImageItem[] = Array.from(files)
      .filter(f => f.type.startsWith('image/'))
      .map(f => ({
        id: Math.random().toString(36).slice(2),
        name: f.name,
        original: f,
        originalSize: f.size,
        previewUrl: URL.createObjectURL(f),
        status: 'pending',
      }))
    setItems(prev => [...prev, ...newItems])
  }, [])

  const compressAll = useCallback(async () => {
    const pending = items.filter(i => i.status === 'pending' || i.status === 'error')
    if (!pending.length) return
    addRecentTool(meta.id)
    setProcessing(true)

    for (const item of pending) {
      setItems(prev => prev.map(i => i.id === item.id ? { ...i, status: 'processing' } : i))
      try {
        const compressed = await imageCompression(item.original, {
          maxSizeMB,
          initialQuality: quality / 100,
          useWebWorker: true,
          preserveExif: false,
        })
        const url = URL.createObjectURL(compressed)
        setItems(prev => prev.map(i => i.id === item.id ? {
          ...i,
          compressed,
          compressedSize: compressed.size,
          compressedUrl: url,
          status: 'done',
        } : i))
      } catch (e) {
        setItems(prev => prev.map(i => i.id === item.id ? {
          ...i,
          status: 'error',
          error: e instanceof Error ? e.message : '压缩失败',
        } : i))
      }
    }
    setProcessing(false)
  }, [items, quality, maxSizeMB, addRecentTool])

  const downloadItem = (item: ImageItem) => {
    if (!item.compressedUrl) return
    const a = document.createElement('a')
    a.href = item.compressedUrl
    a.download = `compressed_${item.name}`
    a.click()
  }

  const downloadAll = () => {
    items.filter(i => i.status === 'done').forEach(downloadItem)
  }

  const reset = () => {
    items.forEach(i => {
      URL.revokeObjectURL(i.previewUrl)
      if (i.compressedUrl) URL.revokeObjectURL(i.compressedUrl)
    })
    setItems([])
  }

  const totalOriginal = items.reduce((s, i) => s + i.originalSize, 0)
  const totalCompressed = items.filter(i => i.status === 'done').reduce((s, i) => s + (i.compressedSize ?? 0), 0)
  const doneCount = items.filter(i => i.status === 'done').length

  return (
    <ToolLayout meta={meta} onReset={reset}>
      <div className="flex flex-col gap-4">

        {/* Controls */}
        <div className="grid grid-cols-2 gap-4 p-4 bg-bg-surface border border-border-base rounded-xl">
          <div>
            <label className="text-xs text-text-muted mb-1.5 block">压缩质量: <span className="text-text-primary font-mono">{quality}%</span></label>
            <input
              type="range" min={10} max={100} value={quality}
              onChange={e => setQuality(+e.target.value)}
              className="w-full accent-[var(--color-accent)]"
            />
          </div>
          <div>
            <label className="text-xs text-text-muted mb-1.5 block">目标最大体积: <span className="text-text-primary font-mono">{maxSizeMB} MB</span></label>
            <input
              type="range" min={0.1} max={10} step={0.1} value={maxSizeMB}
              onChange={e => setMaxSizeMB(+e.target.value)}
              className="w-full accent-[var(--color-accent)]"
            />
          </div>
        </div>

        {/* Summary stats */}
        {doneCount > 0 && (
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-bg-surface border border-border-base rounded-lg p-3 text-center">
              <div className="text-lg font-bold font-mono text-text-primary">{formatBytes(totalOriginal)}</div>
              <div className="text-xs text-text-muted">原始总大小</div>
            </div>
            <div className="bg-bg-surface border border-border-base rounded-lg p-3 text-center">
              <div className="text-lg font-bold font-mono text-text-primary">{formatBytes(totalCompressed)}</div>
              <div className="text-xs text-text-muted">压缩后总大小</div>
            </div>
            <div className="bg-bg-surface border border-border-base rounded-lg p-3 text-center">
              <div className="text-lg font-bold font-mono text-accent">
                {totalOriginal > 0 ? (((totalOriginal - totalCompressed) / totalOriginal) * 100).toFixed(1) : 0}%
              </div>
              <div className="text-xs text-text-muted">总节省空间</div>
            </div>
          </div>
        )}

        {/* Upload zone */}
        <label
          className="border-2 border-dashed border-border-base rounded-xl p-8 text-center hover:border-accent transition-colors cursor-pointer"
          onDrop={e => { e.preventDefault(); addFiles(e.dataTransfer.files) }}
          onDragOver={e => e.preventDefault()}
        >
          <Upload className="w-8 h-8 text-text-muted mx-auto mb-2" />
          <p className="text-text-secondary text-sm">拖拽图片到此处，或点击添加</p>
          <p className="text-xs text-text-muted mt-1">支持 JPEG、PNG、WebP、GIF 等格式，可批量添加</p>
          <input type="file" multiple accept="image/*" className="hidden" onChange={e => { if (e.target.files) addFiles(e.target.files); e.target.value = '' }} />
        </label>

        {/* File list */}
        {items.length > 0 && (
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-text-secondary">{items.length} 个文件</span>
              <div className="flex gap-2">
                {doneCount > 0 && (
                  <button onClick={downloadAll} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-bg-raised hover:bg-bg-surface text-sm text-text-secondary transition-colors">
                    <Download className="w-3.5 h-3.5" />全部下载
                  </button>
                )}
                <button
                  onClick={compressAll}
                  disabled={processing || items.every(i => i.status === 'done')}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-accent text-bg-base text-sm font-medium hover:bg-accent/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Minimize className="w-3.5 h-3.5" />
                  {processing ? '压缩中...' : '开始压缩'}
                </button>
              </div>
            </div>

            {items.map(item => (
              <div key={item.id} className="flex items-center gap-3 p-3 bg-bg-surface border border-border-base rounded-lg">
                <img src={item.previewUrl} alt={item.name} className="w-12 h-12 object-cover rounded border border-border-base" />
                <div className="flex-1 min-w-0">
                  <div className="text-sm text-text-primary truncate">{item.name}</div>
                  <div className="flex items-center gap-2 text-xs text-text-muted mt-0.5">
                    <span>{formatBytes(item.originalSize)}</span>
                    {item.status === 'done' && item.compressedSize !== undefined && (
                      <>
                        <span>→</span>
                        <span className="text-green-400">{formatBytes(item.compressedSize)}</span>
                        <span className="text-accent">
                          (-{(((item.originalSize - item.compressedSize) / item.originalSize) * 100).toFixed(1)}%)
                        </span>
                      </>
                    )}
                    {item.status === 'processing' && <span className="text-accent">压缩中...</span>}
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
