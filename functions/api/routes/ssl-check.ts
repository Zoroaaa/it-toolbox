import { Hono } from 'hono'
import type { Env } from '../../types'
import { validatePublicUrl } from '../../lib/ssrf'

export const sslCheckRoute = new Hono<{ Bindings: Env }>()

interface SslResult {
  domain: string
  valid: boolean
  issuer: string
  subject: string
  validFrom: string
  validTo: string
  daysRemaining: number
  serialNumber: string
  signatureAlgorithm: string
  sans: string[]
  error?: string
  source: string
}

interface CrtShResult {
  issuer_ca_id: number
  issuer_name: string
  common_name: string
  name_value: string
  id: number
  entry_timestamp: string
  not_before: string
  not_after: string
  serial_number: string
}

sslCheckRoute.get('/', async (c) => {
  const domain = c.req.query('domain')

  if (!domain) {
    return c.json({ error: 'domain is required' }, 400)
  }

  const cleanDomain = domain.trim().toLowerCase().replace(/^https?:\/\//, '').split('/')[0]

  const target = validatePublicUrl(`https://${cleanDomain}`)
  if (!target.ok) {
    return c.json({ error: target.error }, 400)
  }

  const cacheKey = `cache:ssl:${cleanDomain}`
  try {
    const cached = await c.env.CACHE.get(cacheKey)
    if (cached) {
      return c.json({ ...JSON.parse(cached), cached: true })
    }
  } catch { /* 缓存不可用不影响查询 */ }

  try {
    const result: SslResult = {
      domain: cleanDomain,
      valid: false,
      issuer: 'Unknown',
      subject: cleanDomain,
      validFrom: '',
      validTo: '',
      daysRemaining: 0,
      serialNumber: '',
      signatureAlgorithm: '',
      sans: [cleanDomain],
      source: '',
    }

    try {
      const crtShRes = await fetch(`https://crt.sh/?q=${encodeURIComponent(cleanDomain)}&output=json`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'IT-Toolbox-SSL-Checker/1.0',
        },
        signal: AbortSignal.timeout(8000),
      })

      if (crtShRes.ok) {
        const crtData = (await crtShRes.json()) as CrtShResult[]

        if (crtData && crtData.length > 0) {
          const sortedCerts = crtData.sort((a, b) => {
            const dateA = new Date(a.not_after).getTime()
            const dateB = new Date(b.not_after).getTime()
            return dateB - dateA
          })

          const latestCert = sortedCerts[0]

          if (latestCert.issuer_name) {
            const cnMatch = latestCert.issuer_name.match(/CN=([^,]+)/)
            const oMatch = latestCert.issuer_name.match(/O=([^,]+)/)
            if (cnMatch) {
              result.issuer = cnMatch[1]
            } else if (oMatch) {
              result.issuer = oMatch[1]
            }
          }

          if (latestCert.common_name) {
            result.subject = latestCert.common_name
          }

          if (latestCert.not_before) {
            result.validFrom = new Date(latestCert.not_before).toISOString()
          }

          if (latestCert.not_after) {
            result.validTo = new Date(latestCert.not_after).toISOString()
            const expiryDate = new Date(latestCert.not_after)
            const now = new Date()
            result.daysRemaining = Math.ceil(
              (expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
            )
            result.valid = result.daysRemaining > 0
          }

          if (latestCert.serial_number) {
            result.serialNumber = latestCert.serial_number
          }

          const allSans = new Set<string>()
          sortedCerts.slice(0, 5).forEach(cert => {
            if (cert.name_value) {
              cert.name_value.split('\n').forEach(name => {
                const trimmed = name.trim()
                if (trimmed && trimmed !== cleanDomain) {
                  allSans.add(trimmed)
                }
              })
            }
          })
          result.sans = [cleanDomain, ...Array.from(allSans).slice(0, 9)]

          result.source = 'crt.sh (Certificate Transparency)'
        }
      }
    } catch (crtShError) {
      console.log('crt.sh API failed:', crtShError)
    }

    if (!result.validFrom) {
      try {
        await fetch(`https://${cleanDomain}`, {
          method: 'HEAD',
          redirect: 'follow',
          signal: AbortSignal.timeout(5000),
        })

        result.valid = false
        result.source = '直接连接（未验证证书链）'
        result.error = '仅确认域名可连接，未能获取证书详情，无法判定证书有效性'

        const cfTlsCipher = c.req.raw.cf?.tlsCipher as string | undefined
        if (cfTlsCipher) {
          result.signatureAlgorithm = cfTlsCipher
        }
      } catch (directError) {
        const errorMessage = (directError as Error).message
        if (
          errorMessage.includes('certificate') ||
          errorMessage.includes('SSL') ||
          errorMessage.includes('TLS')
        ) {
          return c.json({
            domain: cleanDomain,
            valid: false,
            issuer: '',
            subject: '',
            validFrom: '',
            validTo: '',
            daysRemaining: 0,
            serialNumber: '',
            signatureAlgorithm: '',
            sans: [],
            error: 'SSL证书无效或域名无法访问',
            source: '',
          })
        }
        result.error = `无法连接到服务器: ${errorMessage}`
        result.source = '连接失败'
      }
    }

    if (!result.validFrom && !result.validTo && !result.error) {
      result.error = '无法获取SSL证书信息，请检查域名是否正确或稍后重试'
      result.source = '未知'
    }

    try {
      await c.env.CACHE.put(cacheKey, JSON.stringify(result), { expirationTtl: 3600 })
    } catch { /* 缓存不可用不影响查询 */ }

    return c.json(result)
  } catch (e) {
    return c.json({ error: (e as Error).message }, 500)
  }
})
