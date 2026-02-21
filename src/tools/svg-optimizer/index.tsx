import { useState, useCallback } from 'react'
import { Minimize2, Upload, Copy, Check, Download, RefreshCw } from 'lucide-react'
import { optimize, type Config } from 'svgo'
import { ToolLayout } from '@/components/tool/ToolLayout'
import { useAppStore } from '@/store/app'
import { useClipboard } from '@/hooks/useClipboard'
import { meta } from './meta'

function formatBytes(bytes: number): string {
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
}

const SVGO_PRESETS: Record<string, { label: string; desc: string; config: Config }> = {
  safe: {
    label: '安全模式',
    desc: '保留 id/class/aria，适合内联 SVG',
    config: {
      plugins: [
        { name: 'preset-default', params: { overrides: {
          removeViewBox: false,
          cleanupIds: false,
          mergePaths: false,
          convertShapeToPath: false,
        }}},
      ],
    },
  },
  balanced: {
    label: '均衡模式（推荐）',
    desc: '默认 SVGO preset，兼顾压缩与兼容',
    config: {
      plugins: [
        { name: 'preset-default', params: { overrides: { removeViewBox: false } } },
      ],
    },
  },
  aggressive: {
    label: '激进模式',
    desc: '最大压缩率，可能影响样式引用',
    config: {
      plugins: [
        'preset-default',
        'removeDimensions',
        { name: 'cleanupIds', params: { minify: true } },
        { name: 'mergePaths', params: { force: true } },
      ],
    },
  },
}

export default function SVGOptimizer() {
  const [input, setInput] = useState('')
  const [output, setOutput] = useState('')
  const [stats, setStats] = useState<{ original: number; optimized: number } | null>(null)
  const [error, setError] = useState('')
  const [preset, setPreset] = useState('balanced')
  const { addRecentTool } = useAppStore()
  const { copy, copied } = useClipboard()

  const handleOptimize = useCallback(() => {
    if (!input.trim()) return
    addRecentTool(meta.id)
    setError('')
    try {
      const result = optimize(input, { ...SVGO_PRESETS[preset].config, multipass: true })
      setOutput(result.data)
      setStats({
        original: new Blob([input]).size,
        optimized: new Blob([result.data]).size,
      })
    } catch (e) {
      setError(e instanceof Error ? e.message : '优化失败，请检查 SVG 格式')
    }
  }, [input, preset, addRecentTool])

  const handleFileUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = ev => { setInput(ev.target?.result as string); setOutput(''); setStats(null) }
    reader.readAsText(file)
    e.target.value = ''
  }, [])

  const handleDownload = useCallback(() => {
    if (!output) return
    const blob = new Blob([output], { type: 'image/svg+xml' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = 'optimized.svg'; a.click()
    URL.revokeObjectURL(url)
  }, [output])

  const savingPct = stats
    ? (((stats.original - stats.optimized) / stats.original) * 100).toFixed(1)
    : null

  const reset = () => { setInput(''); setOutput(''); setStats(null); setError('') }

  return (
    <ToolLayout meta={meta} onReset={reset} outputValue={output}>
      <div className="flex flex-col gap-4 h-[calc(100vh-12rem)]">

        {/* Preset selector */}
        <div className="flex gap-2">
          {Object.keys(SVGO_PRESETS).map(key => (
            <button
              key={key}
              onClick={() => setPreset(key)}
              className={`flex-1 px-3 py-2 rounded-lg border text-xs text-left transition-colors ${
                preset === key
                  ? 'border-accent bg-accent/10 text-accent'
                  : 'border-border-base bg-bg-surface text-text-secondary hover:bg-bg-raised'
              }`}
            >
              <div className="font-medium">{SVGO_PRESETS[key].label}</div>
              <div className="text-text-muted mt-0.5">{SVGO_PRESETS[key].desc}</div>
            </button>
          ))}
        </div>

        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: '原始大小', value: formatBytes(stats.original) },
              { label: '优化后大小', value: formatBytes(stats.optimized) },
              { label: '压缩率', value: `${savingPct}%`, highlight: true },
            ].map(({ label, value, highlight }) => (
              <div key={label} className="bg-bg-surface border border-border-base rounded-lg p-3 text-center">
                <div className={`text-lg font-bold font-mono ${highlight ? 'text-accent' : 'text-text-primary'}`}>{value}</div>
                <div className="text-xs text-text-muted">{label}</div>
              </div>
            ))}
          </div>
        )}

        {error && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 text-red-400 text-sm">{error}</div>
        )}

        <div className="flex-1 grid grid-cols-2 gap-4 min-h-0">
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-medium text-text-muted uppercase tracking-wider">输入 SVG</label>
              <label className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-bg-raised hover:bg-bg-surface cursor-pointer text-xs text-text-secondary transition-colors">
                <Upload className="w-3 h-3" />上传文件
                <input type="file" accept=".svg" className="hidden" onChange={handleFileUpload} />
              </label>
            </div>
            <textarea
              value={input}
              onChange={e => { setInput(e.target.value); setOutput(''); setStats(null) }}
              placeholder="粘贴 SVG 代码，或点击上传文件..."
              className="flex-1 px-3 py-2.5 rounded-lg bg-bg-surface border border-border-base text-sm font-mono text-text-primary focus:outline-none focus:border-accent resize-none"
            />
          </div>

          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-medium text-text-muted uppercase tracking-wider">优化结果</label>
              <div className="flex gap-1">
                {output && (
                  <>
                    <button onClick={() => copy(output)} className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-bg-raised hover:bg-bg-surface text-xs text-text-secondary transition-colors">
                      {copied ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3" />}复制
                    </button>
                    <button onClick={handleDownload} className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-bg-raised hover:bg-bg-surface text-xs text-text-secondary transition-colors">
                      <Download className="w-3 h-3" />下载
                    </button>
                  </>
                )}
              </div>
            </div>
            <textarea
              value={output}
              readOnly
              placeholder="SVGO 优化结果将显示在这里..."
              className="flex-1 px-3 py-2.5 rounded-lg bg-bg-surface border border-border-base text-sm font-mono text-text-muted resize-none"
            />
          </div>
        </div>

        {output && (
          <div className="flex gap-4">
            <div className="flex-1 bg-bg-surface border border-border-base rounded-lg p-4">
              <p className="text-xs text-text-muted mb-2">原始预览</p>
              <div className="flex items-center justify-center h-24" dangerouslySetInnerHTML={{ __html: input }} />
            </div>
            <div className="flex-1 bg-bg-surface border border-border-base rounded-lg p-4">
              <p className="text-xs text-text-muted mb-2">优化后预览</p>
              <div className="flex items-center justify-center h-24" dangerouslySetInnerHTML={{ __html: output }} />
            </div>
          </div>
        )}

        <button
          onClick={handleOptimize}
          disabled={!input.trim()}
          className="flex items-center justify-center gap-2 px-6 py-2.5 rounded-lg bg-accent text-bg-base font-medium text-sm hover:bg-accent/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Minimize2 className="w-4 h-4" /><RefreshCw className="w-4 h-4" />使用 SVGO 优化
        </button>
      </div>
    </ToolLayout>
  )
}
