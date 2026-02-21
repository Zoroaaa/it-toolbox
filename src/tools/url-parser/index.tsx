import { useState, useMemo } from 'react'
import { Copy, Check } from 'lucide-react'
import { ToolLayout } from '@/components/tool/ToolLayout'
import { meta } from './meta'
import { parseUrl } from '@it-toolbox/core'

export default function UrlParser() {
  const [input, setInput] = useState('')
  const [copiedField, setCopiedField] = useState<string | null>(null)

  const parsed = useMemo(() => {
    if (!input.trim()) return null
    return parseUrl(input)
  }, [input])

  const copyField = async (field: string, value: string) => {
    await navigator.clipboard.writeText(value)
    setCopiedField(field)
    setTimeout(() => setCopiedField(null), 2000)
  }

  const reset = () => {
    setInput('')
  }

  const renderField = (label: string, field: string, value: string | undefined) => {
    if (!value) return null
    return (
      <div className="flex items-center justify-between py-2 border-b border-border-base last:border-0">
        <span className="text-sm text-text-muted">{label}</span>
        <div className="flex items-center gap-2">
          <code className="text-sm text-text-primary font-mono bg-bg-base px-2 py-0.5 rounded max-w-xs truncate">
            {value}
          </code>
          <button
            onClick={() => copyField(field, value)}
            className="text-text-muted hover:text-text-primary transition-colors"
          >
            {copiedField === field ? (
              <Check className="w-4 h-4 text-green-400" />
            ) : (
              <Copy className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>
    )
  }

  return (
    <ToolLayout meta={meta} onReset={reset}>
      <div className="mb-4">
        <label className="text-xs font-medium text-text-muted uppercase tracking-wider block mb-2">
          输入 URL
        </label>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="https://example.com/path?query=value#hash"
          className="tool-input font-mono"
        />
      </div>

      <div className="space-y-4 overflow-y-auto max-h-[calc(100vh-16rem)]">
        {parsed && parsed.ok && (
          <>
            <div className="bg-bg-raised border border-border-base rounded-lg p-4">
              <h3 className="text-xs font-medium text-text-muted uppercase tracking-wider mb-3">
                基本信息
              </h3>
              <div className="space-y-0">
                {renderField('完整 URL', 'href', parsed.value.href)}
                {renderField('协议', 'protocol', parsed.value.protocol)}
                {renderField('来源', 'origin', parsed.value.origin)}
                {renderField('主机', 'host', parsed.value.host)}
                {renderField('主机名', 'hostname', parsed.value.hostname)}
                {renderField('端口', 'port', parsed.value.port || undefined)}
                {renderField('路径', 'pathname', parsed.value.pathname)}
                {renderField('查询字符串', 'search', parsed.value.search || undefined)}
                {renderField('片段', 'hash', parsed.value.hash || undefined)}
                {renderField('用户名', 'username', parsed.value.username || undefined)}
                {renderField('密码', 'password', parsed.value.password || undefined)}
              </div>
            </div>

            {Object.keys(parsed.value.params).length > 0 && (
              <div className="bg-bg-raised border border-border-base rounded-lg p-4">
                <h3 className="text-xs font-medium text-text-muted uppercase tracking-wider mb-3">
                  查询参数
                </h3>
                <div className="space-y-0">
                  {Object.entries(parsed.value.params).map(([key, value]) => (
                    <div
                      key={key}
                      className="flex items-center justify-between py-2 border-b border-border-base last:border-0"
                    >
                      <code className="text-sm text-accent font-mono">{key}</code>
                      <div className="flex items-center gap-2">
                        <code className="text-sm text-text-primary font-mono bg-bg-base px-2 py-0.5 rounded max-w-xs truncate">
                          {value}
                        </code>
                        <button
                          onClick={() => copyField(`param-${key}`, value)}
                          className="text-text-muted hover:text-text-primary transition-colors"
                        >
                          {copiedField === `param-${key}` ? (
                            <Check className="w-4 h-4 text-green-400" />
                          ) : (
                            <Copy className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="bg-bg-raised border border-border-base rounded-lg p-4">
              <h3 className="text-xs font-medium text-text-muted uppercase tracking-wider mb-3">
                JSON 格式
              </h3>
              <pre className="text-xs font-mono text-text-primary bg-bg-base p-3 rounded overflow-x-auto">
                {JSON.stringify(parsed.value, null, 2)}
              </pre>
            </div>
          </>
        )}

        {parsed && !parsed.ok && (
          <div className="bg-rose-500/10 border border-rose-500/30 rounded-lg p-4">
            <p className="text-sm text-rose-400">{parsed.error}</p>
          </div>
        )}

        {!parsed && (
          <div className="bg-bg-raised border border-border-base rounded-lg p-6 text-center text-text-muted">
            请输入一个有效的 URL
          </div>
        )}
      </div>
    </ToolLayout>
  )
}
