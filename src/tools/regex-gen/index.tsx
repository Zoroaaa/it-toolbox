import { useState, useCallback, useMemo } from 'react'
import { Wand2, Copy, Check, Plus, Trash2, CheckCircle, XCircle } from 'lucide-react'
import { ToolLayout } from '@/components/tool/ToolLayout'
import { useAppStore } from '@/store/app'
import { useClipboard } from '@/hooks/useClipboard'
import { meta } from './meta'

interface Sample {
  id: string
  value: string
}

function generateId(): string {
  return Math.random().toString(36).substring(2, 9)
}

function escapeRegExp(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function inferPattern(samples: string[]): string {
  if (samples.length === 0) return ''
  
  const validSamples = samples.filter(s => s.trim().length > 0)
  if (validSamples.length === 0) return ''
  
  if (validSamples.length === 1) {
    return `^${escapeRegExp(validSamples[0])}$`
  }
  
  const patterns: string[][] = []
  const maxLen = Math.max(...validSamples.map(s => s.length))
  
  for (let i = 0; i < maxLen; i++) {
    const chars = validSamples.map(s => s[i] || '').filter(c => c)
    patterns.push(analyzeCharPosition(chars))
  }
  
  const mergedPatterns = mergePatterns(patterns)
  
  return `^${mergedPatterns}$`
}

function analyzeCharPosition(chars: string[]): string[] {
  const uniqueChars = [...new Set(chars)]
  
  if (uniqueChars.length === 1) {
    return [escapeRegExp(uniqueChars[0])]
  }
  
  const allDigits = uniqueChars.every(c => /\d/.test(c))
  if (allDigits) {
    return ['\\d']
  }
  
  const allLower = uniqueChars.every(c => /[a-z]/.test(c))
  if (allLower) {
    return ['[a-z]']
  }
  
  const allUpper = uniqueChars.every(c => /[A-Z]/.test(c))
  if (allUpper) {
    return ['[A-Z]']
  }
  
  const allLetters = uniqueChars.every(c => /[a-zA-Z]/.test(c))
  if (allLetters) {
    return ['[a-zA-Z]']
  }
  
  const allAlnum = uniqueChars.every(c => /[a-zA-Z0-9]/.test(c))
  if (allAlnum) {
    return ['[a-zA-Z0-9]']
  }
  
  const allWord = uniqueChars.every(c => /\w/.test(c))
  if (allWord) {
    return ['\\w']
  }
  
  const allSpace = uniqueChars.every(c => /\s/.test(c))
  if (allSpace) {
    return ['\\s']
  }
  
  return [`[${uniqueChars.map(escapeRegExp).join('')}]`]
}

function mergePatterns(patterns: string[][]): string {
  if (patterns.length === 0) return ''
  
  const result: string[] = []
  let currentPattern = patterns[0][0]
  let count = 1
  
  for (let i = 1; i < patterns.length; i++) {
    const pattern = patterns[i][0]
    
    if (pattern === currentPattern) {
      count++
    } else {
      result.push(formatPattern(currentPattern, count))
      currentPattern = pattern
      count = 1
    }
  }
  
  result.push(formatPattern(currentPattern, count))
  
  return result.join('')
}

function formatPattern(pattern: string, count: number): string {
  if (count === 1) {
    return pattern
  }
  if (count === 2) {
    return `${pattern}${pattern}`
  }
  return `${pattern}{${count}}`
}

function testRegex(pattern: string, samples: string[]): { sample: string; matches: boolean }[] {
  try {
    const regex = new RegExp(pattern)
    return samples.map(sample => ({
      sample,
      matches: regex.test(sample),
    }))
  } catch {
    return samples.map(sample => ({ sample, matches: false }))
  }
}

export default function RegexGenerator() {
  const [samples, setSamples] = useState<Sample[]>([
    { id: generateId(), value: '2024-01-15' },
    { id: generateId(), value: '2023-12-31' },
    { id: generateId(), value: '2025-06-20' },
  ])
  const [generatedPattern, setGeneratedPattern] = useState('')
  const [customPattern, setCustomPattern] = useState('')
  const addRecentTool = useAppStore((s) => s.addRecentTool)
  const { copy, copied } = useClipboard()

  const addSample = useCallback(() => {
    setSamples(prev => [...prev, { id: generateId(), value: '' }])
  }, [])

  const removeSample = useCallback((id: string) => {
    setSamples(prev => prev.filter(s => s.id !== id))
  }, [])

  const updateSample = useCallback((id: string, value: string) => {
    setSamples(prev => prev.map(s => s.id === id ? { ...s, value } : s))
  }, [])

  const generate = useCallback(() => {
    addRecentTool(meta.id)
    const values = samples.map(s => s.value).filter(v => v.trim())
    const pattern = inferPattern(values)
    setGeneratedPattern(pattern)
    setCustomPattern(pattern)
  }, [samples, addRecentTool])

  const testResults = useMemo(() => {
    const pattern = customPattern || generatedPattern
    if (!pattern) return []
    const values = samples.map(s => s.value).filter(v => v.trim())
    return testRegex(pattern, values)
  }, [customPattern, generatedPattern, samples])

  const reset = () => {
    setSamples([
      { id: generateId(), value: '2024-01-15' },
      { id: generateId(), value: '2023-12-31' },
      { id: generateId(), value: '2025-06-20' },
    ])
    setGeneratedPattern('')
    setCustomPattern('')
  }

  const outputValue = customPattern || generatedPattern

  return (
    <ToolLayout meta={meta} onReset={reset} outputValue={outputValue}>
      <div className="flex items-center gap-2 mb-4">
        <button onClick={generate} className="btn-primary">
          <Wand2 className="w-4 h-4" />
          推断正则
        </button>
        <button onClick={addSample} className="btn-ghost">
          <Plus className="w-4 h-4" />
          添加样本
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 h-[calc(100vh-20rem)]">
        <div className="flex flex-col gap-2">
          <label className="text-xs font-medium text-text-muted uppercase tracking-wider">
            样本输入 ({samples.length} 个)
          </label>
          <div className="flex-1 overflow-y-auto space-y-2 p-3 rounded-xl bg-bg-surface border border-border-base">
            {samples.map((sample, index) => (
              <div key={sample.id} className="flex items-center gap-2">
                <span className="text-xs text-text-muted w-6">#{index + 1}</span>
                <input
                  type="text"
                  value={sample.value}
                  onChange={e => updateSample(sample.id, e.target.value)}
                  placeholder="输入样本字符串"
                  className="flex-1 px-3 py-2 rounded-lg bg-bg-raised border border-border-base text-sm text-text-primary focus:outline-none focus:border-accent font-mono"
                />
                <button
                  onClick={() => removeSample(sample.id)}
                  className="p-2 rounded-lg hover:bg-rose-500/10 text-text-muted hover:text-rose-400 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
            {samples.length === 0 && (
              <p className="text-center text-text-muted text-sm py-4">点击"添加样本"开始输入</p>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-2">
            <label className="text-xs font-medium text-text-muted uppercase tracking-wider">
              生成的正则表达式
            </label>
            <div className="relative">
              <input
                type="text"
                value={customPattern}
                onChange={e => setCustomPattern(e.target.value)}
                placeholder="点击推断或手动输入正则..."
                className="w-full px-4 py-3 pr-12 rounded-xl bg-bg-surface border border-border-base text-text-primary font-mono text-sm focus:outline-none focus:border-accent"
              />
              {outputValue && (
                <button
                  onClick={() => copy(outputValue)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-lg hover:bg-bg-raised transition-colors"
                  title="复制"
                >
                  {copied ? <Check className="w-4 h-4 text-accent" /> : <Copy className="w-4 h-4 text-text-muted" />}
                </button>
              )}
            </div>
          </div>

          <div className="flex-1 flex flex-col gap-2">
            <label className="text-xs font-medium text-text-muted uppercase tracking-wider">
              测试结果
            </label>
            <div className="flex-1 overflow-y-auto p-3 rounded-xl bg-bg-surface border border-border-base">
              {testResults.length > 0 ? (
                <div className="space-y-2">
                  {testResults.map((result, i) => (
                    <div
                      key={i}
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg ${
                        result.matches
                          ? 'bg-green-500/10 border border-green-500/20'
                          : 'bg-rose-500/10 border border-rose-500/20'
                      }`}
                    >
                      {result.matches ? (
                        <CheckCircle className="w-4 h-4 text-green-500" />
                      ) : (
                        <XCircle className="w-4 h-4 text-rose-500" />
                      )}
                      <code className="text-sm font-mono text-text-primary">{result.sample}</code>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="h-full flex items-center justify-center">
                  <p className="text-text-muted text-sm">输入样本并推断正则后显示测试结果</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </ToolLayout>
  )
}
