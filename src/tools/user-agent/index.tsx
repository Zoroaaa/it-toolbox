import { useState } from 'react'
import { Search } from 'lucide-react'
import { ToolLayout } from '@/components/tool/ToolLayout'
import { meta } from './meta'
import { parseUserAgent } from '@it-toolbox/core'
import { useAppStore } from '@/store/app'

const EXAMPLE_UAS = [
  {
    label: 'Chrome Windows',
    value: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  },
  {
    label: 'Safari macOS',
    value: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15',
  },
  {
    label: 'Firefox Linux',
    value: 'Mozilla/5.0 (X11; Linux x86_64; rv:121.0) Gecko/20100101 Firefox/121.0',
  },
  {
    label: 'iPhone Safari',
    value: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
  },
  {
    label: 'Android Chrome',
    value: 'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36',
  },
  {
    label: 'Googlebot',
    value: 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)',
  },
]

export default function UserAgentTool() {
  const [input, setInput] = useState('')
  const [result, setResult] = useState<ReturnType<typeof parseUserAgent> | null>(null)
  const { addRecentTool } = useAppStore()

  const handleParse = () => {
    if (!input.trim()) {
      setResult(null)
      return
    }
    addRecentTool(meta.id)
    setResult(parseUserAgent(input))
  }

  const reset = () => {
    setInput('')
    setResult(null)
  }

  return (
    <ToolLayout meta={meta} onReset={reset}>
      <div className="flex items-center gap-2 mb-4 flex-wrap">
        <button onClick={handleParse} className="btn-primary">
          <Search className="w-4 h-4" />
          解析
        </button>
      </div>

      <div className="space-y-4">
        <div>
          <label className="text-xs font-medium text-text-muted uppercase tracking-wider block mb-2">
            User Agent 字符串
          </label>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="粘贴 User Agent 字符串..."
            className="tool-input h-24 font-mono text-xs"
          />
        </div>

        <div>
          <label className="block text-sm text-text-secondary mb-2">示例 User Agent</label>
          <div className="flex flex-wrap gap-2">
            {EXAMPLE_UAS.map((ua) => (
              <button
                key={ua.label}
                onClick={() => setInput(ua.value)}
                className="px-3 py-1.5 bg-bg-surface text-text-secondary rounded-lg text-sm hover:bg-bg-raised border border-border-base transition-colors"
              >
                {ua.label}
              </button>
            ))}
          </div>
        </div>

        {result && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-bg-surface border border-border-base rounded-lg">
              <div className="text-sm text-text-secondary mb-2">浏览器</div>
              <div className="text-text-primary font-medium">{result.browser.name || '未知'}</div>
              <div className="text-text-secondary text-sm">版本: {result.browser.version || '-'}</div>
            </div>

            <div className="p-4 bg-bg-surface border border-border-base rounded-lg">
              <div className="text-sm text-text-secondary mb-2">操作系统</div>
              <div className="text-text-primary font-medium">{result.os.name || '未知'}</div>
              <div className="text-text-secondary text-sm">版本: {result.os.version || '-'}</div>
            </div>

            <div className="p-4 bg-bg-surface border border-border-base rounded-lg">
              <div className="text-sm text-text-secondary mb-2">设备</div>
              <div className="text-text-primary font-medium">
                {result.device.vendor ? `${result.device.vendor} ` : ''}
                {result.device.model || result.device.type || '未知'}
              </div>
              <div className="text-text-secondary text-sm">类型: {result.device.type || 'desktop'}</div>
            </div>

            <div className="p-4 bg-bg-surface border border-border-base rounded-lg">
              <div className="text-sm text-text-secondary mb-2">渲染引擎</div>
              <div className="text-text-primary font-medium">{result.engine.name || '未知'}</div>
              <div className="text-text-secondary text-sm">版本: {result.engine.version || '-'}</div>
            </div>

            {result.cpu.architecture && (
              <div className="p-4 bg-bg-surface border border-border-base rounded-lg">
                <div className="text-sm text-text-secondary mb-2">CPU 架构</div>
                <div className="text-text-primary font-medium">{result.cpu.architecture}</div>
              </div>
            )}
          </div>
        )}
      </div>
    </ToolLayout>
  )
}
