import { useState, useCallback } from 'react'
import { ShieldCheck, AlertCircle, CheckCircle, XCircle, Info } from 'lucide-react'
import { ToolLayout } from '@/components/tool/ToolLayout'
import { useAppStore } from '@/store/app'
import { meta } from './meta'

interface VerifyResult {
  valid: boolean
  algorithm: string
  header: Record<string, unknown>
  payload: Record<string, unknown>
  error?: string
  expiresAt?: Date
  issuedAt?: Date
  isExpired?: boolean
}

function base64UrlDecode(str: string): string {
  const base64 = str.replace(/-/g, '+').replace(/_/g, '/')
  const padded = base64.padEnd(base64.length + (4 - base64.length % 4) % 4, '=')
  return atob(padded)
}

function base64UrlToUint8Array(str: string): Uint8Array {
  const binary = base64UrlDecode(str)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i)
  }
  return bytes
}

async function verifyHmac(token: string, secret: string, algorithm: string): Promise<boolean> {
  const [headerB64, payloadB64, signatureB64] = token.split('.')
  const data = `${headerB64}.${payloadB64}`
  
  const hashAlgo = algorithm.replace('HS', 'SHA-')
  const encoder = new TextEncoder()
  
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: hashAlgo as AlgorithmIdentifier },
    false,
    ['verify']
  )
  
  const signature = base64UrlToUint8Array(signatureB64)
  
  return crypto.subtle.verify(
    'HMAC',
    key,
    signature.buffer.slice(signature.byteOffset, signature.byteOffset + signature.byteLength) as ArrayBuffer,
    encoder.encode(data)
  )
}

async function verifyRsa(token: string, publicKeyPem: string, algorithm: string): Promise<boolean> {
  const [headerB64, payloadB64, signatureB64] = token.split('.')
  const data = `${headerB64}.${payloadB64}`
  
  const hashAlgo = algorithm.replace('RS', 'SHA-')
  
  const pemContents = publicKeyPem
    .replace(/-----BEGIN PUBLIC KEY-----/g, '')
    .replace(/-----END PUBLIC KEY-----/g, '')
    .replace(/\s/g, '')
  
  const binaryKey = atob(pemContents)
  const keyBytes = new Uint8Array(binaryKey.length)
  for (let i = 0; i < binaryKey.length; i++) {
    keyBytes[i] = binaryKey.charCodeAt(i)
  }
  
  const key = await crypto.subtle.importKey(
    'spki',
    keyBytes,
    { name: 'RSASSA-PKCS1-v1_5', hash: hashAlgo as AlgorithmIdentifier },
    false,
    ['verify']
  )
  
  const signature = base64UrlToUint8Array(signatureB64)
  const encoder = new TextEncoder()
  
  return crypto.subtle.verify(
    'RSASSA-PKCS1-v1_5',
    key,
    signature.buffer.slice(signature.byteOffset, signature.byteOffset + signature.byteLength) as ArrayBuffer,
    encoder.encode(data)
  )
}

export default function JwtVerifier() {
  const [token, setToken] = useState('')
  const [secret, setSecret] = useState('')
  const [keyType, setKeyType] = useState<'hmac' | 'rsa'>('hmac')
  const [result, setResult] = useState<VerifyResult | null>(null)
  const [error, setError] = useState('')
  const [isVerifying, setIsVerifying] = useState(false)
  const addRecentTool = useAppStore((s) => s.addRecentTool)

  const verify = useCallback(async () => {
    if (!token.trim()) return
    
    addRecentTool(meta.id)
    setIsVerifying(true)
    setError('')
    setResult(null)
    
    try {
      const parts = token.trim().split('.')
      if (parts.length !== 3) {
        setError('无效的JWT格式：必须包含3个部分')
        setIsVerifying(false)
        return
      }
      
      const header = JSON.parse(base64UrlDecode(parts[0]))
      const payload = JSON.parse(base64UrlDecode(parts[1]))
      const algorithm = header.alg as string
      
      if (!algorithm) {
        setError('JWT Header中缺少alg字段')
        setIsVerifying(false)
        return
      }
      
      const isHmac = algorithm.startsWith('HS')
      const isRsa = algorithm.startsWith('RS')
      
      if (!isHmac && !isRsa) {
        setError(`不支持的算法: ${algorithm}`)
        setIsVerifying(false)
        return
      }
      
      let valid = false
      
      if (isHmac) {
        if (!secret.trim()) {
          setError('HMAC算法需要提供密钥')
          setIsVerifying(false)
          return
        }
        valid = await verifyHmac(token, secret, algorithm)
      } else {
        if (!secret.trim()) {
          setError('RSA算法需要提供公钥')
          setIsVerifying(false)
          return
        }
        valid = await verifyRsa(token, secret, algorithm)
      }
      
      let expiresAt: Date | undefined
      let issuedAt: Date | undefined
      let isExpired = false
      
      if (payload.exp) {
        expiresAt = new Date(payload.exp * 1000)
        isExpired = expiresAt < new Date()
      }
      if (payload.iat) {
        issuedAt = new Date(payload.iat * 1000)
      }
      
      setResult({
        valid,
        algorithm,
        header,
        payload,
        expiresAt,
        issuedAt,
        isExpired,
      })
    } catch (e) {
      setError('验证失败: ' + (e as Error).message)
    }
    
    setIsVerifying(false)
  }, [token, secret, addRecentTool])

  const reset = () => {
    setToken('')
    setSecret('')
    setResult(null)
    setError('')
    setKeyType('hmac')
  }

  const outputValue = result ? JSON.stringify({
    valid: result.valid,
    algorithm: result.algorithm,
    header: result.header,
    payload: result.payload,
  }, null, 2) : ''

  return (
    <ToolLayout meta={meta} onReset={reset} outputValue={outputValue}>
      <div className="flex items-center gap-2 mb-4">
        <button onClick={verify} disabled={isVerifying || !token.trim()} className="btn-primary">
          <ShieldCheck className="w-4 h-4" />
          {isVerifying ? '验证中...' : '验证签名'}
        </button>
        
        <div className="flex items-center gap-2 ml-4">
          <span className="text-xs text-text-muted">密钥类型:</span>
          <button
            onClick={() => { setKeyType('hmac'); setSecret('') }}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              keyType === 'hmac'
                ? 'bg-accent text-bg-base'
                : 'bg-bg-surface text-text-secondary hover:bg-bg-raised border border-border-base'
            }`}
          >
            HMAC密钥
          </button>
          <button
            onClick={() => { setKeyType('rsa'); setSecret('') }}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              keyType === 'rsa'
                ? 'bg-accent text-bg-base'
                : 'bg-bg-surface text-text-secondary hover:bg-bg-raised border border-border-base'
            }`}
          >
            RSA公钥
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 h-[calc(100vh-20rem)]">
        <div className="flex flex-col gap-3">
          <div className="flex-1 flex flex-col gap-2">
            <label className="text-xs font-medium text-text-muted uppercase tracking-wider">JWT Token</label>
            <textarea
              className="tool-input flex-1 font-mono text-xs leading-relaxed"
              value={token}
              onChange={e => { setToken(e.target.value); setError(''); setResult(null) }}
              placeholder="粘贴要验证的 JWT Token..."
              spellCheck={false}
            />
            <div className="text-xs text-text-muted">{token.length} 字符</div>
          </div>
          
          <div className="flex flex-col gap-2">
            <label className="text-xs font-medium text-text-muted uppercase tracking-wider">
              {keyType === 'hmac' ? 'HMAC 密钥' : 'RSA 公钥 (PEM格式)'}
            </label>
            {keyType === 'hmac' ? (
              <input
                type="text"
                className="tool-input font-mono text-sm"
                value={secret}
                onChange={e => { setSecret(e.target.value); setResult(null) }}
                placeholder="输入 HMAC 密钥..."
              />
            ) : (
              <textarea
                className="tool-input h-24 font-mono text-xs leading-relaxed"
                value={secret}
                onChange={e => { setSecret(e.target.value); setResult(null) }}
                placeholder={`-----BEGIN PUBLIC KEY-----\n...\n-----END PUBLIC KEY-----`}
                spellCheck={false}
              />
            )}
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-xs font-medium text-text-muted uppercase tracking-wider">验证结果</label>
          
          {error ? (
            <div className="flex-1 rounded-lg bg-rose-500/10 border border-rose-500/30 p-4 flex items-start gap-3">
              <AlertCircle className="w-4 h-4 text-rose-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-rose-500 mb-1">验证错误</p>
                <p className="text-xs text-rose-400/80">{error}</p>
              </div>
            </div>
          ) : result ? (
            <div className="flex-1 overflow-y-auto space-y-4">
              <div className={`flex items-center gap-2 px-4 py-3 rounded-lg ${
                result.valid && !result.isExpired
                  ? 'bg-green-500/10 border border-green-500/30'
                  : 'bg-rose-500/10 border border-rose-500/30'
              }`}>
                {result.valid && !result.isExpired ? (
                  <>
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    <div>
                      <span className="text-sm font-medium text-green-500">签名验证通过</span>
                      {result.isExpired && (
                        <span className="text-xs text-rose-400 ml-2">(但Token已过期)</span>
                      )}
                    </div>
                  </>
                ) : (
                  <>
                    <XCircle className="w-5 h-5 text-rose-500" />
                    <span className="text-sm font-medium text-rose-500">
                      {!result.valid ? '签名验证失败' : 'Token已过期'}
                    </span>
                  </>
                )}
              </div>

              <div className="p-3 rounded-lg bg-bg-raised border border-border-base">
                <div className="flex items-center gap-2 text-xs text-text-muted mb-1">
                  <Info className="w-3 h-3" />
                  算法信息
                </div>
                <code className="text-sm font-mono text-text-primary">{result.algorithm}</code>
              </div>

              {(result.expiresAt || result.issuedAt) && (
                <div className="grid grid-cols-2 gap-3">
                  {result.issuedAt && (
                    <div className="p-3 rounded-lg bg-bg-raised border border-border-base">
                      <div className="text-xs text-text-muted mb-1">签发时间</div>
                      <p className="text-sm text-text-primary">{result.issuedAt.toLocaleString()}</p>
                    </div>
                  )}
                  {result.expiresAt && (
                    <div className={`p-3 rounded-lg border ${
                      result.isExpired
                        ? 'bg-rose-500/10 border-rose-500/30'
                        : 'bg-bg-raised border-border-base'
                    }`}>
                      <div className={`text-xs mb-1 ${result.isExpired ? 'text-rose-400' : 'text-text-muted'}`}>
                        过期时间
                      </div>
                      <p className={`text-sm ${result.isExpired ? 'text-rose-400' : 'text-text-primary'}`}>
                        {result.expiresAt.toLocaleString()}
                      </p>
                    </div>
                  )}
                </div>
              )}

              <div>
                <h3 className="text-xs font-medium text-text-muted uppercase tracking-wider mb-2">Header</h3>
                <pre className="tool-input p-3 text-xs font-mono overflow-x-auto">{JSON.stringify(result.header, null, 2)}</pre>
              </div>

              <div>
                <h3 className="text-xs font-medium text-text-muted uppercase tracking-wider mb-2">Payload</h3>
                <pre className="tool-input p-3 text-xs font-mono overflow-x-auto">{JSON.stringify(result.payload, null, 2)}</pre>
              </div>
            </div>
          ) : (
            <div className="flex-1 rounded-lg bg-bg-raised border border-border-base flex items-center justify-center">
              <p className="text-text-muted text-sm">输入JWT和密钥后点击验证</p>
            </div>
          )}
        </div>
      </div>
    </ToolLayout>
  )
}
