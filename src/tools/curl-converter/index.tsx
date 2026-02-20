import { useState } from 'react'
import { ToolLayout } from '@/components/tool/ToolLayout'
import { meta } from './meta'
import { convertCurl } from '@it-toolbox/core'

const EXAMPLE_CURL = `curl 'https://api.example.com/users' \\
  -H 'Content-Type: application/json' \\
  -H 'Authorization: Bearer token123' \\
  --data-raw '{"name":"test"}'`

export default function CurlConverterTool() {
  const [input, setInput] = useState('')
  const [output, setOutput] = useState<{ fetch: string; axios: string; python: string; go: string; php: string } | null>(null)
  const [error, setError] = useState('')
  const [activeTab, setActiveTab] = useState<'fetch' | 'axios' | 'python' | 'go' | 'php'>('fetch')

  const handleConvert = () => {
    setError('')
    if (!input.trim()) {
      setOutput(null)
      return
    }

    const result = convertCurl(input)
    if (result.ok) {
      setOutput(result.value)
    } else {
      setError(result.error)
      setOutput(null)
    }
  }

  return (
    <ToolLayout meta={meta}>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-text-primary mb-2">cURL 命令</label>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="粘贴 cURL 命令..."
            className="w-full h-40 px-3 py-2 bg-bg-secondary border border-border-primary rounded-lg text-text-primary placeholder-text-tertiary focus:outline-none focus:ring-2 focus:ring-accent-primary font-mono text-sm resize-none"
          />
        </div>

        <div className="flex gap-2">
          <button
            onClick={handleConvert}
            className="px-4 py-2 bg-accent-primary text-white rounded-lg text-sm font-medium hover:bg-accent-secondary transition-colors"
          >
            转换
          </button>
          <button
            onClick={() => setInput(EXAMPLE_CURL)}
            className="px-4 py-2 bg-bg-secondary text-text-secondary rounded-lg text-sm font-medium hover:bg-bg-tertiary transition-colors"
          >
            示例
          </button>
          <button
            onClick={() => {
              setInput('')
              setOutput(null)
              setError('')
            }}
            className="px-4 py-2 bg-bg-secondary text-text-secondary rounded-lg text-sm font-medium hover:bg-bg-tertiary transition-colors"
          >
            清空
          </button>
        </div>

        {error && (
          <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
            {error}
          </div>
        )}

        {output && (
          <div>
            <div className="flex gap-2 mb-2">
              {(['fetch', 'axios', 'python', 'go', 'php'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    activeTab === tab
                      ? 'bg-accent-primary text-white'
                      : 'bg-bg-secondary text-text-secondary hover:bg-bg-tertiary'
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
                className="w-full h-80 px-3 py-2 bg-bg-secondary border border-border-primary rounded-lg text-text-primary font-mono text-sm resize-none"
              />
              <button
                onClick={() => navigator.clipboard.writeText(output[activeTab])}
                className="absolute top-2 right-2 px-3 py-1 bg-bg-tertiary text-text-secondary rounded text-xs hover:bg-border-primary transition-colors"
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
