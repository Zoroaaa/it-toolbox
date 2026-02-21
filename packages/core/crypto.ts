import { Result } from './common'

export type HashAlgorithm = 'MD5' | 'SHA-1' | 'SHA-256' | 'SHA-384' | 'SHA-512'

async function hashText(algorithm: string, input: string): Promise<Result<string>> {
  try {
    const bytes = new TextEncoder().encode(input)
    const hashBuffer = await crypto.subtle.digest(algorithm as AlgorithmIdentifier, bytes)
    const hashArray = Array.from(new Uint8Array(hashBuffer))
    const hex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
    return { ok: true, value: hex }
  } catch (e) {
    return { ok: false, error: (e as Error).message }
  }
}

export async function sha1(input: string): Promise<Result<string>> {
  return hashText('SHA-1', input)
}

export async function sha256(input: string): Promise<Result<string>> {
  return hashText('SHA-256', input)
}

export async function sha384(input: string): Promise<Result<string>> {
  return hashText('SHA-384', input)
}

export async function sha512(input: string): Promise<Result<string>> {
  return hashText('SHA-512', input)
}

export async function hashFile(algorithm: string, file: File): Promise<Result<string>> {
  try {
    const buffer = await file.arrayBuffer()
    const hashBuffer = await crypto.subtle.digest(algorithm as AlgorithmIdentifier, buffer)
    const hashArray = Array.from(new Uint8Array(hashBuffer))
    const hex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
    return { ok: true, value: hex }
  } catch (e) {
    return { ok: false, error: (e as Error).message }
  }
}

export function md5(input: string): Result<string> {
  try {
    const bytes = new TextEncoder().encode(input)
    const result = md5Bytes(bytes)
    return { ok: true, value: result }
  } catch (e) {
    return { ok: false, error: (e as Error).message }
  }
}

function md5Bytes(bytes: Uint8Array): string {
  const K = new Uint32Array([
    0xd76aa478, 0xe8c7b756, 0x242070db, 0xc1bdceee,
    0xf57c0faf, 0x4787c62a, 0xa8304613, 0xfd469501,
    0x698098d8, 0x8b44f7af, 0xffff5bb1, 0x895cd7be,
    0x6b901122, 0xfd987193, 0xa679438e, 0x49b40821,
    0xf61e2562, 0xc040b340, 0x265e5a51, 0xe9b6c7aa,
    0xd62f105d, 0x02441453, 0xd8a1e681, 0xe7d3fbc8,
    0x21e1cde6, 0xc33707d6, 0xf4d50d87, 0x455a14ed,
    0xa9e3e905, 0xfcefa3f8, 0x676f02d9, 0x8d2a4c8a,
    0xfffa3942, 0x8771f681, 0x6d9d6122, 0xfde5380c,
    0xa4beea44, 0x4bdecfa9, 0xf6bb4b60, 0xbebfbc70,
    0x289b7ec6, 0xeaa127fa, 0xd4ef3085, 0x04881d05,
    0xd9d4d039, 0xe6db99e5, 0x1fa27cf8, 0xc4ac5665,
    0xf4292244, 0x432aff97, 0xab9423a7, 0xfc93a039,
    0x655b59c3, 0x8f0ccc92, 0xffeff47d, 0x85845dd1,
    0x6fa87e4f, 0xfe2ce6e0, 0xa3014314, 0x4e0811a1,
    0xf7537e82, 0xbd3af235, 0x2ad7d2bb, 0xeb86d391,
  ])

  const S = new Uint8Array([
    7, 12, 17, 22, 7, 12, 17, 22, 7, 12, 17, 22, 7, 12, 17, 22,
    5, 9, 14, 20, 5, 9, 14, 20, 5, 9, 14, 20, 5, 9, 14, 20,
    4, 11, 16, 23, 4, 11, 16, 23, 4, 11, 16, 23, 4, 11, 16, 23,
    6, 10, 15, 21, 6, 10, 15, 21, 6, 10, 15, 21, 6, 10, 15, 21,
  ])

  const padLen = bytes.length + 9
  const padBytes = ((padLen + 63) & ~63) - padLen + 8
  const totalLen = bytes.length + 1 + padBytes + 8
  const data = new Uint8Array(totalLen)
  data.set(bytes)
  data[bytes.length] = 0x80
  const view = new DataView(data.buffer)
  view.setUint32(totalLen - 8, bytes.length * 8, true)

  let a0 = 0x67452301
  let b0 = 0xefcdab89
  let c0 = 0x98badcfe
  let d0 = 0x10325476

  for (let offset = 0; offset < totalLen; offset += 64) {
    const M = new Uint32Array(16)
    for (let i = 0; i < 16; i++) {
      M[i] = view.getUint32(offset + i * 4, true)
    }

    let A = a0, B = b0, C = c0, D = d0

    for (let i = 0; i < 64; i++) {
      let F: number, g: number
      if (i < 16) {
        F = (B & C) | (~B & D)
        g = i
      } else if (i < 32) {
        F = (D & B) | (~D & C)
        g = (5 * i + 1) % 16
      } else if (i < 48) {
        F = B ^ C ^ D
        g = (3 * i + 5) % 16
      } else {
        F = C ^ (B | ~D)
        g = (7 * i) % 16
      }
      F = (F + A + K[i] + M[g]) >>> 0
      A = D
      D = C
      C = B
      B = (B + leftRotate(F, S[i])) >>> 0
    }

    a0 = (a0 + A) >>> 0
    b0 = (b0 + B) >>> 0
    c0 = (c0 + C) >>> 0
    d0 = (d0 + D) >>> 0
  }

  const result = new Uint8Array(16)
  const resultView = new DataView(result.buffer)
  resultView.setUint32(0, a0, true)
  resultView.setUint32(4, b0, true)
  resultView.setUint32(8, c0, true)
  resultView.setUint32(12, d0, true)

  return Array.from(result).map(b => b.toString(16).padStart(2, '0')).join('')
}

function leftRotate(x: number, c: number): number {
  return ((x << c) | (x >>> (32 - c))) >>> 0
}

export interface JwtPayload {
  header: Record<string, unknown>
  payload: Record<string, unknown>
  signature: string
  raw: {
    header: string
    payload: string
    signature: string
  }
  isExpired: boolean
  expiresAt?: Date
  issuedAt?: Date
}

export function parseJwt(token: string): Result<JwtPayload> {
  try {
    const parts = token.trim().split('.')
    if (parts.length !== 3) {
      return { ok: false, error: 'Invalid JWT format: must have 3 parts' }
    }

    const decode = (str: string) => {
      const padded = str.replace(/-/g, '+').replace(/_/g, '/').padEnd(str.length + (4 - str.length % 4) % 4, '=')
      return JSON.parse(atob(padded))
    }

    const header = decode(parts[0])
    const payload = decode(parts[1])

    let isExpired = false
    let expiresAt: Date | undefined
    let issuedAt: Date | undefined

    if (payload.exp) {
      expiresAt = new Date(payload.exp * 1000)
      isExpired = expiresAt < new Date()
    }
    if (payload.iat) {
      issuedAt = new Date(payload.iat * 1000)
    }

    return {
      ok: true,
      value: {
        header,
        payload,
        signature: parts[2],
        raw: {
          header: parts[0],
          payload: parts[1],
          signature: parts[2],
        },
        isExpired,
        expiresAt,
        issuedAt,
      }
    }
  } catch (e) {
    return { ok: false, error: 'Failed to parse JWT: ' + (e as Error).message }
  }
}

export async function deriveKey(password: string, salt: Uint8Array): Promise<CryptoKey> {
  const encoder = new TextEncoder()
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(password),
    'PBKDF2',
    false,
    ['deriveBits', 'deriveKey']
  )
  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt as BufferSource,
      iterations: 100000,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  )
}

export async function aesEncrypt(plaintext: string, password: string): Promise<Result<string>> {
  try {
    const encoder = new TextEncoder()
    const salt = crypto.getRandomValues(new Uint8Array(16))
    const iv = crypto.getRandomValues(new Uint8Array(12))
    const key = await deriveKey(password, salt)
    
    const encrypted = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      key,
      encoder.encode(plaintext)
    )
    
    const combined = new Uint8Array(salt.length + iv.length + encrypted.byteLength)
    combined.set(salt, 0)
    combined.set(iv, salt.length)
    combined.set(new Uint8Array(encrypted), salt.length + iv.length)
    
    const base64 = btoa(String.fromCharCode(...combined))
    return { ok: true, value: base64 }
  } catch (e) {
    return { ok: false, error: (e as Error).message }
  }
}

export async function aesDecrypt(ciphertext: string, password: string): Promise<Result<string>> {
  try {
    const combined = Uint8Array.from(atob(ciphertext), c => c.charCodeAt(0))
    const salt = combined.slice(0, 16)
    const iv = combined.slice(16, 28)
    const data = combined.slice(28)
    
    const key = await deriveKey(password, salt)
    const decrypted = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv },
      key,
      data
    )
    
    return { ok: true, value: new TextDecoder().decode(decrypted) }
  } catch (e) {
    return { ok: false, error: 'Decryption failed: ' + (e as Error).message }
  }
}

export interface RsaKeyPair {
  publicKey: string
  privateKey: string
  publicKeyJwk: JsonWebKey
  privateKeyJwk: JsonWebKey
}

export async function generateRsaKeyPair(modulusLength: 2048 | 4096 = 2048): Promise<Result<RsaKeyPair>> {
  try {
    const keyPair = await crypto.subtle.generateKey(
      {
        name: 'RSA-OAEP',
        modulusLength,
        publicExponent: new Uint8Array([1, 0, 1]),
        hash: 'SHA-256',
      },
      true,
      ['encrypt', 'decrypt']
    )
    
    const publicKeyBuffer = await crypto.subtle.exportKey('spki', keyPair.publicKey)
    const privateKeyBuffer = await crypto.subtle.exportKey('pkcs8', keyPair.privateKey)
    
    const publicKey = `-----BEGIN PUBLIC KEY-----\n${btoa(String.fromCharCode(...new Uint8Array(publicKeyBuffer))).match(/.{1,64}/g)!.join('\n')}\n-----END PUBLIC KEY-----`
    const privateKey = `-----BEGIN PRIVATE KEY-----\n${btoa(String.fromCharCode(...new Uint8Array(privateKeyBuffer))).match(/.{1,64}/g)!.join('\n')}\n-----END PRIVATE KEY-----`
    
    const publicKeyJwk = await crypto.subtle.exportKey('jwk', keyPair.publicKey)
    const privateKeyJwk = await crypto.subtle.exportKey('jwk', keyPair.privateKey)
    
    return {
      ok: true,
      value: { publicKey, privateKey, publicKeyJwk, privateKeyJwk },
    }
  } catch (e) {
    return { ok: false, error: (e as Error).message }
  }
}

export async function hmacSha256(message: string, secret: string): Promise<Result<string>> {
  try {
    const encoder = new TextEncoder()
    const key = await crypto.subtle.importKey(
      'raw',
      encoder.encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    )
    const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(message))
    const hex = Array.from(new Uint8Array(signature))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('')
    return { ok: true, value: hex }
  } catch (e) {
    return { ok: false, error: (e as Error).message }
  }
}

export async function hmacSha512(message: string, secret: string): Promise<Result<string>> {
  try {
    const encoder = new TextEncoder()
    const key = await crypto.subtle.importKey(
      'raw',
      encoder.encode(secret),
      { name: 'HMAC', hash: 'SHA-512' },
      false,
      ['sign']
    )
    const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(message))
    const hex = Array.from(new Uint8Array(signature))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('')
    return { ok: true, value: hex }
  } catch (e) {
    return { ok: false, error: (e as Error).message }
  }
}

export interface SshKeyPair {
  publicKey: string
  privateKey: string
  fingerprint: string
}

// SSH wire-format helpers
function sshWriteUint32(n: number): Uint8Array {
  return new Uint8Array([(n >>> 24) & 0xff, (n >>> 16) & 0xff, (n >>> 8) & 0xff, n & 0xff])
}

function sshWriteString(s: string): Uint8Array {
  const bytes = new TextEncoder().encode(s)
  const len = sshWriteUint32(bytes.length)
  const out = new Uint8Array(len.length + bytes.length)
  out.set(len, 0); out.set(bytes, len.length)
  return out
}

function sshWriteBytes(bytes: Uint8Array): Uint8Array {
  const len = sshWriteUint32(bytes.length)
  const out = new Uint8Array(len.length + bytes.length)
  out.set(len, 0); out.set(bytes, len.length)
  return out
}

function concat(...arrays: Uint8Array[]): Uint8Array {
  const total = arrays.reduce((s, a) => s + a.length, 0)
  const out = new Uint8Array(total)
  let offset = 0
  for (const a of arrays) { out.set(a, offset); offset += a.length }
  return out
}

function encodeBase64(bytes: Uint8Array): string {
  return btoa(String.fromCharCode(...bytes))
}

async function buildEd25519Keys(keyPair: CryptoKeyPair): Promise<{ publicKey: string; privateKey: string; fingerprint: string }> {
  // Export raw 32-byte public key
  const rawPub = new Uint8Array(await crypto.subtle.exportKey('raw', keyPair.publicKey))
  // Export pkcs8 private key - ed25519 pkcs8 contains the 32-byte seed at offset 16
  const pkcs8  = new Uint8Array(await crypto.subtle.exportKey('pkcs8', keyPair.privateKey))
  // PKCS8 for ed25519: SEQUENCE > SEQUENCE > BIT STRING > OCTET STRING (seed)
  // The 32-byte seed starts at offset 16 in most implementations
  const seed = pkcs8.slice(pkcs8.length - 32)

  // SSH public key wire format: string("ssh-ed25519") + string(pubkey_bytes)
  const pubWire = concat(sshWriteString('ssh-ed25519'), sshWriteBytes(rawPub))
  const publicKey = `ssh-ed25519 ${encodeBase64(pubWire)} generated@it-toolbox`

  // Fingerprint = SHA-256 of the wire-format public key bytes, base64
  const fpBuf = await crypto.subtle.digest('SHA-256', pubWire)
  const fingerprint = `SHA256:${encodeBase64(new Uint8Array(fpBuf))}`

  // OpenSSH private key format
  const keyType = sshWriteString('ssh-ed25519')
  const pubSection = sshWriteBytes(rawPub)
  // private section: seed+pubkey (64 bytes)
  const privSection = sshWriteBytes(concat(seed, rawPub))
  const comment = sshWriteString('generated@it-toolbox')
  const checkInt = crypto.getRandomValues(new Uint8Array(4))
  const checkIntU32 = new DataView(checkInt.buffer).getUint32(0)
  const checkBytes = sshWriteUint32(checkIntU32)

  const privateBlock = concat(
    checkBytes, checkBytes, // check ints (same value repeated)
    keyType, pubSection, privSection, comment
  )
  // Pad to 8-byte boundary
  const padded = new Uint8Array(Math.ceil(privateBlock.length / 8) * 8)
  padded.set(privateBlock)
  for (let i = privateBlock.length; i < padded.length; i++) padded[i] = (i - privateBlock.length + 1) & 0xff

  const header = new TextEncoder().encode('openssh-key-v1\0')
  const cipherNone = sshWriteString('none')
  const kdfNone    = sshWriteString('none')
  const kdfOptions = sshWriteBytes(new Uint8Array(0))
  const numKeys    = sshWriteUint32(1)
  const pubKeyBlob = sshWriteBytes(pubWire)

  const privatePayload = concat(header, cipherNone, kdfNone, kdfOptions, numKeys, pubKeyBlob, sshWriteBytes(padded))
  const privateKeyB64  = encodeBase64(privatePayload).match(/.{1,70}/g)!.join('\n')
  const privateKey     = `-----BEGIN OPENSSH PRIVATE KEY-----\n${privateKeyB64}\n-----END OPENSSH PRIVATE KEY-----`

  return { publicKey, privateKey, fingerprint }
}

async function buildRsaKeys(modulusLength: number): Promise<{ publicKey: string; privateKey: string; fingerprint: string }> {
  const keyPair = await crypto.subtle.generateKey({
    name: 'RSASSA-PKCS1-v1_5',
    modulusLength,
    publicExponent: new Uint8Array([1, 0, 1]),
    hash: 'SHA-256',
  }, true, ['sign', 'verify'])

  // Export SPKI for public key then extract modulus and exponent for SSH format
  const spkiBuf = new Uint8Array(await crypto.subtle.exportKey('spki', keyPair.publicKey))
  const pkcs8Buf = new Uint8Array(await crypto.subtle.exportKey('pkcs8', keyPair.privateKey))

  // For SSH RSA public key we need to extract modulus (n) and exponent (e) from SPKI
  // SPKI structure: SEQUENCE { SEQUENCE { OID rsaEncryption, NULL }, BIT STRING { SEQUENCE { INTEGER n, INTEGER e } } }
  // Parse just enough to get the RSA public key SEQUENCE
  function parseDerLen(data: Uint8Array, offset: number): { len: number; next: number } {
    const b = data[offset]
    if (!(b & 0x80)) return { len: b, next: offset + 1 }
    const nb = b & 0x7f; let len = 0
    for (let i = 0; i < nb; i++) len = (len << 8) | data[offset + 1 + i]
    return { len, next: offset + 1 + nb }
  }

  // Skip SEQUENCE (SEQUENCE OID NULL) to get to BIT STRING
  let pos = 1 // skip outer SEQUENCE tag
  const { len: outerLen, next: afterOuterLen } = parseDerLen(spkiBuf, pos)
  pos = afterOuterLen
  // Skip algorithm SEQUENCE
  pos++ // tag
  const { len: algLen, next: afterAlgLen } = parseDerLen(spkiBuf, pos)
  pos = afterAlgLen + algLen
  // Now at BIT STRING
  pos++ // tag
  const { next: afterBsLen } = parseDerLen(spkiBuf, pos)
  pos = afterBsLen
  pos++ // skip unused bits byte
  // Now at SEQUENCE { INTEGER n, INTEGER e }
  pos++ // skip SEQUENCE tag
  const { next: afterRsaSeqLen } = parseDerLen(spkiBuf, pos)
  pos = afterRsaSeqLen
  // INTEGER n
  pos++ // tag
  const { len: nLen, next: afterNLen } = parseDerLen(spkiBuf, pos)
  const n = spkiBuf.slice(afterNLen, afterNLen + nLen)
  pos = afterNLen + nLen
  // INTEGER e
  pos++ // tag
  const { len: eLen, next: afterELen } = parseDerLen(spkiBuf, pos)
  const e = spkiBuf.slice(afterELen, afterELen + eLen)

  // SSH RSA public key wire format: string("ssh-rsa") + mpint(e) + mpint(n)
  // mpint: big-endian bytes, with leading 0x00 if high bit set
  function mpint(bytes: Uint8Array): Uint8Array {
    // Remove leading zeros
    let start = 0; while (start < bytes.length - 1 && bytes[start] === 0) start++
    const trimmed = bytes.slice(start)
    // Add leading zero if high bit is set
    const needPad = trimmed[0] & 0x80
    const b = needPad ? concat(new Uint8Array([0]), trimmed) : trimmed
    return sshWriteBytes(b)
  }

  const pubWire = concat(sshWriteString('ssh-rsa'), mpint(e), mpint(n))
  const publicKey = `ssh-rsa ${encodeBase64(pubWire)} generated@it-toolbox`

  const fpBuf = await crypto.subtle.digest('SHA-256', pubWire)
  const fingerprint = `SHA256:${encodeBase64(new Uint8Array(fpBuf))}`

  // Private key as OpenSSH PEM (using PKCS8 as fallback - widely supported)
  const privB64 = encodeBase64(pkcs8Buf).match(/.{1,64}/g)!.join('\n')
  const privateKey = `-----BEGIN PRIVATE KEY-----\n${privB64}\n-----END PRIVATE KEY-----`

  void outerLen // suppress unused warning

  return { publicKey, privateKey, fingerprint }
}

export async function generateSshKeyPair(type: 'ed25519' | 'rsa' = 'ed25519'): Promise<Result<SshKeyPair>> {
  try {
    if (type === 'ed25519') {
      // Ed25519 requires Chrome 113+, Firefox 119+, Safari 17+
      if (!crypto.subtle.generateKey.toString().includes('native')) {
        // Check for Ed25519 support
      }
      const keyPair = await crypto.subtle.generateKey(
        { name: 'Ed25519' } as unknown as EcKeyGenParams,
        true,
        ['sign', 'verify']
      )
      const keys = await buildEd25519Keys(keyPair)
      return { ok: true, value: keys }
    } else {
      const keys = await buildRsaKeys(4096)
      return { ok: true, value: keys }
    }
  } catch (e) {
    const msg = (e as Error).message
    if (msg.includes('Ed25519') || msg.includes('algorithm')) {
      return { ok: false, error: 'Ed25519 需要 Chrome 113+、Firefox 119+ 或 Safari 17+，请升级浏览器或改用 RSA 密钥。' }
    }
    return { ok: false, error: msg }
  }
}
