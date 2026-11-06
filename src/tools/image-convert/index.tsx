import { useState, useCallback } from 'react'
import { RefreshCw, Upload, Download, Code2, X } from 'lucide-react'
import { ToolLayout } from '@/components/tool/ToolLayout'
import { useAppStore } from '@/store/app'
import { normalizeSvgSize } from '@/lib/svg-size'
import { meta } from './meta'

type OutputFormat = 'image/jpeg' | 'image/png' | 'image/webp'
type Scale = 1 | 2 | 4

const FORMAT_OPTIONS: { value: OutputFormat; label: string; ext: string; desc: string }[] = [
  { value: 'image/jpeg', label: 'JPEG', ext: 'jpg', desc: '有损压缩，体积小，不支持透明' },
  { value: 'image/png', label: 'PNG', ext: 'png', desc: '无损压缩，支持透明通道' },
  { value: 'image/webp', label: 'WebP', ext: 'webp', desc: '现代格式，优于 JPEG/PNG' },
]

const SCALES: Scale[] = [1, 2, 4]

interface ConvertItem {
  id: string
  name: string
  /** 来源：普通位图文件 / SVG（文件或粘贴代码） */
  source: 'file' | 'svg'
  previewUrl: string
  width: number
  height: number
  originalSize: number
  outputUrl?: string
  outputSize?: number
  outputWidth?: number
  outputHeight?: number
  status: 'pending' | 'processing' | 'done' | 'error'
  error?: string
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error('图片加载失败'))
    img.src = src
  })
}

/** 把 SVG 文本转成可加载的对象地址，尺寸以 viewBox 兜底 */
function svgSource(markup: string): { url: string; width: number; height: number } | null {
  const parsed = normalizeSvgSize(markup)
  if (!parsed) return null
  const blob = new Blob([parsed.markup], { type: 'image/svg+xml' })
  return { url: URL.createObjectURL(blob), width: parsed.width, height: parsed.height }
}

export default function ImageConvert() {
  const [items, setItems] = useState<ConvertItem[]>([])
  const [outputFormat, setOutputFormat] = useState<OutputFormat>('image/webp')
  const [quality, setQuality] = useState(90)
  const [bgColor, setBgColor] = useState('#ffffff')
  const [transparent, setTransparent] = useState(true)
  const [scale, setScale] = useState<Scale>(1)
  const [svgOpen, setSvgOpen] = useState(false)
  const [svgInput, setSvgInput] = useState('')
  const [notice, setNotice] = useState('')
  const [processing, setProcessing] = useState(false)
  const addRecentTool = useAppStore((s) => s.addRecentTool)

  const addFiles = useCallback(async (files: FileList | File[]) => {
    setNotice('')
    const list = Array.from(files).filter(
      (f) => f.type.startsWith('image/') || /\.svg$/i.test(f.name),
    )
    const next: ConvertItem[] = []
    const failed: string[] = []

    for (const file of list) {
      const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
      const isSvg = file.type === 'image/svg+xml' || /\.svg$/i.test(file.name)
      try {
        if (isSvg) {
          const source = svgSource(await file.text())
          if (!source) throw new Error('SVG 缺少可用的 width/height 或 viewBox')
          next.push({
            id,
            name: file.name,
            source: 'svg',
            previewUrl: source.url,
            width: source.width,
            height: source.height,
            originalSize: file.size,
            status: 'pending',
          })
        } else {
          const url = URL.createObjectURL(file)
          const img = await loadImage(url)
          next.push({
            id,
            name: file.name,
            source: 'file',
            previewUrl: url,
            width: img.naturalWidth,
            height: img.naturalHeight,
            originalSize: file.size,
            status: 'pending',
          })
        }
      } catch (err) {
        failed.push(`${file.name}（${err instanceof Error ? err.message : '读取失败'}）`)
      }
    }

    if (next.length) setItems((prev) => [...prev, ...next])
    if (failed.length) setNotice(`跳过 ${failed.length} 个文件：${failed.join('、')}`)
  }, [])

  const addSvgCode = () => {
    const source = svgSource(svgInput)
    if (!source) {
      setNotice('无法解析该 SVG：请确认存在 <svg> 根节点，且带有 width/height 或 viewBox')
      return
    }
    setItems((prev) => [
      ...prev,
      {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        name: `粘贴的 SVG ${prev.filter((i) => i.source === 'svg').length + 1}`,
        source: 'svg',
        previewUrl: source.url,
        width: source.width,
        height: source.height,
        originalSize: new Blob([svgInput]).size,
        status: 'pending',
      },
    ])
    setSvgInput('')
    setNotice('')
  }

  const convertItem = useCallback(
    async (item: ConvertItem) => {
      const img = await loadImage(item.previewUrl)
      const outWidth = Math.max(1, Math.round(item.width * scale))
      const outHeight = Math.max(1, Math.round(item.height * scale))

      const canvas = document.createElement('canvas')
      canvas.width = outWidth
      canvas.height = outHeight
      const ctx = canvas.getContext('2d')
      if (!ctx) throw new Error('当前浏览器不支持 Canvas')

      // JPEG 不支持透明通道；关闭「透明背景」时统一铺底色
      if (outputFormat === 'image/jpeg' || !transparent) {
        ctx.fillStyle = bgColor
        ctx.fillRect(0, 0, outWidth, outHeight)
      }
      ctx.imageSmoothingEnabled = true
      ctx.imageSmoothingQuality = 'high'
      ctx.drawImage(img, 0, 0, outWidth, outHeight)

      const blob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob(resolve, outputFormat, quality / 100),
      )
      if (!blob) throw new Error('导出失败')
      return { url: URL.createObjectURL(blob), size: blob.size, width: outWidth, height: outHeight }
    },
    [outputFormat, quality, transparent, bgColor, scale],
  )

  const convertAll = useCallback(async () => {
    const pending = items.filter((i) => i.status === 'pending' || i.status === 'error')
    if (!pending.length) return
    addRecentTool(meta.id)
    setProcessing(true)

    for (const item of pending) {
      setItems((prev) => prev.map((i) => (i.id === item.id ? { ...i, status: 'processing' } : i)))
      try {
        const output = await convertItem(item)
        setItems((prev) =>
          prev.map((i) =>
            i.id === item.id
              ? {
                  ...i,
                  status: 'done',
                  outputUrl: output.url,
                  outputSize: output.size,
                  outputWidth: output.width,
                  outputHeight: output.height,
                  error: undefined,
                }
              : i,
          ),
        )
      } catch (err) {
        setItems((prev) =>
          prev.map((i) =>
            i.id === item.id
              ? { ...i, status: 'error', error: err instanceof Error ? err.message : '转换失败' }
              : i,
          ),
        )
      }
    }
    setProcessing(false)
  }, [items, convertItem, addRecentTool])

  const downloadItem = (item: ConvertItem) => {
    if (!item.outputUrl) return
    const ext = FORMAT_OPTIONS.find((f) => f.value === outputFormat)?.ext ?? 'png'
    const base = item.name.replace(/\.[^.]+$/, '')
    const a = document.createElement('a')
    a.href = item.outputUrl
    a.download = `${base}.${ext}`
    a.click()
  }

  const removeItem = (id: string) => {
    setItems((prev) => {
      const target = prev.find((i) => i.id === id)
      if (target) {
        URL.revokeObjectURL(target.previewUrl)
        if (target.outputUrl) URL.revokeObjectURL(target.outputUrl)
      }
      return prev.filter((i) => i.id !== id)
    })
  }

  const reset = () => {
    items.forEach((i) => {
      URL.revokeObjectURL(i.previewUrl)
      if (i.outputUrl) URL.revokeObjectURL(i.outputUrl)
    })
    setItems([])
    setNotice('')
    setSvgInput('')
  }

  const scaleDims = (item: ConvertItem) =>
    `${Math.round(item.width * scale)}×${Math.round(item.height * scale)}`

  return (
    <ToolLayout meta={meta} onReset={reset}>
      <div className="flex flex-col gap-4">
        {/* Format selector */}
        <div className="flex gap-2">
          {FORMAT_OPTIONS.map((opt) => (
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
          <div>
            <label className="text-xs text-text-muted mb-1.5 block">输出倍率</label>
            <div className="flex gap-2">
              {SCALES.map((value) => (
                <button
                  key={value}
                  onClick={() => setScale(value)}
                  className={`flex-1 px-2 py-1.5 rounded-lg border text-sm font-mono transition-colors ${
                    scale === value
                      ? 'border-accent bg-accent/10 text-accent'
                      : 'border-border-base text-text-secondary hover:bg-bg-raised'
                  }`}
                >
                  {value}x
                </button>
              ))}
            </div>
          </div>

          {outputFormat !== 'image/png' && (
            <div>
              <label className="text-xs text-text-muted mb-1.5 block">
                质量: <span className="text-text-primary font-mono">{quality}%</span>
              </label>
              <input
                type="range"
                min={10}
                max={100}
                value={quality}
                onChange={(e) => setQuality(Number(e.target.value))}
                className="w-full accent-[var(--color-accent)]"
              />
            </div>
          )}

          <div>
            <label className="text-xs text-text-muted mb-1.5 block">背景</label>
            <div className="flex items-center gap-3">
              <label
                className={`flex items-center gap-1.5 text-sm ${
                  outputFormat === 'image/jpeg' ? 'text-text-muted' : 'text-text-secondary'
                }`}
              >
                <input
                  type="checkbox"
                  checked={outputFormat !== 'image/jpeg' && transparent}
                  disabled={outputFormat === 'image/jpeg'}
                  onChange={(e) => setTransparent(e.target.checked)}
                  className="accent-[var(--color-accent)]"
                />
                透明
              </label>
              <input
                type="color"
                value={bgColor}
                onChange={(e) => setBgColor(e.target.value)}
                disabled={outputFormat !== 'image/jpeg' && transparent}
                className="w-8 h-8 rounded cursor-pointer border border-border-base disabled:opacity-40 disabled:cursor-not-allowed"
                title="不透明时使用的底色"
              />
              <span className="font-mono text-sm text-text-muted">{bgColor}</span>
            </div>
          </div>

          <div className="text-xs text-text-muted self-end leading-relaxed">
            SVG 输出按倍率放大矢量，位图按倍率重采样。
          </div>
        </div>

        {/* SVG 代码输入 */}
        <div className="bg-bg-surface border border-border-base rounded-xl">
          <button
            onClick={() => setSvgOpen((v) => !v)}
            className="w-full flex items-center justify-between px-4 py-3 text-sm text-text-secondary hover:text-text-primary transition-colors"
          >
            <span className="flex items-center gap-2">
              <Code2 className="w-4 h-4" />
              粘贴 SVG 代码导出位图
            </span>
            <span className="text-xs text-text-muted">{svgOpen ? '收起' : '展开'}</span>
          </button>
          {svgOpen && (
            <div className="px-4 pb-4 flex flex-col gap-2">
              <textarea
                value={svgInput}
                onChange={(e) => setSvgInput(e.target.value)}
                placeholder='<svg viewBox="0 0 24 24">…</svg>'
                spellCheck={false}
                className="w-full h-32 p-3 rounded-lg bg-bg-base border border-border-base font-mono text-xs text-text-primary resize-y focus:outline-none focus:border-accent"
              />
              <div className="flex items-center justify-between">
                <span className="text-xs text-text-muted">缺少 width/height 时以 viewBox 尺寸为准</span>
                <button
                  onClick={addSvgCode}
                  disabled={!svgInput.trim()}
                  className="px-3 py-1.5 rounded-lg bg-accent text-bg-base text-sm font-medium hover:bg-accent/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  加入列表
                </button>
              </div>
            </div>
          )}
        </div>

        {notice && (
          <div className="px-3 py-2 rounded-lg border border-amber-500/40 bg-amber-500/10 text-xs text-amber-500">
            {notice}
          </div>
        )}

        {/* Upload zone */}
        <label
          className="border-2 border-dashed border-border-base rounded-xl p-8 text-center hover:border-accent transition-colors cursor-pointer"
          onDrop={(e) => {
            e.preventDefault()
            void addFiles(e.dataTransfer.files)
          }}
          onDragOver={(e) => e.preventDefault()}
        >
          <Upload className="w-8 h-8 text-text-muted mx-auto mb-2" />
          <p className="text-text-secondary text-sm">拖拽图片到此处，或点击添加</p>
          <p className="text-xs text-text-muted mt-1">支持 PNG / JPEG / WebP / GIF / SVG，可批量</p>
          <input
            type="file"
            multiple
            accept="image/*,.svg"
            className="hidden"
            onChange={(e) => {
              if (e.target.files) void addFiles(e.target.files)
              e.target.value = ''
            }}
          />
        </label>

        {/* File list */}
        {items.length > 0 && (
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-text-secondary">{items.length} 个文件</span>
              <button
                onClick={convertAll}
                disabled={processing || items.every((i) => i.status === 'done')}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-accent text-bg-base text-sm font-medium hover:bg-accent/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                {processing ? '转换中...' : '开始转换'}
              </button>
            </div>
            {items.map((item) => (
              <div
                key={item.id}
                className="flex items-center gap-3 p-3 bg-bg-surface border border-border-base rounded-lg"
              >
                <img
                  src={item.previewUrl}
                  alt={item.name}
                  className="w-12 h-12 object-contain rounded border border-border-base bg-bg-base"
                />
                <div className="flex-1 min-w-0">
                  <div className="text-sm text-text-primary truncate">{item.name}</div>
                  <div className="flex items-center gap-2 text-xs text-text-muted mt-0.5 flex-wrap">
                    <span>
                      {item.width}×{item.height}
                    </span>
                    <span>→</span>
                    <span className={item.status === 'done' ? 'text-accent' : ''}>
                      {item.status === 'done' && item.outputWidth
                        ? `${item.outputWidth}×${item.outputHeight}`
                        : scaleDims(item)}
                    </span>
                    <span>{formatBytes(item.originalSize)}</span>
                    {item.status === 'done' && item.outputSize && (
                      <span className="text-green-400">→ {formatBytes(item.outputSize)}</span>
                    )}
                    {item.status === 'processing' && <span className="text-accent">转换中...</span>}
                    {item.status === 'error' && <span className="text-red-400">{item.error}</span>}
                  </div>
                </div>
                {item.status === 'done' && (
                  <button
                    onClick={() => downloadItem(item)}
                    className="p-1.5 rounded-md hover:bg-bg-raised transition-colors"
                    title="下载"
                  >
                    <Download className="w-4 h-4 text-text-muted" />
                  </button>
                )}
                <button
                  onClick={() => removeItem(item.id)}
                  className="p-1.5 rounded-md hover:bg-bg-raised transition-colors"
                  title="移除"
                >
                  <X className="w-4 h-4 text-text-muted" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </ToolLayout>
  )
}
