import { useMemo, useState } from 'react'
import { Cookie, ClipboardPaste, Trash2 } from 'lucide-react'
import { ToolLayout } from '@/components/tool/ToolLayout'
import { buildCookieHeader, parseCookies, type CookieAttribute } from '@core/cookie'
import { useAppStore } from '@/store/app'
import { meta } from './meta'

interface Row {
  id: number
  name: string
  value: string
  enabled: boolean
  source: 'set-cookie' | 'request'
  attributes: CookieAttribute[]
}

const SAMPLE = [
  'Set-Cookie: sid=abc123; Domain=example.com; Path=/; Expires=Wed, 21 Oct 2026 07:00:00 GMT; Max-Age=3600; SameSite=Lax; HttpOnly; Secure',
  'Set-Cookie: theme=dark; Path=/; SameSite=Lax',
  'Cookie: lang=zh-CN; tz=Asia/Shanghai',
].join('\n')

const ATTRIBUTE_HINT: Record<string, string> = {
  domain: '生效域名',
  path: '生效路径',
  expires: '过期时间',
  'max-age': '有效期（秒）',
  samesite: '跨站发送策略',
  httponly: '禁止 JS 读取',
  secure: '仅 HTTPS 发送',
  partitioned: '分区存储',
  priority: '优先级',
}

export default function CookieParser() {
  const [input, setInput] = useState('')
  const [rows, setRows] = useState<Row[]>([])
  const [error, setError] = useState('')
  const addRecentTool = useAppStore((s) => s.addRecentTool)

  const parse = (text: string) => {
    if (!input.trim() && text.trim()) addRecentTool(meta.id)
    setInput(text)
    if (!text.trim()) {
      setRows([])
      setError('')
      return
    }
    const result = parseCookies(text)
    if (!result.ok) {
      setRows([])
      setError(result.error)
      return
    }
    setError('')
    setRows(
      result.value.map((cookie, index) => ({
        id: index,
        name: cookie.name,
        value: cookie.value,
        enabled: true,
        source: cookie.source,
        attributes: cookie.attributes,
      })),
    )
  }

  const updateRow = (id: number, patch: Partial<Row>) => {
    setRows((prev) => prev.map((row) => (row.id === id ? { ...row, ...patch } : row)))
  }

  const removeRow = (id: number) => {
    setRows((prev) => prev.filter((row) => row.id !== id))
  }

  const header = useMemo(
    () => buildCookieHeader(rows.filter((row) => row.enabled)),
    [rows],
  )
  const outputValue = header ? `Cookie: ${header}` : ''

  const reset = () => {
    setInput('')
    setRows([])
    setError('')
  }

  const enabledCount = rows.filter((row) => row.enabled).length

  return (
    <ToolLayout meta={meta} onReset={reset} outputValue={outputValue}>
      <div className="flex flex-col gap-4">
        {/* 输入 */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <label className="text-xs text-text-muted">
              粘贴 Cookie 或 Set-Cookie 头（支持多行，每行一条）
            </label>
            <button
              onClick={() => {
                addRecentTool(meta.id)
                parse(SAMPLE)
              }}
              className="flex items-center gap-1.5 text-xs text-text-secondary hover:text-accent transition-colors"
            >
              <ClipboardPaste className="w-3.5 h-3.5" />
              填入示例
            </button>
          </div>
          <textarea
            value={input}
            onChange={(e) => parse(e.target.value)}
            placeholder={'Cookie: session=abc123; theme=dark\n或\nSet-Cookie: sid=abc; Path=/; HttpOnly; SameSite=Lax'}
            spellCheck={false}
            className="w-full h-40 p-3 rounded-xl bg-bg-surface border border-border-base font-mono text-xs text-text-primary resize-y focus:outline-none focus:border-accent"
          />
          {error && <p className="text-xs text-red-400">{error}</p>}
        </div>

        {/* 解析结果 */}
        {rows.length > 0 && (
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-text-secondary">
                解析出 {rows.length} 条，已启用 {enabledCount} 条
              </span>
              <span className="text-xs text-text-muted">取消勾选即从请求头中移除</span>
            </div>

            {rows.map((row) => (
              <div
                key={row.id}
                className="flex flex-col gap-2 p-3 bg-bg-surface border border-border-base rounded-lg"
              >
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={row.enabled}
                    onChange={(e) => updateRow(row.id, { enabled: e.target.checked })}
                    className="accent-[var(--color-accent)]"
                    aria-label={`启用 ${row.name}`}
                  />
                  <input
                    value={row.name}
                    onChange={(e) => updateRow(row.id, { name: e.target.value })}
                    className="w-40 px-2 py-1 rounded-md bg-bg-base border border-border-base font-mono text-xs text-text-primary focus:outline-none focus:border-accent"
                    aria-label="Cookie 名称"
                  />
                  <span className="text-text-muted text-xs">=</span>
                  <input
                    value={row.value}
                    onChange={(e) => updateRow(row.id, { value: e.target.value })}
                    className="flex-1 min-w-0 px-2 py-1 rounded-md bg-bg-base border border-border-base font-mono text-xs text-text-primary focus:outline-none focus:border-accent"
                    aria-label="Cookie 值"
                  />
                  <span
                    className={`px-2 py-0.5 rounded-md text-[11px] border flex-shrink-0 ${
                      row.source === 'set-cookie'
                        ? 'border-accent/30 bg-accent/10 text-accent'
                        : 'border-border-base bg-bg-raised text-text-muted'
                    }`}
                  >
                    {row.source === 'set-cookie' ? 'Set-Cookie' : '请求头'}
                  </span>
                  <button
                    onClick={() => removeRow(row.id)}
                    className="p-1 rounded-md hover:bg-bg-raised transition-colors flex-shrink-0"
                    title="删除"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-text-muted" />
                  </button>
                </div>

                {row.attributes.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pl-6">
                    {row.attributes.map((attr, index) => (
                      <span
                        key={`${attr.name}-${index}`}
                        title={ATTRIBUTE_HINT[attr.name.toLowerCase()] ?? '非标准属性，原样保留'}
                        className={`px-2 py-0.5 rounded-md text-[11px] font-mono border ${
                          attr.known
                            ? 'border-border-base bg-bg-raised text-text-secondary'
                            : 'border-red-500/40 bg-red-500/10 text-red-400'
                        }`}
                      >
                        {attr.name}
                        {attr.value ? `=${attr.value}` : ''}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* 生成结果 */}
        {rows.length > 0 && (
          <div className="flex flex-col gap-2">
            <label className="text-xs text-text-muted">生成的请求头</label>
            <pre className="p-3 rounded-xl bg-bg-surface border border-border-base font-mono text-xs text-text-primary whitespace-pre-wrap break-all">
              {outputValue || '（未启用任何 Cookie）'}
            </pre>
            <p className="text-xs text-text-muted flex items-center gap-1.5">
              <Cookie className="w-3.5 h-3.5" />
              内容仅在本地解析，不写入输入历史，也不会上传。
            </p>
          </div>
        )}
      </div>
    </ToolLayout>
  )
}
