import { useState, useCallback } from 'react'
import { ArrowRightLeft, AlertCircle } from 'lucide-react'
import { ToolLayout } from '@/components/tool/ToolLayout'
import { meta } from './meta'
import { convertCurl } from '@it-toolbox/core'
import { useAppStore } from '@/store/app'

const EXAMPLE_CURL = `curl 'https://api.example.com/users' \\
  -H 'Content-Type: application/json' \\
  -H 'Authorization: Bearer token123' \\
  --data-raw '{"name":"test"}'`

type Tab = 'fetch' | 'axios' | 'python' | 'go' | 'php'

export default function CurlConverterTool() {
  const [input, setInput] = useState('')
  const [output, setOutput] = useState<{ fetch: string; axios: string; python: string; go: string; php: string } | null>(null)
  const [error, setError] = useState('')
  const [activeTab, setActiveTab] = useState<Tab>('fetch')
  const { addHistory, addRecentTool } = useAppStore()

  const handleConvert = useCallback(() => {
    setError('')
    if (!input.trim()) {
      setOutput(null)
      return
    }
    addRecentTool(meta.id)
    const result = convertCurl(input)
    if (result.ok) {
      setOutput(result.value)
      addHistory(meta.id, input)
    } else {
      setError(result.error)
      setOutput(null)
    }
  }, [input, addHistory, addRecentTool])

  const reset = () => {
    setInput('')
    setOutput(null)
    setError('')
  }

  return (
    <ToolLayout meta={meta} onReset={reset}>
      <div className="flex items-center gap-2 mb-4 flex-wrap">
        <button onClick={handleConvert} className="btn-primary">
          <ArrowRightLeft className="w-4 h-4" />
          转换
        </button>
        <button onClick={() => setInput(EXAMPLE_CURL)} className="btn-ghost">
          示例
        </button>
      </div>

      <div className="space-y-4">
        <div>
          <label className="text-xs font-medium text-text-muted uppercase tracking-wider block mb-2">cURL 命令</label>
          <textarea
            className="tool-input h-32 font-mono text-xs leading-relaxed"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="粘贴 cURL 命令..."
            spellCheck={false}
          />
        </div>

        {error && (
          <div className="flex items-start gap-3 bg-rose-500/10 border border-rose-500/30 rounded-lg p-4">
            <AlertCircle className="w-4 h-4 text-rose-500 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-rose-400">{error}</p>
          </div>
        )}

        {output && (
          <div>
            <div className="flex gap-2 mb-2">
              {(['fetch', 'axios', 'python', 'go', 'php'] as Tab[]).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    activeTab === tab
                      ? 'bg-accent text-bg-base'
                      : 'bg-bg-surface text-text-secondary hover:bg-bg-raised border border-border-base'
                  }`}
                >
                  {tab === 'fetch' ? 'Fetch' : tab === 'axios' ? 'Axios' : tab === 'python' ? 'Python' : tab === 'go' ? 'Go' : 'PHP'}
                </button>
              ))}
            </div>

            <div className="relative">
              <textarea
                value={output[activeTab]}
                readOnly
                className="tool-input h-80 font-mono text-xs leading-relaxed"
              />
              <button
                onClick={() => navigator.clipboard.writeText(output[activeTab])}
                className="absolute top-2 right-2 px-3 py-1 bg-bg-raised text-text-secondary rounded text-xs hover:bg-bg-overlay transition-colors"
              >
                复制
              </button>
            </div>
          </div>
        )}
      </div>
    </ToolLayout>
  )
}
