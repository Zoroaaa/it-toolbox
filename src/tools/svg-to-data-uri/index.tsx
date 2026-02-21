import { useState, useCallback } from 'react'
import { FileCode, Upload, Copy, Check } from 'lucide-react'
import { ToolLayout } from '@/components/tool/ToolLayout'
import { useAppStore } from '@/store/app'
import { useClipboard } from '@/hooks/useClipboard'
import { meta } from './meta'

type OutputFormat = 'base64' | 'uri-encoded' | 'background-css' | 'img-tag' | 'html-img'

const FORMAT_LABELS: Record<OutputFormat, string> = {
  'base64': 'Base64 Data URI',
  'uri-encoded': 'URL 编码 Data URI',
  'background-css': 'CSS background-image',
  'img-tag': 'React/JSX img',
  'html-img': 'HTML img 标签',
}

function svgToBase64(svg: string): string {
  return 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svg)))
}

function svgToURIEncoded(svg: string): string {
  const encoded = svg
    .replace(/"/g, "'")
    .replace(/</g, '%3C')
    .replace(/>/g, '%3E')
    .replace(/&/g, '%26')
    .replace(/#/g, '%23')
  return `data:image/svg+xml,${encoded}`
}

export default function SVGToDataURI() {
  const [input, setInput] = useState('')
  const [format, setFormat] = useState<OutputFormat>('base64')
  const { addRecentTool } = useAppStore()
  const { copy, copied } = useClipboard()

  const handleFileUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => setInput(ev.target?.result as string)
    reader.readAsText(file)
    e.target.value = ''
  }, [])

  const getOutput = useCallback((): string => {
    if (!input.trim() || !input.includes('<svg')) return ''
    addRecentTool(meta.id)

    try {
      const base64 = svgToBase64(input)
      const uriEncoded = svgToURIEncoded(input)

      switch (format) {
        case 'base64': return base64
        case 'uri-encoded': return uriEncoded
        case 'background-css': return `.element {\n  background-image: url("${uriEncoded}");\n  background-repeat: no-repeat;\n  background-size: contain;\n}`
        case 'img-tag': return `<img src="${base64}" alt="SVG Image" />`
        case 'html-img': return `<img src="${base64}" alt="SVG Image">`
        default: return base64
      }
    } catch {
      return '转换失败，请检查 SVG 是否有效'
    }
  }, [input, format, addRecentTool])

  const output = getOutput()

  const reset = () => setInput('')

  return (
    <ToolLayout meta={meta} onReset={reset} outputValue={output}>
      <div className="flex flex-col gap-4 h-[calc(100vh-12rem)]">
        {/* Format selector */}
        <div>
          <label className="text-xs font-medium text-text-muted uppercase tracking-wider mb-2 block">输出格式</label>
          <div className="flex flex-wrap gap-2">
            {(Object.keys(FORMAT_LABELS) as OutputFormat[]).map(f => (
              <button
                key={f}
                onClick={() => setFormat(f)}
                className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                  format === f
                    ? 'bg-accent text-bg-base font-medium'
                    : 'bg-bg-surface border border-border-base text-text-secondary hover:text-text-primary'
                }`}
              >
                {FORMAT_LABELS[f]}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 grid grid-cols-2 gap-4 min-h-0">
          {/* Input */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-medium text-text-muted uppercase tracking-wider">输入 SVG</label>
              <label className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-bg-raised hover:bg-bg-surface cursor-pointer text-xs text-text-secondary transition-colors">
                <Upload className="w-3 h-3" />
                上传文件
                <input type="file" accept=".svg" className="hidden" onChange={handleFileUpload} />
              </label>
            </div>
            <textarea
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="粘贴 SVG 代码..."
              className="flex-1 px-3 py-2.5 rounded-lg bg-bg-surface border border-border-base text-sm font-mono text-text-primary focus:outline-none focus:border-accent resize-none"
            />
            {/* Preview */}
            {input && input.includes('<svg') && (
              <div className="h-24 bg-bg-raised border border-border-base rounded-lg flex items-center justify-center p-2">
                <div
                  className="max-h-full max-w-full"
                  style={{ maxWidth: '100px', maxHeight: '80px' }}
                  dangerouslySetInnerHTML={{ __html: input }}
                />
              </div>
            )}
          </div>

          {/* Output */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-medium text-text-muted uppercase tracking-wider">转换结果</label>
              {output && (
                <button
                  onClick={() => copy(output)}
                  className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-bg-raised hover:bg-bg-surface text-xs text-text-secondary transition-colors"
                >
                  {copied ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3" />}
                  复制
                </button>
              )}
            </div>
            <textarea
              value={output}
              readOnly
              placeholder="Data URI 将显示在这里..."
              className="flex-1 px-3 py-2.5 rounded-lg bg-bg-surface border border-border-base text-sm font-mono text-text-muted resize-none break-all"
            />
            {/* Size info */}
            {output && (
              <div className="flex gap-4 text-xs text-text-muted">
                <span>输入: {new Blob([input]).size} B</span>
                <span>输出: {new Blob([output]).size} B</span>
                <span className="text-accent">
                  膨胀率: {((new Blob([output]).size / new Blob([input]).size) * 100).toFixed(0)}%
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </ToolLayout>
  )
}
