import { useCallback, useEffect, useRef, useState } from 'react'
import { Download, Image as ImageIcon, Upload } from 'lucide-react'
import { ToolLayout } from '@/components/tool/ToolLayout'
import { useAppStore } from '@/store/app'
import { useImageDiff } from './useImageDiff'
import { meta } from './meta'

interface Slot {
  blob: Blob
  url: string
  name: string
  size: number
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
}

function useSlot() {
  const [slot, setSlot] = useState<Slot | null>(null)
  const urlRef = useRef('')

  const set = useCallback((file: File) => {
    if (urlRef.current) URL.revokeObjectURL(urlRef.current)
    const url = URL.createObjectURL(file)
    urlRef.current = url
    setSlot({ blob: file, url, name: file.name, size: file.size })
  }, [])

  const clear = useCallback(() => {
    if (urlRef.current) URL.revokeObjectURL(urlRef.current)
    urlRef.current = ''
    setSlot(null)
  }, [])

  useEffect(() => {
    return () => {
      if (urlRef.current) URL.revokeObjectURL(urlRef.current)
    }
  }, [])

  return { slot, set, clear }
}

function DropSlot({
  label,
  slot,
  onPick,
  onClear,
}: {
  label: string
  slot: Slot | null
  onPick: (file: File) => void
  onClear: () => void
}) {
  return (
    <div className="flex-1 min-w-0">
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-xs text-text-muted">{label}</span>
        {slot && (
          <button onClick={onClear} className="text-xs text-text-muted hover:text-accent">
            清除
          </button>
        )}
      </div>
      <label
        className="flex items-center gap-3 p-3 rounded-xl border border-dashed border-border-base bg-bg-surface hover:border-accent transition-colors cursor-pointer"
        onDrop={(e) => {
          e.preventDefault()
          const file = e.dataTransfer.files[0]
          if (file?.type.startsWith('image/')) onPick(file)
        }}
        onDragOver={(e) => e.preventDefault()}
      >
        {slot ? (
          <img
            src={slot.url}
            alt={slot.name}
            className="w-12 h-12 rounded-lg object-contain bg-bg-base border border-border-base"
          />
        ) : (
          <div className="w-12 h-12 rounded-lg bg-bg-base border border-border-base flex items-center justify-center">
            <ImageIcon className="w-5 h-5 text-text-muted" />
          </div>
        )}
        <div className="min-w-0 flex-1">
          <div className="text-sm text-text-primary truncate">{slot ? slot.name : '选择或拖入图片'}</div>
          <div className="text-xs text-text-muted">
            {slot ? formatBytes(slot.size) : 'PNG / JPEG / WebP / GIF'}
          </div>
        </div>
        <Upload className="w-4 h-4 text-text-muted flex-shrink-0" />
        <input
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0]
            if (file) onPick(file)
            e.target.value = ''
          }}
        />
      </label>
    </div>
  )
}

export default function ImageDiff() {
  const left = useSlot()
  const right = useSlot()
  const [threshold, setThreshold] = useState(0)
  const [position, setPosition] = useState(50)
  const [showDiff, setShowDiff] = useState(true)
  const addRecentTool = useAppStore((s) => s.addRecentTool)

  const { running, error, data, diffUrl } = useImageDiff(
    left.slot?.blob ?? null,
    right.slot?.blob ?? null,
    threshold,
  )

  const pick = (side: 'a' | 'b') => (file: File) => {
    addRecentTool(meta.id)
    if (side === 'a') left.set(file)
    else right.set(file)
  }

  const reset = () => {
    left.clear()
    right.clear()
    setThreshold(0)
    setPosition(50)
    setShowDiff(true)
  }

  const bothReady = Boolean(left.slot && right.slot)
  const ratioPercent = data ? (data.ratio * 100).toFixed(data.ratio > 0 && data.ratio < 0.0001 ? 4 : 2) : '—'

  return (
    <ToolLayout meta={meta} onReset={reset}>
      <div className="flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <DropSlot label="原图 A" slot={left.slot} onPick={pick('a')} onClear={left.clear} />
          <DropSlot label="对比图 B" slot={right.slot} onPick={pick('b')} onClear={right.clear} />
        </div>

        {!bothReady && (
          <p className="text-xs text-text-muted">两张图都选好后自动比对；不同尺寸以较大画布为基准、左上对齐。</p>
        )}

        {error && <p className="text-xs text-red-400">{error}</p>}

        {bothReady && data && (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <div className="p-3 rounded-xl bg-bg-surface border border-border-base">
                <div className="text-xs text-text-muted">差异比例</div>
                <div className={`text-lg font-semibold ${data.diffPixels ? 'text-red-400' : 'text-accent'}`}>
                  {ratioPercent}%
                </div>
              </div>
              <div className="p-3 rounded-xl bg-bg-surface border border-border-base">
                <div className="text-xs text-text-muted">差异像素</div>
                <div className="text-lg font-semibold text-text-primary">
                  {data.diffPixels.toLocaleString()}
                </div>
              </div>
              <div className="p-3 rounded-xl bg-bg-surface border border-border-base">
                <div className="text-xs text-text-muted">比对画布</div>
                <div className="text-lg font-semibold text-text-primary">
                  {data.width}×{data.height}
                </div>
              </div>
              <div className="p-3 rounded-xl bg-bg-surface border border-border-base">
                <div className="text-xs text-text-muted">A / B 尺寸</div>
                <div className="text-sm font-mono text-text-primary">
                  {data.widthA}×{data.heightA}
                  <span className="text-text-muted"> / </span>
                  {data.widthB}×{data.heightB}
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-2 p-4 bg-bg-surface border border-border-base rounded-xl">
              <label className="text-xs text-text-muted">
                叠加位置: <span className="font-mono text-text-primary">{position}%</span>
              </label>
              <input
                type="range"
                min={0}
                max={100}
                value={position}
                onChange={(e) => setPosition(Number(e.target.value))}
                className="w-full accent-[var(--color-accent)]"
                aria-label="叠加位置"
              />

              <label className="text-xs text-text-muted mt-1">
                噪点阈值: <span className="font-mono text-text-primary">{threshold}</span>
                <span className="ml-2 opacity-70">有损格式建议 8~16</span>
              </label>
              <input
                type="range"
                min={0}
                max={64}
                value={threshold}
                onChange={(e) => setThreshold(Number(e.target.value))}
                className="w-full accent-[var(--color-accent)]"
                aria-label="噪点阈值"
              />

              <div className="flex items-center justify-between mt-1">
                <label className="flex items-center gap-2 text-sm text-text-secondary">
                  <input
                    type="checkbox"
                    checked={showDiff}
                    onChange={(e) => setShowDiff(e.target.checked)}
                    className="accent-[var(--color-accent)]"
                  />
                  显示差异高亮
                </label>
                {diffUrl && (
                  <a
                    href={diffUrl}
                    download="diff.png"
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border-base text-sm text-text-secondary hover:text-accent hover:border-accent transition-colors"
                  >
                    <Download className="w-3.5 h-3.5" />
                    下载差异图
                  </a>
                )}
              </div>
            </div>

            <div
              className="relative w-full rounded-xl border border-border-base bg-bg-base overflow-hidden"
              style={{ aspectRatio: `${data.width} / ${data.height}` }}
            >
              <img
                src={left.slot!.url}
                alt="原图 A"
                className={`absolute inset-0 w-full h-full object-contain ${showDiff && diffUrl ? 'opacity-40' : ''}`}
              />
              <img
                src={right.slot!.url}
                alt="对比图 B"
                className="absolute inset-0 w-full h-full object-contain"
                style={{ clipPath: `inset(0 ${100 - position}% 0 0)` }}
              />
              {showDiff && diffUrl && (
                <img
                  src={diffUrl}
                  alt="差异高亮"
                  className="absolute inset-0 w-full h-full object-contain"
                />
              )}
              <div
                className="absolute top-0 bottom-0 w-px bg-accent/80 pointer-events-none"
                style={{ left: `${position}%` }}
              />
              {running && (
                <div className="absolute inset-0 bg-bg-base/60 flex items-center justify-center text-sm text-text-secondary">
                  比对中...
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </ToolLayout>
  )
}
