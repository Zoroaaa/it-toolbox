import { useState, useCallback, useRef } from 'react'
import { Hash, Upload, Copy, Check } from 'lucide-react'
import { ToolLayout } from '@/components/tool/ToolLayout'
import { md5, sha1, sha256, sha384, sha512, hashFile, type Result } from '@core/index'
import { useAppStore } from '@/store/app'
import { useClipboard } from '@/hooks/useClipboard'
import { meta } from './meta'

type Algorithm = 'MD5' | 'SHA-1' | 'SHA-256' | 'SHA-384' | 'SHA-512'

interface HashResult {
  algorithm: Algorithm
  hash: string
}

export default function HashCalculator() {
  const [input, setInput] = useState('')
  const [results, setResults] = useState<HashResult[]>([])
  const [selectedAlgo, setSelectedAlgo] = useState<Algorithm[]>(['MD5', 'SHA-256'])
  const [isProcessing, setIsProcessing] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { addRecentTool } = useAppStore()
  const { copy, copied } = useClipboard()

  const algorithms: Algorithm[] = ['MD5', 'SHA-1', 'SHA-256', 'SHA-384', 'SHA-512']

  const calculateHash = useCallback(async () => {
    if (!input.trim()) return
    addRecentTool(meta.id)
    setIsProcessing(true)

    const newResults: HashResult[] = []

    for (const algo of selectedAlgo) {
      try {
        let hashResult: Result<string>
        switch (algo) {
          case 'MD5':
            hashResult = md5(input)
            break
          case 'SHA-1':
            hashResult = await sha1(input)
            break
          case 'SHA-256':
            hashResult = await sha256(input)
            break
          case 'SHA-384':
            hashResult = await sha384(input)
            break
          case 'SHA-512':
            hashResult = await sha512(input)
            break
        }
        if (hashResult.ok) {
          newResults.push({ algorithm: algo, hash: hashResult.value })
        } else {
          newResults.push({ algorithm: algo, hash: '计算失败' })
        }
      } catch {
        newResults.push({ algorithm: algo, hash: '计算失败' })
      }
    }

    setResults(newResults)
    setIsProcessing(false)
  }, [input, selectedAlgo, addRecentTool])

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    addRecentTool(meta.id)
    setIsProcessing(true)
    setInput(`[文件: ${file.name}]`)

    const newResults: HashResult[] = []

    for (const algo of selectedAlgo) {
      try {
        if (algo === 'MD5') {
          const text = await file.text()
          const result = md5(text)
          newResults.push({ algorithm: algo, hash: result.ok ? result.value : '计算失败' })
        } else {
          const algoMap: Record<string, string> = {
            'SHA-1': 'SHA-1',
            'SHA-256': 'SHA-256',
            'SHA-384': 'SHA-384',
            'SHA-512': 'SHA-512',
          }
          const result = await hashFile(algoMap[algo], file)
          newResults.push({ algorithm: algo, hash: result.ok ? result.value : '计算失败' })
        }
      } catch {
        newResults.push({ algorithm: algo, hash: '计算失败' })
      }
    }

    setResults(newResults)
    setIsProcessing(false)
  }

  const toggleAlgorithm = (algo: Algorithm) => {
    setSelectedAlgo(prev =>
      prev.includes(algo)
        ? prev.filter(a => a !== algo)
        : [...prev, algo]
    )
  }

  const reset = () => {
    setInput('')
    setResults([])
    setSelectedAlgo(['MD5', 'SHA-256'])
  }

  const outputValue = results.map(r => `${r.algorithm}: ${r.hash}`).join('\n')

  return (
    <ToolLayout meta={meta} onReset={reset} outputValue={outputValue}>
      <div className="flex items-center gap-2 mb-4 flex-wrap">
        <button onClick={calculateHash} disabled={isProcessing || selectedAlgo.length === 0} className="btn-primary">
          <Hash className="w-4 h-4" />
          {isProcessing ? '计算中...' : '计算'}
        </button>

        <button onClick={() => fileInputRef.current?.click()} className="btn-ghost">
          <Upload className="w-4 h-4" />
          上传文件
        </button>
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          onChange={handleFileUpload}
        />

        <div className="flex items-center gap-1 ml-2">
          <span className="text-xs text-text-muted">算法:</span>
          {algorithms.map(algo => (
            <button
              key={algo}
              onClick={() => toggleAlgorithm(algo)}
              className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors
                ${selectedAlgo.includes(algo)
                  ? 'bg-accent text-bg-base'
                  : 'bg-bg-raised text-text-muted hover:text-text-primary'
                }`}
            >
              {algo}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 h-[calc(100vh-16rem)]">
        <div className="flex flex-col gap-2">
          <label className="text-xs font-medium text-text-muted uppercase tracking-wider">输入文本</label>
          <textarea
            className="tool-input flex-1 font-mono text-xs leading-relaxed"
            value={input}
            onChange={e => { setInput(e.target.value); setResults([]) }}
            placeholder="输入要计算哈希的文本..."
            spellCheck={false}
          />
          <div className="text-xs text-text-muted">{input.length} 字符</div>
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-xs font-medium text-text-muted uppercase tracking-wider">哈希结果</label>
          {results.length > 0 ? (
            <div className="flex-1 overflow-y-auto space-y-3">
              {results.map(result => (
                <div key={result.algorithm} className="p-3 rounded-lg bg-bg-surface border border-border-base">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-medium text-text-secondary">{result.algorithm}</span>
                    <button
                      onClick={() => copy(result.hash)}
                      className="p-1 rounded hover:bg-bg-raised transition-colors"
                    >
                      {copied ? <Check className="w-3.5 h-3.5 text-accent" /> : <Copy className="w-3.5 h-3.5 text-text-muted" />}
                    </button>
                  </div>
                  <p className="font-mono text-xs text-text-primary break-all">{result.hash}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex-1 rounded-lg bg-bg-raised border border-border-base flex items-center justify-center">
              <p className="text-text-muted text-sm">选择算法后点击计算</p>
            </div>
          )}
        </div>
      </div>
    </ToolLayout>
  )
}
