import { useState } from 'react'
import { ToolLayout } from '@/components/tool/ToolLayout'
import { meta } from './meta'
import { yamlToJson, jsonToYaml } from '@it-toolbox/core'

export default function YamlJsonConverter() {
  const [input, setInput] = useState('')
  const [output, setOutput] = useState('')
  const [error, setError] = useState('')
  const [mode, setMode] = useState<'yaml2json' | 'json2yaml'>('yaml2json')

  const handleConvert = () => {
    setError('')
    if (!input.trim()) {
      setOutput('')
      return
    }

    const result = mode === 'yaml2json' ? yamlToJson(input) : jsonToYaml(input)
    if (result.ok) {
      setOutput(result.value)
    } else {
      setError(result.error)
      setOutput('')
    }
  }

  return (
    <ToolLayout meta={meta}>
      <div className="space-y-4">
        <div className="flex gap-2">
          <button
            onClick={() => setMode('yaml2json')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              mode === 'yaml2json'
                ? 'bg-accent-primary text-white'
                : 'bg-bg-secondary text-text-secondary hover:bg-bg-tertiary'
            }`}
          >
            YAML → JSON
          </button>
          <button
            onClick={() => setMode('json2yaml')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              mode === 'json2yaml'
                ? 'bg-accent-primary text-white'
                : 'bg-bg-secondary text-text-secondary hover:bg-bg-tertiary'
            }`}
          >
            JSON → YAML
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">
              {mode === 'yaml2json' ? 'YAML 输入' : 'JSON 输入'}
            </label>
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={mode === 'yaml2json' ? '输入 YAML...' : '输入 JSON...'}
              className="w-full h-80 px-3 py-2 bg-bg-secondary border border-border-primary rounded-lg text-text-primary placeholder-text-tertiary focus:outline-none focus:ring-2 focus:ring-accent-primary font-mono text-sm resize-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">
              {mode === 'yaml2json' ? 'JSON 输出' : 'YAML 输出'}
            </label>
            <textarea
              value={output}
              readOnly
              placeholder="转换结果..."
              className="w-full h-80 px-3 py-2 bg-bg-secondary border border-border-primary rounded-lg text-text-primary placeholder-text-tertiary font-mono text-sm resize-none"
            />
          </div>
        </div>

        {error && (
          <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
            {error}
          </div>
        )}

        <div className="flex gap-2">
          <button
            onClick={handleConvert}
            className="px-4 py-2 bg-accent-primary text-white rounded-lg text-sm font-medium hover:bg-accent-secondary transition-colors"
          >
            转换
          </button>
          <button
            onClick={() => {
              setInput('')
              setOutput('')
              setError('')
            }}
            className="px-4 py-2 bg-bg-secondary text-text-secondary rounded-lg text-sm font-medium hover:bg-bg-tertiary transition-colors"
          >
            清空
          </button>
          {output && (
            <button
              onClick={() => navigator.clipboard.writeText(output)}
              className="px-4 py-2 bg-bg-secondary text-text-secondary rounded-lg text-sm font-medium hover:bg-bg-tertiary transition-colors"
            >
              复制结果
            </button>
          )}
        </div>
      </div>
    </ToolLayout>
  )
}
