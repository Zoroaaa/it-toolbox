import { useState, useMemo } from 'react'
import { Copy, Check } from 'lucide-react'
import { ToolLayout } from '@/components/tool/ToolLayout'
import { useClipboard } from '@/hooks/useClipboard'
import { meta } from './meta'

export default function HtaccessGen() {
  const [options, setOptions] = useState({
    forceHttps: false,
    wwwRedirect: 'none' as 'none' | 'www' | 'non-www',
    enableGzip: false,
    enableCache: false,
    cacheDuration: '1 month',
    preventHotlink: false,
    hotlinkDomains: '',
    blockBadBots: false,
    disableDirectoryListing: false,
    customHeaders: false,
    errorPages: false,
    customRules: '',
  })
  const { copy, copied } = useClipboard()

  const htaccess = useMemo(() => {
    let content = ''
    
    if (options.forceHttps) {
      content += `# Force HTTPS
RewriteEngine On
RewriteCond %{HTTPS} off
RewriteRule ^(.*)$ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]

`
    }
    
    if (options.wwwRedirect === 'www') {
      content += `# Redirect to www
RewriteEngine On
RewriteCond %{HTTP_HOST} !^www\\. [NC]
RewriteRule ^(.*)$ https://www.%{HTTP_HOST}/$1 [R=301,L]

`
    } else if (options.wwwRedirect === 'non-www') {
      content += `# Redirect to non-www
RewriteEngine On
RewriteCond %{HTTP_HOST} ^www\\.(.*)$ [NC]
RewriteRule ^(.*)$ https://%1/$1 [R=301,L]

`
    }
    
    if (options.disableDirectoryListing) {
      content += `# Disable directory listing
Options -Indexes

`
    }
    
    if (options.enableGzip) {
      content += `# Enable GZIP compression
<IfModule mod_deflate.c>
  AddOutputFilterByType DEFLATE text/html text/plain text/xml text/css text/javascript application/javascript application/json
</IfModule>

`
    }
    
    if (options.enableCache) {
      content += `# Browser caching
<IfModule mod_expires.c>
  ExpiresActive On
  ExpiresDefault "access plus ${options.cacheDuration}"
  ExpiresByType text/html "access plus 1 day"
  ExpiresByType text/css "access plus ${options.cacheDuration}"
  ExpiresByType application/javascript "access plus ${options.cacheDuration}"
  ExpiresByType image/jpeg "access plus 1 year"
  ExpiresByType image/png "access plus 1 year"
  ExpiresByType image/gif "access plus 1 year"
  ExpiresByType image/svg+xml "access plus 1 year"
  ExpiresByType image/webp "access plus 1 year"
  ExpiresByType font/woff "access plus 1 year"
  ExpiresByType font/woff2 "access plus 1 year"
</IfModule>

`
    }
    
    if (options.preventHotlink && options.hotlinkDomains) {
      const domains = options.hotlinkDomains.split('\n').filter(Boolean).join(' ')
      content += `# Prevent hotlinking
RewriteEngine On
RewriteCond %{HTTP_REFERER} !^$
RewriteCond %{HTTP_REFERER} !^http(s)?://(www\\.)?${domains.replace(/\s+/g, ' [NC,OR]\nRewriteCond %{HTTP_REFERER} !^http(s)?://(www\\.)?')} [NC]
RewriteRule \\.(jpg|jpeg|png|gif|webp|svg)$ - [F]

`
    }
    
    if (options.blockBadBots) {
      content += `# Block bad bots
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteCond %{HTTP_USER_AGENT} (MJ12bot|AhrefsBot|SemrushBot|DotBot|PetalBot) [NC]
  RewriteRule .* - [F]
</IfModule>

`
    }
    
    if (options.customHeaders) {
      content += `# Security headers
<IfModule mod_headers.c>
  Header always set X-Content-Type-Options "nosniff"
  Header always set X-Frame-Options "SAMEORIGIN"
  Header always set X-XSS-Protection "1; mode=block"
  Header always set Referrer-Policy "strict-origin-when-cross-origin"
  Header always set Content-Security-Policy "default-src 'self';"
</IfModule>

`
    }
    
    if (options.errorPages) {
      content += `# Custom error pages
ErrorDocument 400 /errors/400.html
ErrorDocument 401 /errors/401.html
ErrorDocument 403 /errors/403.html
ErrorDocument 404 /errors/404.html
ErrorDocument 500 /errors/500.html
ErrorDocument 502 /errors/502.html
ErrorDocument 503 /errors/503.html

`
    }
    
    if (options.customRules) {
      content += `# Custom rules
${options.customRules}

`
    }
    
    return content.trim() || '# 选择选项生成 .htaccess 规则'
  }, [options])

  const reset = () => {
    setOptions({
      forceHttps: false,
      wwwRedirect: 'none',
      enableGzip: false,
      enableCache: false,
      cacheDuration: '1 month',
      preventHotlink: false,
      hotlinkDomains: '',
      blockBadBots: false,
      disableDirectoryListing: false,
      customHeaders: false,
      errorPages: false,
      customRules: '',
    })
  }

  const toggleOption = (key: keyof typeof options) => {
    setOptions(prev => ({ ...prev, [key]: !prev[key] }))
  }

  return (
    <ToolLayout meta={meta} onReset={reset}>
      <div className="flex flex-col gap-4">
        <div className="grid grid-cols-2 gap-2">
          {[
            { key: 'forceHttps', label: '强制 HTTPS' },
            { key: 'enableGzip', label: '启用 GZIP 压缩' },
            { key: 'enableCache', label: '启用浏览器缓存' },
            { key: 'preventHotlink', label: '防盗链' },
            { key: 'blockBadBots', label: '屏蔽恶意爬虫' },
            { key: 'disableDirectoryListing', label: '禁用目录列表' },
            { key: 'customHeaders', label: '安全响应头' },
            { key: 'errorPages', label: '自定义错误页' },
          ].map(opt => (
            <label
              key={opt.key}
              className={`flex items-center gap-2 p-2 rounded-lg border cursor-pointer transition-colors ${
                options[opt.key as keyof typeof options]
                  ? 'bg-accent/10 border-accent'
                  : 'bg-bg-surface border-border-base hover:border-text-muted'
              }`}
            >
              <input
                type="checkbox"
                className="hidden"
                checked={options[opt.key as keyof typeof options] as boolean}
                onChange={() => toggleOption(opt.key as keyof typeof options)}
              />
              <span className={`w-4 h-4 rounded border flex items-center justify-center ${
                options[opt.key as keyof typeof options]
                  ? 'bg-accent border-accent'
                  : 'border-border-base'
              }`}>
                {options[opt.key as keyof typeof options] && <Check className="w-3 h-3 text-white" />}
              </span>
              <span className="text-xs">{opt.label}</span>
            </label>
          ))}
        </div>

        {options.wwwRedirect !== 'none' && (
          <div className="flex flex-col gap-2">
            <label className="text-xs font-medium text-text-muted uppercase tracking-wider">WWW 重定向</label>
            <select
              className="tool-input"
              value={options.wwwRedirect}
              onChange={e => setOptions(prev => ({ ...prev, wwwRedirect: e.target.value as typeof options.wwwRedirect }))}
            >
              <option value="none">不重定向</option>
              <option value="www">重定向到 www</option>
              <option value="non-www">重定向到非 www</option>
            </select>
          </div>
        )}

        {options.enableCache && (
          <div className="flex flex-col gap-2">
            <label className="text-xs font-medium text-text-muted uppercase tracking-wider">缓存时长</label>
            <select
              className="tool-input"
              value={options.cacheDuration}
              onChange={e => setOptions(prev => ({ ...prev, cacheDuration: e.target.value }))}
            >
              <option value="1 day">1 天</option>
              <option value="1 week">1 周</option>
              <option value="1 month">1 个月</option>
              <option value="3 months">3 个月</option>
              <option value="6 months">6 个月</option>
              <option value="1 year">1 年</option>
            </select>
          </div>
        )}

        {options.preventHotlink && (
          <div className="flex flex-col gap-2">
            <label className="text-xs font-medium text-text-muted uppercase tracking-wider">允许的域名（每行一个）</label>
            <textarea
              className="tool-input font-mono text-sm h-20 resize-none"
              placeholder="example.com&#10;www.example.com"
              value={options.hotlinkDomains}
              onChange={e => setOptions(prev => ({ ...prev, hotlinkDomains: e.target.value }))}
            />
          </div>
        )}

        <div className="flex flex-col gap-2">
          <label className="text-xs font-medium text-text-muted uppercase tracking-wider">自定义规则</label>
          <textarea
            className="tool-input font-mono text-sm h-20 resize-none"
            placeholder="添加自定义 .htaccess 规则..."
            value={options.customRules}
            onChange={e => setOptions(prev => ({ ...prev, customRules: e.target.value }))}
          />
        </div>

        <div className="bg-bg-surface rounded-lg border border-border-base overflow-hidden">
          <div className="px-4 py-2 bg-bg-raised border-b border-border-base flex items-center justify-between">
            <span className="text-xs font-medium text-text-muted uppercase tracking-wider">.htaccess</span>
            <button onClick={() => copy(htaccess)} className="btn-ghost text-xs gap-1">
              {copied ? <Check className="w-3.5 h-3.5 text-accent" /> : <Copy className="w-3.5 h-3.5" />}
              复制
            </button>
          </div>
          <pre className="p-4 font-mono text-xs text-text-primary overflow-auto max-h-64 whitespace-pre-wrap">{htaccess}</pre>
        </div>
      </div>
    </ToolLayout>
  )
}
