import { useState, useCallback } from 'react'
import { Camera, Upload, Copy, Check, MapPin, Shield, Download } from 'lucide-react'
import * as exifr from 'exifr'
import { ToolLayout } from '@/components/tool/ToolLayout'
import { useAppStore } from '@/store/app'
import { useClipboard } from '@/hooks/useClipboard'
import { meta } from './meta'

interface ParsedExif {
  [key: string]: unknown
}

// exifr tag groups we want to display
const TAG_GROUPS = [
  { key: 'camera', label: '📷 相机信息', tags: ['Make', 'Model', 'LensModel', 'LensMake', 'Software'] },
  { key: 'shooting', label: '📸 拍摄参数', tags: ['ExposureTime', 'FNumber', 'ISO', 'ShutterSpeedValue', 'ApertureValue', 'ExposureBiasValue', 'Flash', 'FocalLength', 'WhiteBalance', 'ExposureMode', 'MeteringMode', 'ExposureProgram'] },
  { key: 'image', label: '🖼️ 图像信息', tags: ['ImageWidth', 'ImageHeight', 'Orientation', 'ColorSpace', 'BitsPerSample', 'XResolution', 'YResolution', 'ResolutionUnit'] },
  { key: 'time', label: '📅 时间信息', tags: ['DateTimeOriginal', 'DateTimeDigitized', 'DateTime', 'OffsetTimeOriginal'] },
  { key: 'gps', label: '📍 GPS 位置', tags: ['latitude', 'longitude', 'GPSAltitude', 'GPSAltitudeRef', 'GPSSpeed', 'GPSImgDirection'] },
  { key: 'personal', label: '👤 个人信息', tags: ['Artist', 'Copyright', 'UserComment', 'ImageDescription'] },
]

function formatValue(key: string, value: unknown): string {
  if (value === null || value === undefined) return ''
  if (key === 'ExposureTime') {
    const n = Number(value)
    if (n < 1) return `1/${Math.round(1 / n)}s`
    return `${n}s`
  }
  if (key === 'FNumber') return `f/${Number(value).toFixed(1)}`
  if (key === 'FocalLength') return `${Number(value).toFixed(0)}mm`
  if (key === 'latitude' || key === 'longitude') return `${Number(value).toFixed(6)}°`
  if (key === 'GPSAltitude') return `${Number(value).toFixed(1)}m`
  if (value instanceof Date) return value.toLocaleString('zh-CN')
  if (typeof value === 'number') return value.toString()
  if (typeof value === 'string') return value
  if (Array.isArray(value)) return value.join(', ')
  return String(value)
}

export default function ExifReader() {
  const [data, setData] = useState<ParsedExif | null>(null)
  const [previewUrl, setPreviewUrl] = useState('')
  const [error, setError] = useState('')
  const [hideGps, setHideGps] = useState(false)
  const [hidePersonal, setHidePersonal] = useState(false)
  const addRecentTool = useAppStore((s) => s.addRecentTool)
  const { copy, copied } = useClipboard()

  const handleFile = useCallback(async (file: File) => {
    if (!file.type.startsWith('image/')) {
      setError('请上传图片文件')
      return
    }
    addRecentTool(meta.id)
    setError('')
    setData(null)

    // Generate preview
    const objUrl = URL.createObjectURL(file)
    setPreviewUrl(prev => { if (prev) URL.revokeObjectURL(prev); return objUrl })

    try {
      // exifr can parse JPEG, HEIC, PNG, TIFF, WebP, etc.
      const result = await exifr.parse(file, {
        tiff: true,
        exif: true,
        gps: true,
        iptc: false,
        icc: false,
        xmp: false,
        translateValues: true,
        reviveValues: true,
      })

      if (!result || Object.keys(result).length === 0) {
        setError('该图片不包含 EXIF 元数据')
        return
      }

      setData(result)
    } catch (e) {
      setError(e instanceof Error ? e.message : '解析失败')
    }
  }, [addRecentTool])

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) handleFile(file)
    e.target.value = ''
  }, [handleFile])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }, [handleFile])

  const exportJson = useCallback(() => {
    if (!data) return
    const exportData = { ...data }
    if (hideGps) {
      TAG_GROUPS.find(g => g.key === 'gps')?.tags.forEach(t => delete exportData[t])
    }
    if (hidePersonal) {
      TAG_GROUPS.find(g => g.key === 'personal')?.tags.forEach(t => delete exportData[t])
    }
    const json = JSON.stringify(exportData, null, 2)
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = 'exif.json'; a.click()
    URL.revokeObjectURL(url)
  }, [data, hideGps, hidePersonal])

  const visibleGroups = TAG_GROUPS.filter(g => {
    if (g.key === 'gps' && hideGps) return false
    if (g.key === 'personal' && hidePersonal) return false
    return true
  })

  const reset = () => {
    setData(null)
    setError('')
    if (previewUrl) URL.revokeObjectURL(previewUrl)
    setPreviewUrl('')
  }

  const copyJson = () => {
    if (!data) return
    const exportData = { ...data }
    if (hideGps) TAG_GROUPS.find(g => g.key === 'gps')?.tags.forEach(t => delete exportData[t])
    if (hidePersonal) TAG_GROUPS.find(g => g.key === 'personal')?.tags.forEach(t => delete exportData[t])
    copy(JSON.stringify(exportData, null, 2))
  }

  return (
    <ToolLayout meta={meta} onReset={reset}>
      <div className="flex flex-col gap-4">

        {/* Upload zone */}
        {!data && (
          <div
            onDrop={handleDrop}
            onDragOver={e => e.preventDefault()}
            className="border-2 border-dashed border-border-base rounded-xl p-12 text-center hover:border-accent transition-colors"
          >
            <Camera className="w-10 h-10 text-text-muted mx-auto mb-3" />
            <p className="text-text-secondary mb-4">拖拽图片到此处，或点击选择文件</p>
            <p className="text-xs text-text-muted mb-4">支持 JPEG、HEIC、PNG、TIFF、WebP 等格式</p>
            <label className="px-4 py-2 rounded-lg bg-accent text-bg-base text-sm font-medium cursor-pointer hover:bg-accent/90 transition-colors">
              <Upload className="w-4 h-4 inline mr-2" />选择图片
              <input type="file" accept="image/*" className="hidden" onChange={handleFileInput} />
            </label>
          </div>
        )}

        {error && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 text-red-400 text-sm">{error}</div>
        )}

        {data && (
          <>
            {/* Controls */}
            <div className="flex items-center gap-3 flex-wrap">
              <label className="flex items-center gap-2 text-sm text-text-secondary cursor-pointer">
                <input
                  type="checkbox"
                  checked={hideGps}
                  onChange={e => setHideGps(e.target.checked)}
                  className="rounded"
                />
                <Shield className="w-3.5 h-3.5" />隐藏 GPS 信息
              </label>
              <label className="flex items-center gap-2 text-sm text-text-secondary cursor-pointer">
                <input
                  type="checkbox"
                  checked={hidePersonal}
                  onChange={e => setHidePersonal(e.target.checked)}
                  className="rounded"
                />
                <Shield className="w-3.5 h-3.5" />隐藏个人信息
              </label>
              <div className="ml-auto flex gap-2">
                <button onClick={copyJson} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-bg-raised hover:bg-bg-surface text-sm text-text-secondary transition-colors">
                  {copied ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}复制 JSON
                </button>
                <button onClick={exportJson} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-bg-raised hover:bg-bg-surface text-sm text-text-secondary transition-colors">
                  <Download className="w-3.5 h-3.5" />导出 JSON
                </button>
                <label className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-bg-raised hover:bg-bg-surface text-sm text-text-secondary transition-colors cursor-pointer">
                  <Upload className="w-3.5 h-3.5" />换一张
                  <input type="file" accept="image/*" className="hidden" onChange={handleFileInput} />
                </label>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              {/* Preview */}
              {previewUrl && (
                <div className="bg-bg-surface border border-border-base rounded-lg p-3">
                  <img src={previewUrl} alt="preview" className="w-full h-40 object-contain rounded" />
                  {!hideGps && data['latitude'] !== undefined && data['longitude'] !== undefined && (
                    <a
                      href={`https://maps.google.com/?q=${String(data['latitude'])},${String(data['longitude'])}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-xs text-accent mt-2 hover:underline"
                    >
                      <MapPin className="w-3 h-3" />在地图中查看位置
                    </a>
                  )}
                </div>
              )}

              {/* EXIF Groups */}
              <div className="col-span-2 flex flex-col gap-3">
                {visibleGroups.map(group => {
                  const entries = group.tags
                    .filter(tag => data[tag] !== undefined && data[tag] !== null)
                    .map(tag => ({ tag, value: formatValue(tag, data[tag]) }))
                    .filter(e => e.value)

                  if (!entries.length) return null
                  return (
                    <div key={group.key} className="bg-bg-surface border border-border-base rounded-lg p-3">
                      <h3 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-2">{group.label}</h3>
                      <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                        {entries.map(({ tag, value }) => (
                          <div key={tag} className="flex gap-2 text-sm">
                            <span className="text-text-muted shrink-0 w-28 truncate">{tag}</span>
                            <span className="text-text-primary font-mono text-xs truncate">{value}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </>
        )}
      </div>
    </ToolLayout>
  )
}
