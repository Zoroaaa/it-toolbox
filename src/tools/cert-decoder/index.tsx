import { useState, useCallback } from 'react'
import { Upload, AlertCircle, CheckCircle, ShieldCheck, ShieldAlert } from 'lucide-react'
import { ToolLayout } from '@/components/tool/ToolLayout'
import { useClipboard } from '@/hooks/useClipboard'
import { meta } from './meta'

// ─── ASN.1 DER Parser ────────────────────────────────────────────────────────

interface AsnNode {
  tag: number
  cls: number
  constructed: boolean
  value: Uint8Array
  children: AsnNode[]
}

function parseAsn1(data: Uint8Array, offset = 0): { node: AsnNode; consumed: number } {
  const tagByte = data[offset]
  const cls = (tagByte & 0xc0) >> 6
  const constructed = !!(tagByte & 0x20)
  let tag = tagByte & 0x1f
  let idx = offset + 1

  if (tag === 0x1f) {
    tag = 0
    while (data[idx] & 0x80) { tag = (tag << 7) | (data[idx++] & 0x7f) }
    tag = (tag << 7) | (data[idx++] & 0x7f)
  }

  let length = data[idx++]
  if (length & 0x80) {
    const lenBytes = length & 0x7f
    length = 0
    for (let i = 0; i < lenBytes; i++) length = (length << 8) | data[idx++]
  }

  const value = data.slice(idx, idx + length)
  const headerSize = idx - offset
  const children: AsnNode[] = []

  if (constructed) {
    let pos = 0
    while (pos < value.length) {
      try {
        const { node, consumed } = parseAsn1(value, pos)
        children.push(node)
        pos += consumed
      } catch { break }
    }
  }

  return { node: { tag, cls, constructed, value, children }, consumed: headerSize + length }
}

function asnOid(bytes: Uint8Array): string {
  const parts: number[] = [Math.floor(bytes[0] / 40), bytes[0] % 40]
  let val = 0
  for (let i = 1; i < bytes.length; i++) {
    val = (val << 7) | (bytes[i] & 0x7f)
    if (!(bytes[i] & 0x80)) { parts.push(val); val = 0 }
  }
  return parts.join('.')
}

function asnStr(node: AsnNode): string {
  if (node.tag === 0x1e) {
    let s = ''
    for (let i = 0; i < node.value.length - 1; i += 2)
      s += String.fromCharCode((node.value[i] << 8) | node.value[i + 1])
    return s
  }
  return new TextDecoder('utf-8').decode(node.value)
}

function asnDate(node: AsnNode): string {
  const s = new TextDecoder().decode(node.value)
  if (s.length === 13) {
    const yy = parseInt(s.slice(0, 2))
    const year = yy >= 50 ? 1900 + yy : 2000 + yy
    return `${year}-${s.slice(2, 4)}-${s.slice(4, 6)} ${s.slice(6, 8)}:${s.slice(8, 10)}:${s.slice(10, 12)} UTC`
  }
  return `${s.slice(0, 4)}-${s.slice(4, 6)}-${s.slice(6, 8)} ${s.slice(8, 10)}:${s.slice(10, 12)}:${s.slice(12, 14)} UTC`
}

function asnHex(bytes: Uint8Array): string {
  return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join(':').toUpperCase()
}

const OID: Record<string, string> = {
  '2.5.4.3': 'CN', '2.5.4.6': 'C', '2.5.4.7': 'L', '2.5.4.8': 'ST',
  '2.5.4.10': 'O', '2.5.4.11': 'OU', '2.5.4.5': 'serialNumber',
  '1.2.840.113549.1.1.1': 'rsaEncryption',
  '1.2.840.113549.1.1.5': 'sha1WithRSAEncryption',
  '1.2.840.113549.1.1.11': 'sha256WithRSAEncryption',
  '1.2.840.113549.1.1.12': 'sha384WithRSAEncryption',
  '1.2.840.113549.1.1.13': 'sha512WithRSAEncryption',
  '1.2.840.10045.2.1': 'ecPublicKey',
  '1.2.840.10045.4.3.2': 'ecdsa-with-SHA256',
  '1.2.840.10045.4.3.3': 'ecdsa-with-SHA384',
  '1.2.840.10045.4.3.4': 'ecdsa-with-SHA512',
  '1.3.14.3.2.26': 'sha1', '2.16.840.1.101.3.4.2.1': 'sha256',
  '2.5.29.17': 'subjectAltName', '2.5.29.19': 'basicConstraints',
  '2.5.29.15': 'keyUsage', '2.5.29.37': 'extKeyUsage',
  '1.2.840.10045.3.1.7': 'prime256v1 (P-256)',
  '1.3.132.0.34': 'secp384r1 (P-384)', '1.3.132.0.35': 'secp521r1 (P-521)',
}

function parseRdn(seq: AsnNode): Record<string, string> {
  const result: Record<string, string> = {}
  for (const rdn of seq.children) {
    for (const atv of rdn.children) {
      if (atv.children.length >= 2) {
        const oidStr = asnOid(atv.children[0].value)
        result[OID[oidStr] ?? oidStr] = asnStr(atv.children[1])
      }
    }
  }
  return result
}

interface ParsedCert {
  subject: Record<string, string>
  issuer: Record<string, string>
  serialNumber: string
  notBefore: string
  notAfter: string
  isExpired: boolean
  signatureAlgorithm: string
  publicKeyAlgorithm: string
  publicKeySize: string
  san: string[]
  fingerprint: { sha256: string; sha1: string }
  version: number
  isCA: boolean
}

async function parsePem(pem: string): Promise<ParsedCert> {
  const b64 = pem.replace(/-----[^-]+-----/g, '').replace(/\s/g, '')
  if (!b64) throw new Error('空证书内容')
  const bin = Uint8Array.from(atob(b64), c => c.charCodeAt(0))

  const fp256 = await crypto.subtle.digest('SHA-256', bin)
  const fp1   = await crypto.subtle.digest('SHA-1', bin)
  const toFP  = (b: ArrayBuffer) =>
    Array.from(new Uint8Array(b)).map(x => x.toString(16).padStart(2, '0')).join(':').toUpperCase()

  const { node: root } = parseAsn1(bin)
  if (root.children.length < 3) throw new Error('证书结构不完整')

  const tbs    = root.children[0]
  const sigAlgSeq = root.children[1]

  let idx = 0
  let version = 1
  if (tbs.children[idx]?.cls === 2 && tbs.children[idx]?.tag === 0) {
    version = (tbs.children[idx].children[0]?.value[0] ?? 0) + 1
    idx++
  }

  const serialBytes = tbs.children[idx++]?.value ?? new Uint8Array()
  const serialNumber = asnHex(serialBytes[0] === 0 ? serialBytes.slice(1) : serialBytes)

  idx++ // inner sig alg

  const issuer   = parseRdn(tbs.children[idx++])
  const validity = tbs.children[idx++]
  const notBefore = asnDate(validity.children[0])
  const notAfter  = asnDate(validity.children[1])
  const subject  = parseRdn(tbs.children[idx++])
  const spki     = tbs.children[idx++]

  const pubAlgOid = asnOid(spki.children[0]?.children[0]?.value ?? new Uint8Array())
  const publicKeyAlgorithm = OID[pubAlgOid] ?? pubAlgOid
  let publicKeySize = ''

  if (pubAlgOid === '1.2.840.113549.1.1.1') {
    // RSA: bit-string -> nested SEQUENCE -> INTEGER (modulus)
    const bitStr = spki.children[1]?.value ?? new Uint8Array()
    try {
      const { node: rsaKey } = parseAsn1(bitStr.slice(1)) // skip unused-bits byte
      const mod = rsaKey.children[0]?.value ?? new Uint8Array()
      const bits = (mod.length - (mod[0] === 0 ? 1 : 0)) * 8
      publicKeySize = `${bits} bit`
    } catch { /* ignore */ }
  } else if (pubAlgOid === '1.2.840.10045.2.1') {
    const curveOid = asnOid(spki.children[0]?.children[1]?.value ?? new Uint8Array())
    publicKeySize = OID[curveOid] ?? curveOid
  }

  const sigOid = asnOid(sigAlgSeq.children[0]?.value ?? new Uint8Array())
  const signatureAlgorithm = OID[sigOid] ?? sigOid

  // Extensions
  const san: string[] = []
  let isCA = false
  const extWrapper = tbs.children.find(n => n.cls === 2 && n.tag === 3)
  if (extWrapper?.children[0]) {
    for (const ext of extWrapper.children[0].children) {
      const oidStr = asnOid(ext.children[0]?.value ?? new Uint8Array())
      const valOctet = ext.children[ext.children.length - 1]
      if (valOctet?.tag !== 0x04) continue
      const { node: inner } = parseAsn1(valOctet.value)

      if (oidStr === '2.5.29.17') {
        for (const name of inner.children) {
          if (name.tag === 2) san.push('DNS:' + new TextDecoder().decode(name.value))
          else if (name.tag === 7 && name.value.length === 4) san.push('IP:' + Array.from(name.value).join('.'))
          else if (name.tag === 7 && name.value.length === 16) {
            // IPv6
            const parts = []
            for (let i = 0; i < 16; i += 2)
              parts.push(((name.value[i] << 8) | name.value[i + 1]).toString(16))
            san.push('IP:' + parts.join(':'))
          }
          else if (name.tag === 1) san.push('email:' + new TextDecoder().decode(name.value))
        }
      } else if (oidStr === '2.5.29.19') {
        isCA = inner.children[0]?.value[0] === 0xff
      }
    }
  }

  return {
    subject, issuer, serialNumber, notBefore, notAfter,
    isExpired: new Date(notAfter) < new Date(),
    signatureAlgorithm, publicKeyAlgorithm, publicKeySize,
    san, fingerprint: { sha256: toFP(fp256), sha1: toFP(fp1) },
    version, isCA,
  }
}

// ─── UI ──────────────────────────────────────────────────────────────────────

function Row({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex gap-3 py-2 border-b border-border-base last:border-0">
      <span className="text-xs text-text-muted w-28 shrink-0 pt-0.5">{label}</span>
      <span className={`text-xs text-text-primary break-all ${mono ? 'font-mono' : ''}`}>{value || '—'}</span>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-bg-surface rounded-lg border border-border-base p-3">
      <p className="text-xs font-semibold text-text-primary mb-2 uppercase tracking-wider">{title}</p>
      {children}
    </div>
  )
}

export default function CertDecoder() {
  const [input, setInput]   = useState('')
  const [cert, setCert]     = useState<ParsedCert | null>(null)
  const [error, setError]   = useState('')
  const [loading, setLoading] = useState(false)
  const { copy, copied }    = useClipboard()

  const parse = useCallback(async () => {
    const trimmed = input.trim()
    if (!trimmed) { setCert(null); setError(''); return }
    setLoading(true); setError('')
    try {
      setCert(await parsePem(trimmed))
    } catch (e) {
      setError('解析失败：' + (e as Error).message)
      setCert(null)
    } finally { setLoading(false) }
  }, [input])

  const reset = () => { setInput(''); setCert(null); setError('') }

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return
    const r = new FileReader()
    r.onload = ev => { setInput(ev.target?.result as string); setCert(null) }
    r.readAsText(file)
  }

  return (
    <ToolLayout meta={meta} onReset={reset}>
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <label className="text-xs font-medium text-text-muted uppercase tracking-wider">PEM 证书</label>
            <label className="btn-ghost text-xs cursor-pointer">
              <Upload className="w-3.5 h-3.5" /> 上传文件
              <input type="file" accept=".pem,.crt,.cer,.der" className="hidden" onChange={handleFile} />
            </label>
          </div>
          <textarea
            className="tool-input font-mono text-xs h-40 resize-none"
            placeholder="粘贴 PEM 格式证书 (-----BEGIN CERTIFICATE-----...)"
            value={input}
            onChange={e => { setInput(e.target.value); setCert(null) }}
            spellCheck={false}
          />
          <button onClick={parse} disabled={loading || !input.trim()} className="btn-primary self-start">
            {loading ? '解析中...' : '解析证书'}
          </button>
        </div>

        {error && (
          <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 flex gap-2 text-xs text-rose-400">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />{error}
          </div>
        )}

        {cert && (
          <div className="flex flex-col gap-3">
            <div className={`flex items-center gap-3 p-3 rounded-lg border ${
              cert.isExpired ? 'bg-rose-500/10 border-rose-500/30' : 'bg-emerald-500/10 border-emerald-500/30'}`}>
              {cert.isExpired
                ? <ShieldAlert className="w-5 h-5 text-rose-400 shrink-0" />
                : <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0" />}
              <div>
                <p className={`text-sm font-medium ${cert.isExpired ? 'text-rose-400' : 'text-emerald-400'}`}>
                  {cert.isExpired ? '证书已过期' : '证书有效'}
                </p>
                <p className="text-xs text-text-muted">到期时间：{cert.notAfter}</p>
              </div>
            </div>

            <Section title="主题 (Subject)">
              {Object.entries(cert.subject).map(([k, v]) => <Row key={k} label={k} value={v} />)}
            </Section>

            <Section title="颁发者 (Issuer)">
              {Object.entries(cert.issuer).map(([k, v]) => <Row key={k} label={k} value={v} />)}
            </Section>

            <Section title="证书详情">
              <Row label="版本" value={`V${cert.version}`} />
              <Row label="序列号" value={cert.serialNumber} mono />
              <Row label="生效时间" value={cert.notBefore} />
              <Row label="到期时间" value={cert.notAfter} />
              <Row label="签名算法" value={cert.signatureAlgorithm} />
              <Row label="公钥算法" value={cert.publicKeyAlgorithm} />
              {cert.publicKeySize && <Row label="密钥大小" value={cert.publicKeySize} />}
              <Row label="CA 证书" value={cert.isCA ? '是' : '否'} />
            </Section>

            {cert.san.length > 0 && (
              <Section title={`SAN (${cert.san.length})`}>
                <div className="flex flex-wrap gap-1 pt-1">
                  {cert.san.map((s, i) => (
                    <span key={i} className="px-2 py-0.5 rounded bg-bg-raised text-xs font-mono text-text-secondary">{s}</span>
                  ))}
                </div>
              </Section>
            )}

            <Section title="指纹">
              {([['SHA-256', cert.fingerprint.sha256], ['SHA-1', cert.fingerprint.sha1]] as [string, string][]).map(([alg, fp]) => (
                <div key={alg} className="flex items-start gap-3 py-2 border-b border-border-base last:border-0">
                  <span className="text-xs text-text-muted w-14 shrink-0 pt-0.5">{alg}</span>
                  <span className="font-mono text-xs text-text-primary break-all flex-1">{fp}</span>
                  <button onClick={() => copy(fp)} className="btn-ghost text-xs shrink-0">
                    {copied ? <CheckCircle className="w-3.5 h-3.5 text-accent" /> : '复制'}
                  </button>
                </div>
              ))}
            </Section>
          </div>
        )}
      </div>
    </ToolLayout>
  )
}
