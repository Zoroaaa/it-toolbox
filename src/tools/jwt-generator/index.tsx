import { useState, useCallback } from 'react'
import { KeyRound, Copy, Check } from 'lucide-react'
import { ToolLayout } from '@/components/tool/ToolLayout'
import { useAppStore } from '@/store/app'
import { useClipboard } from '@/hooks/useClipboard'
import { meta } from './meta'
import { SignJWT, importPKCS8 } from 'jose'

type Algorithm = 'HS256' | 'HS384' | 'HS512' | 'RS256' | 'RS384' | 'RS512'

export default function JwtGenerator() {
  const [payload, setPayload] = useState('{\n  "sub": "1234567890",\n  "name": "John Doe",\n  "iat": 1516239022\n}')
  const [secret, setSecret] = useState('')
  const [privateKey, setPrivateKey] = useState('')
  const [result, setResult] = useState('')
  const [error, setError] = useState('')
  const [algorithm, setAlgorithm] = useState<Algorithm>('HS256')
  const [isProcessing, setIsProcessing] = useState(false)
  const { addHistory, addRecentTool } = useAppStore()
  const { copy, copied } = useClipboard()

  const generateJwt = useCallback(async () => {
    addRecentTool(meta.id)
    setIsProcessing(true)
    setError('')

    try {
      const payloadObj = JSON.parse(payload)

      let jwt: string

      if (algorithm.startsWith('HS')) {
        if (!secret) {
          throw new Error('请输入密钥')
        }
        const secretKey = new TextEncoder().encode(secret)
        jwt = await new SignJWT(payloadObj)
          .setProtectedHeader({ alg: algorithm, typ: 'JWT' })
          .sign(secretKey)
      } else {
        if (!privateKey) {
          throw new Error('请输入 RSA 私钥')
        }
        const key = await importPKCS8(privateKey, algorithm)
        jwt = await new SignJWT(payloadObj)
          .setProtectedHeader({ alg: algorithm, typ: 'JWT' })
          .sign(key)
      }

      setResult(jwt)
      addHistory(meta.id, payload)
    } catch (e) {
      setError((e as Error).message)
      setResult('')
    }
    setIsProcessing(false)
  }, [payload, secret, privateKey, algorithm, addHistory, addRecentTool])

  const reset = () => {
    setPayload('{\n  "sub": "1234567890",\n  "name": "John Doe",\n  "iat": 1516239022\n}')
    setSecret('')
    setPrivateKey('')
    setResult('')
    setError('')
  }

  return (
    <ToolLayout meta={meta} onReset={reset} outputValue={result}>
      <div className="flex items-center gap-2 mb-4 flex-wrap">
        <button onClick={generateJwt} disabled={isProcessing} className="btn-primary">
          <KeyRound className="w-4 h-4" />
          {isProcessing ? '生成中...' : '生成 JWT'}
        </button>

        <div className="flex items-center gap-1 bg-bg-raised rounded-lg p-1">
          {(['HS256', 'HS384', 'HS512', 'RS256', 'RS384', 'RS512'] as Algorithm[]).map(algo => (
            <button
              key={algo}
              onClick={() => setAlgorithm(algo)}
              className={`px-2 py-1 rounded-md text-xs font-medium transition-colors
                ${algorithm === algo ? 'bg-accent text-bg-base' : 'text-text-muted hover:text-text-primary'}`}
            >
              {algo}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 h-[calc(100vh-16rem)]">
        <div className="flex flex-col gap-2">
          <label className="text-xs font-medium text-text-muted uppercase tracking-wider">Payload</label>
          <textarea
            className="tool-input flex-1 font-mono text-xs leading-relaxed"
            value={payload}
            onChange={e => { setPayload(e.target.value); setError('') }}
            placeholder="JWT Payload..."
            spellCheck={false}
          />
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-xs font-medium text-text-muted uppercase tracking-wider">
            {algorithm.startsWith('HS') ? '密钥' : 'RSA 私钥 (PEM)'}
          </label>
          {algorithm.startsWith('HS') ? (
            <input
              type="password"
              value={secret}
              onChange={e => { setSecret(e.target.value); setError('') }}
              placeholder="输入密钥..."
              className="px-3 py-2 rounded-lg bg-bg-raised border border-border-base text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent"
            />
          ) : (
            <textarea
              className="tool-input flex-1 font-mono text-xs leading-relaxed"
              value={privateKey}
              onChange={e => { setPrivateKey(e.target.value); setError('') }}
              placeholder="-----BEGIN PRIVATE KEY-----&#10;...&#10;-----END PRIVATE KEY-----"
              spellCheck={false}
            />
          )}
        </div>
      </div>

      <div className="mt-4">
        <div className="flex items-center justify-between mb-2">
          <label className="text-xs font-medium text-text-muted uppercase tracking-wider">生成的 JWT</label>
          {result && (
            <button onClick={() => copy(result)} className="btn-ghost text-xs">
              {copied ? <Check className="w-3.5 h-3.5 text-accent" /> : <Copy className="w-3.5 h-3.5" />}
              复制
            </button>
          )}
        </div>
        {error ? (
          <div className="rounded-lg bg-rose-500/10 border border-rose-500/30 p-4">
            <p className="text-xs text-rose-400/80">{error}</p>
          </div>
        ) : (
          <div className="rounded-lg bg-bg-surface border border-border-base p-3">
            <p className="font-mono text-xs text-text-primary break-all">{result || '结果将在这里显示...'}</p>
          </div>
        )}
      </div>
    </ToolLayout>
  )
}
