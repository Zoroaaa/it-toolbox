import { useState, useCallback } from 'react'
import { Check, X } from 'lucide-react'
import { ToolLayout } from '@/components/tool/ToolLayout'
import { useAppStore } from '@/store/app'
import { meta } from './meta'
import bcrypt from 'bcryptjs'

type Mode = 'hash' | 'verify'

export default function BcryptTool() {
  const [password, setPassword] = useState('')
  const [hash, setHash] = useState('')
  const [result, setResult] = useState('')
  const [error, setError] = useState('')
  const [mode, setMode] = useState<Mode>('hash')
  const [rounds, setRounds] = useState(10)
  const [isProcessing, setIsProcessing] = useState(false)
  const [verifyResult, setVerifyResult] = useState<boolean | null>(null)
  const { addHistory, addRecentTool } = useAppStore()

  const runHash = useCallback(async () => {
    if (!password.trim()) return
    addRecentTool(meta.id)
    setIsProcessing(true)
    setError('')

    try {
      const hashed = await bcrypt.hash(password, rounds)
      setResult(hashed)
      addHistory(meta.id, password)
    } catch (e) {
      setError((e as Error).message)
      setResult('')
    }
    setIsProcessing(false)
  }, [password, rounds, addHistory, addRecentTool])

  const runVerify = useCallback(async () => {
    if (!password.trim() || !hash.trim()) return
    addRecentTool(meta.id)
    setIsProcessing(true)
    setError('')
    setVerifyResult(null)

    try {
      const match = await bcrypt.compare(password, hash)
      setVerifyResult(match)
      setResult(match ? '密码匹配!' : '密码不匹配')
    } catch (e) {
      setError((e as Error).message)
      setResult('')
    }
    setIsProcessing(false)
  }, [password, hash, addRecentTool])

  const reset = () => {
    setPassword('')
    setHash('')
    setResult('')
    setError('')
    setVerifyResult(null)
  }

  return (
    <ToolLayout meta={meta} onReset={reset} outputValue={result}>
      <div className="flex items-center gap-2 mb-4 flex-wrap">
        <button 
          onClick={mode === 'hash' ? runHash : runVerify} 
          disabled={isProcessing} 
          className="btn-primary"
        >
          {isProcessing ? '处理中...' : (mode === 'hash' ? '生成哈希' : '验证密码')}
        </button>

        <div className="flex items-center gap-1 bg-bg-raised rounded-lg p-1">
          {(['hash', 'verify'] as Mode[]).map(m => (
            <button
              key={m}
              onClick={() => { setMode(m); setResult(''); setError(''); setVerifyResult(null) }}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors
                ${mode === m ? 'bg-accent text-bg-base' : 'text-text-muted hover:text-text-primary'}`}
            >
              {m === 'hash' ? '生成哈希' : '验证密码'}
            </button>
          ))}
        </div>

        {mode === 'hash' && (
          <div className="flex items-center gap-2 ml-2">
            <span className="text-xs text-text-muted">Rounds:</span>
            <input
              type="number"
              min="4"
              max="15"
              value={rounds}
              onChange={e => setRounds(parseInt(e.target.value) || 10)}
              className="w-16 px-2 py-1 rounded text-xs bg-bg-raised border border-border-base text-text-primary"
            />
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 h-[calc(100vh-16rem)]">
        <div className="flex flex-col gap-2">
          <label className="text-xs font-medium text-text-muted uppercase tracking-wider">密码</label>
          <input
            type="text"
            value={password}
            onChange={e => { setPassword(e.target.value); setError(''); setVerifyResult(null) }}
            placeholder="输入密码..."
            className="px-3 py-2 rounded-lg bg-bg-raised border border-border-base text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent"
          />
        </div>

        {mode === 'verify' && (
          <div className="flex flex-col gap-2">
            <label className="text-xs font-medium text-text-muted uppercase tracking-wider">哈希值</label>
            <textarea
              className="tool-input h-20 font-mono text-xs leading-relaxed"
              value={hash}
              onChange={e => { setHash(e.target.value); setError(''); setVerifyResult(null) }}
              placeholder="输入 Bcrypt 哈希值..."
              spellCheck={false}
            />
          </div>
        )}

        <div className="flex flex-col gap-2 flex-1">
          <label className="text-xs font-medium text-text-muted uppercase tracking-wider">结果</label>
          {error ? (
            <div className="flex-1 rounded-lg bg-rose-500/10 border border-rose-500/30 p-4">
              <p className="text-xs text-rose-400/80">{error}</p>
            </div>
          ) : verifyResult !== null ? (
            <div className={`flex-1 rounded-lg p-4 flex items-center gap-3 ${
              verifyResult ? 'bg-green-500/10 border border-green-500/30' : 'bg-rose-500/10 border border-rose-500/30'
            }`}>
              {verifyResult ? (
                <Check className="w-5 h-5 text-green-500" />
              ) : (
                <X className="w-5 h-5 text-rose-500" />
              )}
              <p className={`text-sm font-medium ${verifyResult ? 'text-green-500' : 'text-rose-500'}`}>
                {verifyResult ? '密码匹配!' : '密码不匹配'}
              </p>
            </div>
          ) : (
            <textarea
              className="tool-input flex-1 font-mono text-xs leading-relaxed"
              value={result}
              readOnly
              placeholder="结果将在这里显示..."
              spellCheck={false}
            />
          )}
        </div>
      </div>
    </ToolLayout>
  )
}
