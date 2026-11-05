import { Hono } from 'hono'
import type { Env } from '../../types'
import { validatePublicUrl } from '../../lib/ssrf'

export const headersCheckRoute = new Hono<{ Bindings: Env }>()

interface HeaderCheck {
  name: string
  present: boolean
  value?: string
  recommendation: string
  severity: 'high' | 'medium' | 'low'
  pass: boolean
  scoreModifier: number
  result: string
}

interface HeadersResult {
  url: string
  headers: HeaderCheck[]
  score: number
  grade: string
  warnings: string[]
  source: string
  testsFailed: number
  testsPassed: number
  testsQuantity: number
}

const HEADER_DISPLAY_NAMES: Record<string, string> = {
  'content-security-policy': 'Content-Security-Policy',
  'strict-transport-security': 'Strict-Transport-Security',
  'x-content-type-options': 'X-Content-Type-Options',
  'x-frame-options': 'X-Frame-Options',
  'x-xss-protection': 'X-XSS-Protection',
  'referrer-policy': 'Referrer-Policy',
  'permissions-policy': 'Permissions-Policy',
  'cross-origin-opener-policy': 'Cross-Origin-Opener-Policy',
  'cross-origin-resource-policy': 'Cross-Origin-Resource-Policy',
  'cross-origin-embedder-policy': 'Cross-Origin-Embedder-Policy',
}

const HEADER_RECOMMENDATIONS: Record<string, string> = {
  'content-security-policy': '设置CSP限制资源加载来源，防止XSS攻击',
  'strict-transport-security': '启用HSTS强制HTTPS连接，建议设置max-age至少31536000秒',
  'x-content-type-options': '设置为nosniff防止MIME类型嗅探',
  'x-frame-options': '设置为DENY或SAMEORIGIN防止点击劫持',
  'x-xss-protection': '设置为1; mode=block启用XSS过滤器（现代浏览器中CSP更有效）',
  'referrer-policy': '设置为strict-origin-when-cross-origin控制Referrer信息',
  'permissions-policy': '限制浏览器功能访问（摄像头、麦克风、地理位置等）',
  'cross-origin-opener-policy': '设置为same-origin防止跨源信息泄露',
  'cross-origin-resource-policy': '设置为same-origin防止跨源资源加载',
  'cross-origin-embedder-policy': '设置为require-corp增强跨源隔离',
}

const HEADER_SEVERITY: Record<string, 'high' | 'medium' | 'low'> = {
  'content-security-policy': 'high',
  'strict-transport-security': 'high',
  'x-content-type-options': 'medium',
  'x-frame-options': 'medium',
  'x-xss-protection': 'low',
  'referrer-policy': 'low',
  'permissions-policy': 'medium',
  'cross-origin-opener-policy': 'medium',
  'cross-origin-resource-policy': 'medium',
  'cross-origin-embedder-policy': 'low',
}

const HEADER_SCORES: Record<string, number> = {
  'strict-transport-security': 20,
  'content-security-policy': 20,
  'x-content-type-options': 10,
  'x-frame-options': 10,
  'x-xss-protection': 5,
  'referrer-policy': 5,
  'permissions-policy': 10,
  'cross-origin-opener-policy': 10,
  'cross-origin-resource-policy': 10,
  'cross-origin-embedder-policy': 5,
}

headersCheckRoute.get('/', async (c) => {
  const url = c.req.query('url')

  if (!url) {
    return c.json({ error: 'url is required' }, 400)
  }

  let cleanUrl: string
  try {
    const raw = url.trim()
    const parsed = new URL(/^https?:\/\//i.test(raw) ? raw : `https://${raw}`)
    parsed.protocol = parsed.protocol.toLowerCase()
    parsed.hostname = parsed.hostname.toLowerCase()
    cleanUrl = parsed.toString()
  } catch {
    return c.json({ error: 'Invalid URL' }, 400)
  }

  const target = validatePublicUrl(cleanUrl)
  if (!target.ok) {
    return c.json({ error: target.error }, 400)
  }

  const cacheKey = `cache:headers:${cleanUrl}`
  try {
    const cached = await c.env.CACHE.get(cacheKey)
    if (cached) {
      return c.json({ ...JSON.parse(cached), cached: true })
    }
  } catch { /* 缓存不可用不影响检测 */ }

  try {
    const warnings: string[] = []
    const headers: HeaderCheck[] = []

    const res = await fetch(cleanUrl, {
      method: 'GET',
      redirect: 'follow',
      signal: AbortSignal.timeout(10000),
      headers: {
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
 
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      },
    })

    if (!res.ok) {
      return c.json({ error: `HTTP错误: ${res.status}` }, 500)
    }

    const allHeaders: Record<string, string> = {}
    res.headers.forEach((value, key) => {
      allHeaders[key.toLowerCase()] = value
    })

    let totalScore = 100
    const headerNames = [
      'strict-transport-security',
      'content-security-policy',
      'x-content-type-options',
      'x-frame-options',
      'x-xss-protection',
      'referrer-policy',
      'permissions-policy',
      'cross-origin-opener-policy',
      'cross-origin-resource-policy',
      'cross-origin-embedder-policy',
    ]

    for (const headerName of headerNames) {
      const headerValue = allHeaders[headerName]
      const isPresent = !!headerValue
      const maxScore = HEADER_SCORES[headerName] || 10

      const severity = HEADER_SEVERITY[headerName] || 'medium'

      
      if (!isPresent) {
        totalScore -= maxScore
      }

      let pass = isPresent
      let result = isPresent ? 'present' : 'missing'
      const recommendation = HEADER_RECOMMENDATIONS[headerName] || ''

      if (headerName === 'strict-transport-security' && headerValue) {
        const maxAgeMatch = headerValue.match(/max-age=(\d+)/i)
        if (maxAgeMatch) {
          const maxAge = parseInt(maxAgeMatch[1], 10)
          if (maxAge < 31536000) {
            warnings.push(`HSTS max-age值过小（${maxAge}秒），建议至少31536000秒（1年）`)
            totalScore -= 5
            pass = false
            result = 'hsts-max-age-too-small'
          }
        }
        if (!headerValue.toLowerCase().includes('includesubdomains')) {
          warnings.push('HSTS未包含includeSubDomains指令')
        }
      }

      
      if (headerName === 'content-security-policy' && headerValue) {
        if (headerValue.includes("'unsafe-inline'")) {
          warnings.push("CSP包含'unsafe-inline'，降低了XSS防护能力")
          totalScore -= 5
          pass = false
          result = 'csp-unsafe-inline'
        }
        if (headerValue.includes("'unsafe-eval'")) {
          warnings.push("CSP包含'unsafe-eval'，降低了XSS防护能力")
          totalScore -= 5
          pass = false
          result = 'csp-unsafe-eval'
        }
        if (headerValue.includes('*') && !headerValue.includes('*.')) {
          warnings.push('CSP使用通配符(*)，降低了安全性')
          totalScore -= 5
          pass = false
          result = 'csp-wildcard'
        }
      }

      if (headerName === 'x-frame-options' && headerValue) {
        const value = headerValue.toUpperCase()
        if (value !== 'DENY' && value !== 'SAMEORIGIN') {
          warnings.push(`X-Frame-Options值应为DENY或SAMEORIGIN，当前为${headerValue}`)
          totalScore -= 5
          pass = false
          result = 'x-frame-invalid'
        }
      }

      headers.push({
        name: HEADER_DISPLAY_NAMES[headerName] || headerName,
        present: isPresent,
        value: headerValue || undefined,
        recommendation,
        severity,
        pass,
        scoreModifier: isPresent ? maxScore : -maxScore,
        result,
      })
    }

    totalScore = Math.max(0, Math.min(100, totalScore))

    let grade = 'F'
    if (totalScore >= 95) grade = 'A+'
    else if (totalScore >= 90) grade = 'A'
    else if (totalScore >= 80) grade = 'B'
    else if (totalScore >= 70) grade = 'C'
    else if (totalScore >= 60) grade = 'D'
    else if (totalScore >= 50) grade = 'E'

    const passedCount = headers.filter(h => h.pass).length
    const failedCount = headers.filter(h => !h.pass).length

    const result: HeadersResult = {
      url: cleanUrl,
      headers,
      score: totalScore,
      grade,
      warnings,
      source: '本地检测',
      testsFailed: failedCount,
      testsPassed: passedCount,
      testsQuantity: headers.length,
    }

    try {
      await c.env.CACHE.put(cacheKey, JSON.stringify(result), { expirationTtl: 3600 })
    } catch { /* 缓存不可用不影响检测 */ }

    return c.json(result)
  } catch (e) {
    return c.json({ error: (e as Error).message }, 500)
  }
})
