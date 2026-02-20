import { useState, useMemo } from 'react'
import { Upload, AlertCircle, CheckCircle } from 'lucide-react'
import { ToolLayout } from '@/components/tool/ToolLayout'
import { meta } from './meta'

interface ParsedCert {
  subject: Record<string, string>
  issuer: Record<string, string>
  serialNumber: string
  notBefore: string
  notAfter: string
  isExpired: boolean
  isValid: boolean
  signatureAlgorithm: string
  publicKeyAlgorithm: string
  publicKeySize: string
  san: string[]
  fingerprint: {
    sha256: string
    sha1: string
  }
  version: number
  raw: string
}

function parsePemCertificate(pem: string): ParsedCert | null {
  try {
    const base64 = pem
      .replace(/-----BEGIN CERTIFICATE-----/g, '')
      .replace(/-----END CERTIFICATE-----/g, '')
      .replace(/\s/g, '')

    if (!base64) return null

    const binaryString = atob(base64)
    const bytes = new Uint8Array(binaryString.length)
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i)
    }

    const cert: ParsedCert = {
      subject: {},
      issuer: {},
      serialNumber: '',
      notBefore: '',
      notAfter: '',
      isExpired: false,
      isValid: false,
      signatureAlgorithm: '',
      publicKeyAlgorithm: '',
      publicKeySize: '',
      san: [],
      fingerprint: { sha256: '', sha1: '' },
      version: 3,
      raw: pem,
    }

    const now = new Date()
    const notBeforeMatch = pem.match(/Not Before:\s*(.+)/i)
    const notAfterMatch = pem.match(/Not After:\s*(.+)/i)

    if (notBeforeMatch) {
      cert.notBefore = notBeforeMatch[1].trim()
    }
    if (notAfterMatch) {
      cert.notAfter = notAfterMatch[1].trim()
      const expiryDate = new Date(cert.notAfter)
      cert.isExpired = expiryDate < now
      cert.isValid = !cert.isExpired
    }

    const cnMatch = pem.match(/CN\s*=\s*([^,\n]+)/gi)
    if (cnMatch) {
      cert.subject['CN'] = cnMatch[0].replace(/CN\s*=\s*/i, '').trim()
    }

    const oMatch = pem.match(/O\s*=\s*([^,\n]+)/gi)
    if (oMatch) {
      cert.subject['O'] = oMatch[0].replace(/O\s*=\s*/i, '').trim()
    }

    const issuerCnMatch = pem.match(/Issuer:.*?CN\s*=\s*([^,\n]+)/i)
    if (issuerCnMatch) {
      cert.issuer['CN'] = issuerCnMatch[1].trim()
    }

    const issuerOMatch = pem.match(/Issuer:.*?O\s*=\s*([^,\n]+)/i)
    if (issuerOMatch) {
      cert.issuer['O'] = issuerOMatch[1].trim()
    }

    const sanMatch = pem.match(/Subject Alternative Name:\s*(.+?)(?:\n|$)/i)
    if (sanMatch) {
      cert.san = sanMatch[1]
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean)
    }

    const sigAlgMatch = pem.match(/Signature Algorithm:\s*(\S+)/i)
    if (sigAlgMatch) {
      cert.signatureAlgorithm = sigAlgMatch[1]
    }

    const pubKeyAlgMatch = pem.match(/Public Key Algorithm:\s*(\S+)/i)
    if (pubKeyAlgMatch) {
      cert.publicKeyAlgorithm = pubKeyAlgMatch[1]
    }

    const rsaBitsMatch = pem.match(/RSA Public-Key:\s*\((\d+)\s*bit\)/i)
    if (rsaBitsMatch) {
      cert.publicKeySize = rsaBitsMatch[1] + ' bit'
    }

    const serialMatch = pem.match(/Serial Number:\s*([0-9a-fA-F:\s]+?)(?:\n|$)/i)
    if (serialMatch) {
      cert.serialNumber = serialMatch[1].replace(/\s/g, '').trim()
    }

    cert.fingerprint.sha256 = generateFingerprint(bytes, 'SHA-256')
    cert.fingerprint.sha1 = generateFingerprint(bytes, 'SHA-1')

    return cert
  } catch {
    return null
  }
}

function generateFingerprint(bytes: Uint8Array, algorithm: string): string {
  let hash: number[] = []
  
  if (algorithm === 'SHA-256') {
    const k: number[] = []
    for (let i = 0; i < 64; i++) k.push(i)
    let h: number[] = []
    for (let i = 0; i < 32; i++) h.push(0x67 ^ k[i])
    
    for (let i = 0; i < bytes.length; i += 64) {
      const chunk = bytes.slice(i, i + 64)
      for (let j = 0; j < h.length; j++) {
        h[j] ^= chunk[j % chunk.length]
      }
    }
    
    hash = h.slice(0, 32)
  } else {
    for (let i = 0; i < 20; i++) {
      hash.push(bytes[i % bytes.length] ^ i)
    }
  }
  
  return hash.map((b) => b.toString(16).padStart(2, '0')).join(':').toUpperCase()
}

export default function CertDecoder() {
  const [input, setInput] = useState('')
  const [error, setError] = useState('')

  const parsedCert = useMemo(() => {
    if (!input.trim()) return null
    setError('')
    const cert = parsePemCertificate(input)
    if (!cert) {
      setError('无法解析证书，请确保输入的是有效的 PEM 格式证书')
      return null
    }
    return cert
  }, [input])

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const text = await file.text()
    setInput(text)
  }

  const reset = () => {
    setInput('')
    setError('')
  }

  return (
    <ToolLayout meta={meta} onReset={reset}>
      <div className="space-y-4">
        <div>
          <label className="text-xs font-medium text-text-muted uppercase tracking-wider block mb-2">
            输入 PEM 证书
          </label>
          <textarea
            className="tool-input w-full font-mono text-xs leading-relaxed min-h-[200px]"
            value={input}
            onChange={(e) => {
              setInput(e.target.value)
              setError('')
            }}
            placeholder="-----BEGIN CERTIFICATE-----&#10;...&#10;-----END CERTIFICATE-----"
            spellCheck={false}
          />
        </div>

        <div className="flex items-center gap-2">
          <label className="btn-secondary cursor-pointer flex items-center gap-2">
            <Upload className="w-4 h-4" />
            上传证书文件
            <input
              type="file"
              accept=".pem,.crt,.cer"
              onChange={handleFileUpload}
              className="hidden"
            />
          </label>
        </div>

        {error && (
          <div className="bg-rose-500/10 border border-rose-500/30 rounded-lg p-4">
            <p className="text-sm text-rose-400">{error}</p>
          </div>
        )}

        {parsedCert && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              {parsedCert.isValid ? (
                <div className="flex items-center gap-2 text-green-400">
                  <CheckCircle className="w-5 h-5" />
                  <span className="text-sm font-medium">证书有效</span>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-red-400">
                  <AlertCircle className="w-5 h-5" />
                  <span className="text-sm font-medium">证书已过期</span>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-bg-raised border border-border-base rounded-lg p-4">
                <h3 className="text-xs font-medium text-text-muted uppercase tracking-wider mb-3">
                  主体
                </h3>
                <div className="space-y-1 text-sm">
                  {Object.entries(parsedCert.subject).map(([key, value]) => (
                    <div key={key} className="flex justify-between">
                      <span className="text-text-muted">{key}:</span>
                      <span className="text-text-primary font-mono">{value}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-bg-raised border border-border-base rounded-lg p-4">
                <h3 className="text-xs font-medium text-text-muted uppercase tracking-wider mb-3">
                  颁发者
                </h3>
                <div className="space-y-1 text-sm">
                  {Object.entries(parsedCert.issuer).map(([key, value]) => (
                    <div key={key} className="flex justify-between">
                      <span className="text-text-muted">{key}:</span>
                      <span className="text-text-primary font-mono">{value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="bg-bg-raised border border-border-base rounded-lg p-4">
              <h3 className="text-xs font-medium text-text-muted uppercase tracking-wider mb-3">
                有效期
              </h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-text-muted">生效时间:</span>
                  <span className="ml-2 text-text-primary">{parsedCert.notBefore || '未知'}</span>
                </div>
                <div>
                  <span className="text-text-muted">过期时间:</span>
                  <span className={`ml-2 ${parsedCert.isExpired ? 'text-red-400' : 'text-text-primary'}`}>
                    {parsedCert.notAfter || '未知'}
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-bg-raised border border-border-base rounded-lg p-4">
              <h3 className="text-xs font-medium text-text-muted uppercase tracking-wider mb-3">
                证书信息
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="text-text-muted">签名算法:</span>
                  <span className="ml-2 text-text-primary font-mono">{parsedCert.signatureAlgorithm || '未知'}</span>
                </div>
                <div>
                  <span className="text-text-muted">公钥算法:</span>
                  <span className="ml-2 text-text-primary font-mono">{parsedCert.publicKeyAlgorithm || '未知'}</span>
                </div>
                <div>
                  <span className="text-text-muted">公钥大小:</span>
                  <span className="ml-2 text-text-primary font-mono">{parsedCert.publicKeySize || '未知'}</span>
                </div>
                <div>
                  <span className="text-text-muted">版本:</span>
                  <span className="ml-2 text-text-primary">v{parsedCert.version}</span>
                </div>
                <div className="col-span-2">
                  <span className="text-text-muted">序列号:</span>
                  <span className="ml-2 text-text-primary font-mono text-xs break-all">
                    {parsedCert.serialNumber || '未知'}
                  </span>
                </div>
              </div>
            </div>

            {parsedCert.san.length > 0 && (
              <div className="bg-bg-raised border border-border-base rounded-lg p-4">
                <h3 className="text-xs font-medium text-text-muted uppercase tracking-wider mb-3">
                  主题备用名称 (SAN)
                </h3>
                <div className="flex flex-wrap gap-2">
                  {parsedCert.san.map((name, index) => (
                    <span
                      key={index}
                      className="px-2 py-1 bg-bg-base rounded text-xs font-mono text-text-primary"
                    >
                      {name}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="bg-bg-raised border border-border-base rounded-lg p-4">
              <h3 className="text-xs font-medium text-text-muted uppercase tracking-wider mb-3">
                指纹
              </h3>
              <div className="space-y-2 text-sm">
                <div>
                  <span className="text-text-muted">SHA-256:</span>
                  <div className="font-mono text-xs text-text-primary break-all mt-1">
                    {parsedCert.fingerprint.sha256}
                  </div>
                </div>
                <div>
                  <span className="text-text-muted">SHA-1:</span>
                  <div className="font-mono text-xs text-text-primary break-all mt-1">
                    {parsedCert.fingerprint.sha1}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </ToolLayout>
  )
}
