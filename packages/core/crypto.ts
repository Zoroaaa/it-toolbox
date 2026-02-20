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

export async function generateSshKeyPair(type: 'ed25519' | 'rsa' = 'ed25519'): Promise<Result<SshKeyPair>> {
  try {
    let keyPair: CryptoKeyPair
    
    if (type === 'ed25519') {
      keyPair = await crypto.subtle.generateKey({ name: 'Ed25519' } as unknown as EcKeyGenParams, true, ['sign', 'verify'])
    } else {
      keyPair = await crypto.subtle.generateKey({
        name: 'RSASSA-PKCS1-v1_5',
        modulusLength: 4096,
        publicExponent: new Uint8Array([1, 0, 1]),
        hash: 'SHA-256',
      }, true, ['sign', 'verify'])
    }
    
    const publicKeyBuffer = await crypto.subtle.exportKey('spki', keyPair.publicKey)
    const privateKeyBuffer = await crypto.subtle.exportKey('pkcs8', keyPair.privateKey)
    
    const publicKeyBase64 = btoa(String.fromCharCode(...new Uint8Array(publicKeyBuffer)))
    const privateKeyBase64 = btoa(String.fromCharCode(...new Uint8Array(privateKeyBuffer)))
    
    const publicKey = `ssh-${type === 'ed25519' ? 'ed25519' : 'rsa'} ${publicKeyBase64} generated@it-toolbox`
    const privateKey = `-----BEGIN OPENSSH PRIVATE KEY-----\n${privateKeyBase64.match(/.{1,64}/g)!.join('\n')}\n-----END OPENSSH PRIVATE KEY-----`
    
    const fingerprintBuffer = await crypto.subtle.digest('SHA-256', new Uint8Array(publicKeyBuffer))
    const fingerprint = btoa(String.fromCharCode(...new Uint8Array(fingerprintBuffer)))
    
    return {
      ok: true,
      value: { publicKey, privateKey, fingerprint: `SHA256:${fingerprint}` },
    }
  } catch (e) {
    return { ok: false, error: (e as Error).message }
  }
}
