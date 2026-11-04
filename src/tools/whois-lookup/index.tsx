import { useState, useCallback } from 'react'
import { Search, Globe, Calendar, User, Building, AlertCircle, Loader2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { ToolLayout } from '@/components/tool/ToolLayout'
import { useAppStore } from '@/store/app'
import { meta } from './meta'

interface WhoisResult {
  mode: 'domain' | 'ip'
  domain: string
  registrar?: string
  createdDate?: string
  updatedDate?: string
  expiryDate?: string
  status?: string[]
  nameservers?: string[]
  registrant?: {
    name?: string
    organization?: string
    country?: string
    email?: string
  }
  ip?: string
  country?: string
  region?: string
  city?: string
  isp?: string
  asn?: string
  raw?: string
  source?: string
  error?: string
}

export default function WhoisLookup() {
  const [domain, setDomain] = useState('')
  const [result, setResult] = useState<WhoisResult | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const addRecentTool = useAppStore((s) => s.addRecentTool)
  const { t } = useTranslation()

  const lookup = useCallback(async () => {
    if (!domain.trim()) return
    
    addRecentTool(meta.id)
    setIsLoading(true)
    setError('')
    setResult(null)
    
    try {
      const cleanDomain = domain.trim().toLowerCase().replace(/^https?:\/\//, '').split('/')[0]
      
      const response = await fetch(`/api/whois?domain=${encodeURIComponent(cleanDomain)}`)
      const data = await response.json()

      if (!response.ok || data.error) {
        setError(data.error ?? t('tools.whois-lookup.error'))
      } else {
        setResult(data)
      }
    } catch {
      setError(t('tools.whois-lookup.error'))
    }
    
    setIsLoading(false)
  }, [domain, addRecentTool, t])

  const reset = () => {
    setDomain('')
    setResult(null)
    setError('')
  }

  return (
    <ToolLayout meta={meta} onReset={reset}>
      <div className="flex items-center gap-2 mb-4">
        <div className="relative flex-1">
          <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
          <input
            type="text"
            value={domain}
            onChange={e => setDomain(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && lookup()}
            placeholder={t('tools.whois-lookup.placeholder')}
            className="w-full pl-10 pr-4 py-3 rounded-xl bg-bg-surface border border-border-base text-text-primary focus:outline-none focus:border-accent"
          />
        </div>
        <button onClick={lookup} disabled={isLoading || !domain.trim()} className="btn-primary">
          {isLoading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Search className="w-4 h-4" />
          )}
          {t('tools.whois-lookup.button')}
        </button>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center gap-2 mb-4">
          <AlertCircle className="w-4 h-4 text-rose-500" />
          <span className="text-sm text-rose-400">{error}</span>
        </div>
      )}

      {result && !error && (
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-accent/10 border border-accent/20">
            <div className="flex items-center gap-2">
              <Globe className="w-5 h-5 text-accent" />
              <span className="text-lg font-bold text-accent">{result.domain}</span>
              <span className="ml-auto text-xs text-text-muted">
                {result.mode === 'ip' ? t('tools.whois-lookup.modeIp') : t('tools.whois-lookup.modeDomain')}
                {result.source ? ` · ${result.source}` : ''}
              </span>
            </div>
          </div>

          {result.mode === 'ip' && (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {[
                { label: t('tools.whois-lookup.ip'), value: result.ip },
                { label: t('tools.whois-lookup.country'), value: result.country },
                { label: t('tools.whois-lookup.region'), value: result.region },
                { label: t('tools.whois-lookup.city'), value: result.city },
                { label: t('tools.whois-lookup.isp'), value: result.isp },
                { label: t('tools.whois-lookup.asn'), value: result.asn },
              ]
                .filter((item) => item.value)
                .map((item) => (
                  <div key={item.label} className="p-3 rounded-lg bg-bg-surface border border-border-base">
                    <div className="text-xs text-text-muted mb-1">{item.label}</div>
                    <div className="text-sm font-mono text-text-primary break-all">{item.value}</div>
                  </div>
                ))}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {result.registrar && (
              <div className="p-4 rounded-xl bg-bg-surface border border-border-base">
                <div className="flex items-center gap-2 mb-2">
                  <Building className="w-4 h-4 text-text-muted" />
                  <span className="text-xs text-text-muted uppercase">{t('tools.whois-lookup.registrar')}</span>
                </div>
                <p className="text-sm text-text-primary">{result.registrar}</p>
              </div>
            )}

            {result.registrant?.organization && (
              <div className="p-4 rounded-xl bg-bg-surface border border-border-base">
                <div className="flex items-center gap-2 mb-2">
                  <User className="w-4 h-4 text-text-muted" />
                  <span className="text-xs text-text-muted uppercase">{t('tools.whois-lookup.registrant')}</span>
                </div>
                <p className="text-sm text-text-primary">{result.registrant.organization}</p>
              </div>
            )}

            {result.createdDate && (
              <div className="p-4 rounded-xl bg-bg-surface border border-border-base">
                <div className="flex items-center gap-2 mb-2">
                  <Calendar className="w-4 h-4 text-text-muted" />
                  <span className="text-xs text-text-muted uppercase">{t('tools.whois-lookup.createdDate')}</span>
                </div>
                <p className="text-sm font-mono text-text-primary">{result.createdDate}</p>
              </div>
            )}

            {result.expiryDate && (
              <div className="p-4 rounded-xl bg-bg-surface border border-border-base">
                <div className="flex items-center gap-2 mb-2">
                  <Calendar className="w-4 h-4 text-text-muted" />
                  <span className="text-xs text-text-muted uppercase">{t('tools.whois-lookup.expiryDate')}</span>
                </div>
                <p className="text-sm font-mono text-text-primary">{result.expiryDate}</p>
              </div>
            )}
          </div>

          {result.nameservers && result.nameservers.length > 0 && (
            <div className="p-4 rounded-xl bg-bg-surface border border-border-base">
              <h3 className="text-xs text-text-muted uppercase mb-2">{t('tools.whois-lookup.nameservers')}</h3>
              <div className="flex flex-wrap gap-2">
                {result.nameservers.map((ns, i) => (
                  <span key={i} className="px-2 py-1 rounded bg-bg-raised text-xs font-mono text-text-primary">
                    {ns}
                  </span>
                ))}
              </div>
            </div>
          )}

          {result.status && result.status.length > 0 && (
            <div className="p-4 rounded-xl bg-bg-surface border border-border-base">
              <h3 className="text-xs text-text-muted uppercase mb-2">{t('tools.whois-lookup.status')}</h3>
              <div className="flex flex-wrap gap-2">
                {result.status.map((s, i) => (
                  <span key={i} className="px-2 py-1 rounded bg-accent/10 text-xs text-accent">
                    {s}
                  </span>
                ))}
              </div>
            </div>
          )}

          {result.raw && (
            <div className="p-4 rounded-xl bg-bg-surface border border-border-base">
              <h3 className="text-xs text-text-muted uppercase mb-2">{t('tools.whois-lookup.rawData')}</h3>
              <pre className="text-xs font-mono text-text-secondary whitespace-pre-wrap max-h-64 overflow-y-auto">
                {result.raw}
              </pre>
            </div>
          )}
        </div>
      )}

      {!result && !error && !isLoading && (
        <div className="h-48 rounded-xl bg-bg-raised border border-border-base flex items-center justify-center">
          <p className="text-text-muted text-sm">{t('tools.whois-lookup.placeholderText')}</p>
        </div>
      )}
    </ToolLayout>
  )
}
