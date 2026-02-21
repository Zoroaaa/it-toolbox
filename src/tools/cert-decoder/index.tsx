import { useState, useCallback } from 'react'
import { Upload, AlertCircle, CheckCircle, ShieldCheck, ShieldAlert, Copy, Check } from 'lucide-react'
import { X509Certificate, PublicKey } from '@peculiar/x509'
import { ToolLayout } from '@/components/tool/ToolLayout'
import { useClipboard } from '@/hooks/useClipboard'
import { useAppStore } from '@/store/app'
import { meta } from './meta'

const SAMPLE_PEM = `-----BEGIN CERTIFICATE-----
MIIBkTCB+wIJAJFDsCFAiD8sMA0GCSqGSIb3DQEBCwUAMBExDzANBgNVBAMMBnRl
c3RDQTAeFw0yNDAxMDEwMDAwMDBaFw0yNTAxMDEwMDAwMDBaMBExDzANBgNVBAMM
BnRlc3RDQTBcMA0GCSqGSIb3DQEBAQUAA0sAMEgCQQC7o4qne60TB3kfYbsRZZvO
dX6p1RGRJ0yYVjVKT3I4rdWi0cFCbRHf8T6GCEgMQcpEFHJMbfTTvdkE/WM4ELwF
AgMBAAGjIzAhMB8GA1UdEQQYMBaCCWxvY2FsaG9zdIIJbG9jYWxob3N0MA0GCSqG
SIb3DQEBCwUAA0EAGJxuUXwLcjf47zOGsGf0TLdN/P8oVbmWcUJ+XF0i1m9PBMBT
mE9NKPRZdKT3DfYl9GRlbRmCZ/1r2h9bqFo0kQ==
-----END CERTIFICATE-----`

interface CertInfo {
  subject: string
  issuer: string
  serialNumber: string
  notBefore: Date
  notAfter: Date
  sans: string[]
  keyAlgorithm: string
  keySize: number | null
  signatureAlgorithm: string
  fingerprint: { sha1: string; sha256: string }
  isCA: boolean
  isSelfSigned: boolean
  daysUntilExpiry: number
  isExpired: boolean
}

function formatDN(dn: string): string {
  return dn
    .split(',')
    .map(part => part.trim())
    .join('\n')
}

export default function CertDecoder() {
  const [input, setInput] = useState(SAMPLE_PEM)
  const [certInfo, setCertInfo] = useState<CertInfo | null>(null)
  const [error, setError] = useState('')
  const { copy, copied } = useClipboard()
  const { addRecentTool } = useAppStore()

  const handleParse = useCallback(async () => {
    if (!input.trim()) return
    addRecentTool(meta.id)
    setError('')
    setCertInfo(null)

    try {
      // @peculiar/x509 handles PEM, DER (as ArrayBuffer), and base64-encoded DER
      const cert = new X509Certificate(input.trim())

      // Extract Subject Alternative Names
      const sanExt = cert.getExtension('2.5.29.17')
      const sans: string[] = []
      if (sanExt) {
        // Parse SAN from the extension's textual value
        try {
          const sanText = sanExt.toString()
          const matches = sanText.matchAll(/(?:DNS|IP|Email|URI):([^,\n]+)/g)
          for (const m of matches) sans.push(m[0].trim())
        } catch {}
      }
      // Also check publicKey size
      let keySize: number | null = null
      try {
        const pub = cert.publicKey
        if (pub) {
          const spki = await crypto.subtle.importKey('spki', pub.rawData, { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' }, true, ['verify']).catch(() => null)
          if (spki) {
            const jwk = await crypto.subtle.exportKey('jwk', spki)
            if (jwk.n) keySize = (atob(jwk.n.replace(/-/g, '+').replace(/_/g, '/')).length) * 8
          }
        }
      } catch {}

      // Compute SHA-1 and SHA-256 fingerprints
      const derBuffer = cert.rawData
      const [sha1Buf, sha256Buf] = await Promise.all([
        crypto.subtle.digest('SHA-1', derBuffer),
        crypto.subtle.digest('SHA-256', derBuffer),
      ])
      const toHex = (buf: ArrayBuffer) =>
        Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join(':').toUpperCase()

      const now = new Date()
      const expiry = cert.notAfter
      const daysUntilExpiry = Math.floor((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))

      // Check if CA cert (basicConstraints)
      const bcExt = cert.getExtension('2.5.29.19')
      const isCA = bcExt ? bcExt.toString().includes('CA:TRUE') : false
      const isSelfSigned = cert.subject === cert.issuer

      const info: CertInfo = {
        subject: cert.subject,
        issuer: cert.issuer,
        serialNumber: cert.serialNumber,
        notBefore: cert.notBefore,
        notAfter: cert.notAfter,
        sans,
        keyAlgorithm: cert.publicKey?.algorithm?.name ?? 'Unknown',
        keySize,
        signatureAlgorithm: cert.signatureAlgorithm?.name ?? 'Unknown',
        fingerprint: { sha1: toHex(sha1Buf), sha256: toHex(sha256Buf) },
        isCA,
        isSelfSigned,
        daysUntilExpiry,
        isExpired: daysUntilExpiry < 0,
      }

      setCertInfo(info)
    } catch (e) {
      setError(e instanceof Error ? e.message : '证书解析失败，请检查 PEM 格式')
    }
  }, [input, addRecentTool])

  const handleFileUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = ev => setInput(ev.target?.result as string)
    reader.readAsText(file)
    e.target.value = ''
  }, [])

  const reset = () => { setInput(''); setCertInfo(null); setError('') }

  const statusColor = certInfo
    ? certInfo.isExpired ? 'text-red-400' : certInfo.daysUntilExpiry < 30 ? 'text-yellow-400' : 'text-green-400'
    : ''

  return (
    <ToolLayout meta={meta} onReset={reset}>
      <div className="flex flex-col gap-4">

        {/* Input */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-medium text-text-muted uppercase tracking-wider">PEM 证书 / DER Base64</label>
            <label className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-bg-raised hover:bg-bg-surface cursor-pointer text-xs text-text-secondary transition-colors">
              <Upload className="w-3 h-3" />上传文件
              <input type="file" accept=".pem,.crt,.cer,.der" className="hidden" onChange={handleFileUpload} />
            </label>
          </div>
          <textarea
            value={input}
            onChange={e => { setInput(e.target.value); setCertInfo(null); setError('') }}
            placeholder="-----BEGIN CERTIFICATE-----&#10;...&#10;-----END CERTIFICATE-----"
            rows={6}
            className="px-3 py-2.5 rounded-lg bg-bg-surface border border-border-base text-sm font-mono text-text-primary focus:outline-none focus:border-accent resize-none"
          />
        </div>

        {error && (
          <div className="flex items-start gap-2 bg-red-500/10 border border-red-500/30 rounded-lg p-3 text-red-400 text-sm">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />{error}
          </div>
        )}

        <button onClick={handleParse} disabled={!input.trim()}
          className="flex items-center justify-center gap-2 px-6 py-2.5 rounded-lg bg-accent text-bg-base font-medium text-sm hover:bg-accent/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
          <ShieldCheck className="w-4 h-4" />解析证书
        </button>

        {/* Result */}
        {certInfo && (
          <div className="flex flex-col gap-3">
            {/* Status banner */}
            <div className={`flex items-center gap-2 p-3 rounded-lg border ${
              certInfo.isExpired
                ? 'bg-red-500/10 border-red-500/30'
                : certInfo.daysUntilExpiry < 30
                  ? 'bg-yellow-500/10 border-yellow-500/30'
                  : 'bg-green-500/10 border-green-500/30'
            }`}>
              {certInfo.isExpired
                ? <ShieldAlert className="w-4 h-4 text-red-400" />
                : <ShieldCheck className="w-4 h-4 text-green-400" />}
              <span className={`text-sm font-medium ${statusColor}`}>
                {certInfo.isExpired
                  ? `证书已过期 ${Math.abs(certInfo.daysUntilExpiry)} 天`
                  : `证书有效，还有 ${certInfo.daysUntilExpiry} 天到期`}
              </span>
              {certInfo.isCA && <span className="ml-auto text-xs px-2 py-0.5 rounded bg-accent/20 text-accent">CA 证书</span>}
              {certInfo.isSelfSigned && <span className="text-xs px-2 py-0.5 rounded bg-yellow-500/20 text-yellow-400">自签名</span>}
            </div>

            {/* Main info grid */}
            <div className="grid grid-cols-2 gap-3">
              {[
                {
                  title: '📋 基本信息',
                  rows: [
                    { label: '序列号', value: certInfo.serialNumber, mono: true },
                    { label: '生效时间', value: certInfo.notBefore.toLocaleString('zh-CN') },
                    { label: '到期时间', value: certInfo.notAfter.toLocaleString('zh-CN') },
                    { label: '签名算法', value: certInfo.signatureAlgorithm, mono: true },
                    { label: '公钥算法', value: certInfo.keyAlgorithm + (certInfo.keySize ? ` (${certInfo.keySize} bit)` : ''), mono: true },
                  ]
                },
                {
                  title: '🔏 指纹',
                  rows: [
                    { label: 'SHA-1', value: certInfo.fingerprint.sha1, mono: true, small: true },
                    { label: 'SHA-256', value: certInfo.fingerprint.sha256, mono: true, small: true },
                  ]
                },
              ].map(section => (
                <div key={section.title} className="bg-bg-surface border border-border-base rounded-xl p-4">
                  <h3 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-3">{section.title}</h3>
                  <div className="flex flex-col gap-2">
                    {section.rows.map(row => (
                      <div key={row.label}>
                        <div className="text-xs text-text-muted mb-0.5">{row.label}</div>
                        <div className={`${row.mono ? 'font-mono' : ''} ${row.small ? 'text-xs' : 'text-sm'} text-text-primary break-all`}>{row.value}</div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Subject / Issuer */}
            <div className="grid grid-cols-2 gap-3">
              {[
                { title: '👤 使用者 (Subject)', dn: certInfo.subject },
                { title: '🏢 颁发者 (Issuer)', dn: certInfo.issuer },
              ].map(({ title, dn }) => (
                <div key={title} className="bg-bg-surface border border-border-base rounded-xl p-4">
                  <h3 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-3">{title}</h3>
                  <pre className="text-xs font-mono text-text-primary whitespace-pre-wrap break-all">{formatDN(dn)}</pre>
                </div>
              ))}
            </div>

            {/* SANs */}
            {certInfo.sans.length > 0 && (
              <div className="bg-bg-surface border border-border-base rounded-xl p-4">
                <h3 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-3">🌐 Subject Alternative Names ({certInfo.sans.length})</h3>
                <div className="flex flex-wrap gap-2">
                  {certInfo.sans.map(san => (
                    <span key={san} className="px-2 py-0.5 rounded-md bg-bg-raised border border-border-base font-mono text-xs text-text-primary">{san}</span>
                  ))}
                </div>
              </div>
            )}

            {/* Copy full JSON */}
            <button onClick={() => copy(JSON.stringify(certInfo, null, 2))}
              className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-bg-raised hover:bg-bg-surface border border-border-base text-sm text-text-secondary transition-colors">
              {copied ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
              复制完整 JSON
            </button>
          </div>
        )}
      </div>
    </ToolLayout>
  )
}
