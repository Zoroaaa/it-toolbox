import { describe, it, expect } from 'vitest'
import {
  parseUrl,
  searchHttpStatus,
  searchHttpHeaders,
  searchMimeTypes,
  calculateSubnet,
  convertCurl,
  HTTP_STATUS_CODES,
  HTTP_HEADERS,
  MIME_TYPES,
} from '@core/network'
import { parseUserAgent } from '@core/network-ua'

const ok = <T,>(r: { ok: true; value: T } | { ok: false; error: string }): T => {
  if (!r.ok) throw new Error(r.error)
  return r.value
}

describe('URL 解析', () => {
  it('拆分全部组成部分', () => {
    const url = ok(parseUrl('https://user:pass@example.com:8443/a/b?x=1&y=2#top'))
    expect(url).toMatchObject({
      protocol: 'https:',
      username: 'user',
      password: 'pass',
      hostname: 'example.com',
      port: '8443',
      pathname: '/a/b',
      search: '?x=1&y=2',
      hash: '#top',
    })
    expect(url.params).toEqual({ x: '1', y: '2' })
  })

  it('默认端口为空', () => {
    expect(ok(parseUrl('https://example.com/')).port).toBe('')
  })

  it('非法 URL 返回错误', () => {
    expect(parseUrl('not a url').ok).toBe(false)
    expect(parseUrl('').ok).toBe(false)
  })
})

describe('速查表检索', () => {
  it.each([
    ['404', 404],
    ['not found', 404],
    ['500', 500],
    ['timeout', 408],
  ])('searchHttpStatus(%s)', (query, code) => {
    expect(searchHttpStatus(query).some((s) => s.code === code)).toBe(true)
  })

  it('HTTP 状态码表覆盖 5 个类别', () => {
    const categories = new Set(HTTP_STATUS_CODES.map((s) => s.category))
    expect(categories.size).toBe(5)
  })

  it.each([
    ['cookie', 'Cookie'],
    ['Content-Type', 'Content-Type'],
    ['security', 'Content-Security-Policy'],
  ])('searchHttpHeaders(%s)', (query, name) => {
    expect(searchHttpHeaders(query).some((h) => h.name === name)).toBe(true)
  })

  it('请求头表非空且分类合法', () => {
    expect(HTTP_HEADERS.length).toBeGreaterThan(10)
    expect(new Set(HTTP_HEADERS.map((h) => h.category)).size).toBe(4)
  })

  it.each([
    ['.json', 'application/json'],
    ['image/png', '.png'],
    ['Markdown', '.md'],
  ])('searchMimeTypes(%s)', (query, expected) => {
    const results = searchMimeTypes(query)
    expect(results.some((m) => m.extension === expected || m.mimeType === expected)).toBe(true)
  })

  it('MIME 表覆盖常见类型', () => {
    expect(MIME_TYPES.length).toBeGreaterThan(20)
    expect(MIME_TYPES.some((m) => m.mimeType === 'text/html')).toBe(true)
  })
})

describe('子网计算', () => {
  it('/24 网络与可用主机', () => {
    const result = ok(calculateSubnet('192.168.1.10', 24))
    expect(result).toMatchObject({
      networkAddress: '192.168.1.0',
      broadcastAddress: '192.168.1.255',
      firstHost: '192.168.1.1',
      lastHost: '192.168.1.254',
      subnetMask: '255.255.255.0',
      totalHosts: 256,
      usableHosts: 254,
    })
  })

  it.each([
    ['10.0.0.1', 8, '10.0.0.0', '10.255.255.255'],
    ['172.16.5.4', 16, '172.16.0.0', '172.16.255.255'],
    ['192.168.1.7', 30, '192.168.1.4', '192.168.1.7'],
  ])('%s/%i 网络地址与广播地址', (ip, cidr, network, broadcast) => {
    const result = ok(calculateSubnet(ip, cidr))
    expect(result.networkAddress).toBe(network)
    expect(result.broadcastAddress).toBe(broadcast)
  })

  it('/31 与 /32 不扣减可用主机', () => {
    expect(ok(calculateSubnet('10.0.0.0', 31)).usableHosts).toBe(2)
    expect(ok(calculateSubnet('10.0.0.1', 32)).usableHosts).toBe(1)
  })

  it.each([
    ['256.1.1.1', 24],
    ['1.2.3', 24],
    ['1.2.3.4', 33],
    ['1.2.3.4', -1],
  ])('非法输入 %s/%i', (ip, cidr) => {
    expect(calculateSubnet(ip, cidr).ok).toBe(false)
  })
})

describe('User-Agent', () => {
  it('识别 Chrome / Windows', () => {
    const ua = parseUserAgent(
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    )
    expect(ua.browser.name).toBe('Chrome')
    expect(ua.os.name).toBe('Windows')
    expect(ua.device.type).toBe('desktop')
  })

  it('识别 iPhone Safari', () => {
    const ua = parseUserAgent(
      'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
    )
    expect(ua.os.name).toBe('iOS')
    expect(ua.device.type).toBe('mobile')
  })

  it('空字符串不抛错', () => {
    expect(() => parseUserAgent('')).not.toThrow()
  })
})

describe('cURL 转换', () => {
  it('生成多种语言代码', () => {
    const result = ok(convertCurl('curl https://api.example.com/users'))
    expect(result.fetch).toContain('https://api.example.com/users')
    expect(result.axios).toContain('axios')
    expect(result.python).toContain('requests')
    expect(result.go).toContain('http')
    expect(result.php).toContain('curl')
  })

  it('解析 POST 方法与 body', () => {
    const result = ok(
      convertCurl("curl -X POST https://api.example.com/users -H 'Content-Type: application/json' -d '{\"a\":1}'"),
    )
    expect(result.fetch.toUpperCase()).toContain('POST')
    expect(result.fetch).toContain('application/json')
  })

  it.each([
    ['wget https://a.com', 'must start with'],
    ['curl', 'Could not find URL'],
  ])('非法命令 %s', (cmd, message) => {
    const result = convertCurl(cmd)
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.error).toContain(message)
  })
})
