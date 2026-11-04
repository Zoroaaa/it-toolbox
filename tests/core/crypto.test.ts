import { describe, it, expect } from 'vitest'
import {
  md5,
  sha1,
  sha256,
  sha384,
  sha512,
  hashFile,
  hmacSha256,
  hmacSha512,
  aesEncrypt,
  aesDecrypt,
  parseJwt,
  generateRsaKeyPair,
  generateSshKeyPair,
} from '@core/crypto'

const value = async <T,>(p: Promise<{ ok: true; value: T } | { ok: false; error: string }>): Promise<T> => {
  const r = await p
  if (!r.ok) throw new Error(r.error)
  return r.value
}

const syncValue = <T,>(r: { ok: true; value: T } | { ok: false; error: string }): T => {
  if (!r.ok) throw new Error(r.error)
  return r.value
}

describe('MD5', () => {
  it.each([
    ['', 'd41d8cd98f00b204e9800998ecf8427e'],
    ['abc', '900150983cd24fb0d6963f7d28e17f72'],
    ['message digest', 'f96b697d7cb7938d525a2f31aaf161d0'],
    ['abcdefghijklmnopqrstuvwxyz', 'c3fcd3d76192e4007dfb496cca67e13b'],
  ])('md5(%s)', (input, expected) => {
    expect(syncValue(md5(input))).toBe(expected)
  })
})

describe('SHA 系列', () => {
  it('sha1 标准向量', async () => {
    expect(await value(sha1('abc'))).toBe('a9993e364706816aba3e25717850c26c9cd0d89d')
  })

  it('sha256 标准向量', async () => {
    expect(await value(sha256('abc'))).toBe(
      'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad',
    )
  })

  it('sha384 标准向量', async () => {
    expect(await value(sha384('abc'))).toBe(
      'cb00753f45a35e8bb5a03d699ac65007272c32ab0eded1631a8b605a43ff5bed8086072ba1e7cc2358baeca134c825a7',
    )
  })

  it('sha512 长度与标准向量', async () => {
    const hash = await value(sha512('abc'))
    expect(hash).toHaveLength(128)
    expect(hash.startsWith('ddaf35a193617aba')).toBe(true)
  })

  it('hashFile 与 sha256 一致', async () => {
    const file = new File(['abc'], 'a.txt')
    expect(await value(hashFile('SHA-256', file))).toBe(await value(sha256('abc')))
  })
})

describe('HMAC', () => {
  it('hmacSha256 标准向量', async () => {
    expect(await value(hmacSha256('The quick brown fox jumps over the lazy dog', 'key'))).toBe(
      'f7bc83f430538424b13298e6aa6fb143ef4d59a14946175997479dbc2d1a3cd8',
    )
  })

  it('hmacSha512 输出 128 位十六进制', async () => {
    expect(await value(hmacSha512('msg', 'secret'))).toHaveLength(128)
  })

  it('不同密钥产生不同签名', async () => {
    const a = await value(hmacSha256('msg', 'k1'))
    const b = await value(hmacSha256('msg', 'k2'))
    expect(a).not.toBe(b)
  })
})

describe('AES-GCM', () => {
  it('加密后可解密', async () => {
    const cipher = await value(aesEncrypt('hello 中文 🔐', 'p@ssw0rd'))
    expect(cipher).not.toContain('hello')
    expect(await value(aesDecrypt(cipher, 'p@ssw0rd'))).toBe('hello 中文 🔐')
  })

  it('每次加密盐值不同', async () => {
    const a = await value(aesEncrypt('same', 'pw'))
    const b = await value(aesEncrypt('same', 'pw'))
    expect(a).not.toBe(b)
  })

  it('错误密码解密失败', async () => {
    const cipher = await value(aesEncrypt('secret', 'right'))
    expect((await aesDecrypt(cipher, 'wrong')).ok).toBe(false)
  })

  it('非法密文返回错误', async () => {
    expect((await aesDecrypt('not-base64!!!', 'pw')).ok).toBe(false)
  })
})

describe('JWT 解析', () => {
  const b64url = (obj: unknown) =>
    btoa(JSON.stringify(obj)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')

  it('解析 header/payload 与时间字段', () => {
    const token = `${b64url({ alg: 'HS256', typ: 'JWT' })}.${b64url({
      sub: 'user-1',
      iat: 1700000000,
      exp: 4102444800,
    })}.sig`
    const result = syncValue(parseJwt(token))
    expect(result.header.alg).toBe('HS256')
    expect(result.payload.sub).toBe('user-1')
    expect(result.isExpired).toBe(false)
    expect(result.issuedAt?.getTime()).toBe(1700000000 * 1000)
  })

  it('识别已过期 token', () => {
    const token = `${b64url({ alg: 'HS256' })}.${b64url({ exp: 1 })}.sig`
    expect(syncValue(parseJwt(token)).isExpired).toBe(true)
  })

  it.each([
    ['only.two', 'Invalid JWT format'],
    ['a.b.c', 'Failed to parse JWT'],
  ])('非法 token %s 返回错误', (token, message) => {
    const result = parseJwt(token)
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.error).toContain(message)
  })
})

describe('密钥生成', () => {
  it('生成 RSA 2048 密钥对（PEM）', async () => {
    const pair = await value(generateRsaKeyPair(2048))
    expect(pair.publicKey).toContain('BEGIN PUBLIC KEY')
    expect(pair.privateKey).toContain('BEGIN PRIVATE KEY')
  }, 15000)

  it('生成 Ed25519 SSH 密钥对', async () => {
    const pair = await value(generateSshKeyPair('ed25519'))
    expect(pair.publicKey.startsWith('ssh-ed25519 ')).toBe(true)
    expect(pair.privateKey).toContain('BEGIN OPENSSH PRIVATE KEY')
  }, 15000)
})
