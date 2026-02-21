import { useState, useCallback } from 'react'
import { ArrowRightLeft, AlertCircle } from 'lucide-react'
import { ToolLayout } from '@/components/tool/ToolLayout'
import { meta } from './meta'
import { yamlToJson, jsonToYaml } from '@it-toolbox/core'
import { useAppStore } from '@/store/app'

type Mode = 'yaml2json' | 'json2yaml'

export default function YamlJsonConverter() {
  const [input, setInput] = useState('')
  const [output, setOutput] = useState('')
  const [error, setError] = useState('')
  const [mode, setMode] = useState<Mode>('yaml2json')
  const { addHistory, addRecentTool } = useAppStore()

  const handleConvert = useCallback(() => {
    setError('')
    if (!input.trim()) {
      setOutput('')
      return
    }
    addRecentTool(meta.id)
    const result = mode === 'yaml2json' ? yamlToJson(input) : jsonToYaml(input)
    if (result.ok) {
      setOutput(result.value)
      addHistory(meta.id, input)
    } else {
      setError(result.error)
      setOutput('')
    }
  }, [input, mode, addHistory, addRecentTool])

  const reset = () => {
    setInput('')
    setOutput('')
    setError('')
  }

  return (
    <ToolLayout meta={meta} onReset={reset} outputValue={output}>
      <div className="flex items-center gap-2 mb-4 flex-wrap">
        <button onClick={handleConvert} className="btn-primary">
          <ArrowRightLeft className="w-4 h-4" />
          转换
        </button>

        <div className="flex items-center gap-1 bg-bg-raised rounded-lg p-1">
          {(['yaml2json', 'json2yaml'] as Mode[]).map(m => (
            <button
              key={m}
              onClick={() => { setMode(m); setOutput(''); setError('') }}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors
                ${mode === m ? 'bg-accent text-bg-base' : 'text-text-muted hover:text-text-primary'}`}
            >
              {m === 'yaml2json' ? 'YAML → JSON' : 'JSON → YAML'}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 h-[calc(100vh-16rem)]">
        <div className="flex flex-col gap-2">
          <label className="text-xs font-medium text-text-muted uppercase tracking-wider">
            {mode === 'yaml2json' ? 'YAML 输入' : 'JSON 输入'}
          </label>
          <textarea
            className="tool-input flex-1 font-mono text-xs leading-relaxed"
            value={input}
            onChange={e => { setInput(e.target.value); setError('') }}
            placeholder={mode === 'yaml2json' ? 'key: value\nlist:\n  - item1\n  - item2' : '{\n  "key": "value"\n}'}
            spellCheck={false}
          />
          <div className="flex items-center justify-between text-xs text-text-muted">
            <span>{input.length} 字符</span>
            <span>{input.split('\n').length} 行</span>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-xs font-medium text-text-muted uppercase tracking-wider">
            {mode === 'yaml2json' ? 'JSON 输出' : 'YAML 输出'}
          </label>
          {error ? (
            <div className="flex-1 rounded-lg bg-rose-500/10 border border-rose-500/30 p-4 flex items-start gap-3">
              <AlertCircle className="w-4 h-4 text-rose-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-rose-500 mb-1">转换错误</p>
                <p className="text-xs text-rose-400/80 font-mono leading-relaxed">{error}</p>
              </div>
            </div>
          ) : (
            <textarea
              className="tool-input flex-1 font-mono text-xs leading-relaxed"
              value={output}
              readOnly
              placeholder="转换结果将在这里显示..."
              spellCheck={false}
            />
          )}
          {output && !error && (
            <div className="flex items-center justify-between text-xs text-text-muted">
              <span>{output.length} 字符</span>
              <span>{output.split('\n').length} 行</span>
            </div>
          )}
        </div>
      </div>
    </ToolLayout>
  )
}
