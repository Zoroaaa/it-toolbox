import { useState } from 'react'
import { GitCommit, Copy, Check } from 'lucide-react'
import { ToolLayout } from '@/components/tool/ToolLayout'
import { useAppStore } from '@/store/app'
import { useClipboard } from '@/hooks/useClipboard'
import { meta } from './meta'

const COMMIT_TYPES = [
  { type: 'feat', emoji: '✨', label: 'feat', desc: '新功能' },
  { type: 'fix', emoji: '🐛', label: 'fix', desc: '修复 Bug' },
  { type: 'docs', emoji: '📝', label: 'docs', desc: '文档修改' },
  { type: 'style', emoji: '💄', label: 'style', desc: '代码格式' },
  { type: 'refactor', emoji: '♻️', label: 'refactor', desc: '代码重构' },
  { type: 'perf', emoji: '⚡', label: 'perf', desc: '性能优化' },
  { type: 'test', emoji: '✅', label: 'test', desc: '添加测试' },
  { type: 'build', emoji: '🏗️', label: 'build', desc: '构建系统' },
  { type: 'ci', emoji: '🔧', label: 'ci', desc: 'CI 配置' },
  { type: 'chore', emoji: '🔨', label: 'chore', desc: '其他变更' },
  { type: 'revert', emoji: '⏪', label: 'revert', desc: '回滚提交' },
]

const COMMON_SCOPES = [
  'api', 'auth', 'ui', 'docs', 'config', 'deps', 'tests', 'build', 'core', 'utils', 'db', 'cache',
]

export default function ConventionalCommit() {
  const [type, setType] = useState('feat')
  const [scope, setScope] = useState('')
  const [breaking, setBreaking] = useState(false)
  const [description, setDescription] = useState('')
  const [body, setBody] = useState('')
  const [footer, setFooter] = useState('')
  const [showEmoji, setShowEmoji] = useState(true)
  const { addRecentTool } = useAppStore()
  const { copy, copied } = useClipboard()

  const selectedType = COMMIT_TYPES.find(t => t.type === type)!

  const buildCommit = (): string => {
    if (!description.trim()) return ''

    const prefix = showEmoji ? `${selectedType.emoji} ` : ''
    const scopePart = scope.trim() ? `(${scope.trim()})` : ''
    const breakingMark = breaking ? '!' : ''
    const header = `${prefix}${type}${scopePart}${breakingMark}: ${description.trim()}`

    const parts = [header]
    if (body.trim()) parts.push('', body.trim())
    if (breaking && footer.trim()) {
      parts.push('', `BREAKING CHANGE: ${footer.trim()}`)
    } else if (footer.trim()) {
      parts.push('', footer.trim())
    }

    return parts.join('\n')
  }

  const output = buildCommit()

  const handleCopy = () => {
    if (output) {
      copy(output)
      addRecentTool(meta.id)
    }
  }

  const reset = () => {
    setType('feat')
    setScope('')
    setBreaking(false)
    setDescription('')
    setBody('')
    setFooter('')
  }

  const charCount = description.length
  const isOverLimit = charCount > 72

  return (
    <ToolLayout meta={meta} onReset={reset} outputValue={output}>
      <div className="grid grid-cols-5 gap-6 h-[calc(100vh-12rem)]">
        {/* Left: Config (3 cols) */}
        <div className="col-span-3 flex flex-col gap-4 overflow-y-auto">
          {/* Type */}
          <div>
            <label className="text-xs font-medium text-text-muted uppercase tracking-wider mb-2 block">提交类型</label>
            <div className="grid grid-cols-4 gap-2">
              {COMMIT_TYPES.map(t => (
                <button
                  key={t.type}
                  onClick={() => { setType(t.type); addRecentTool(meta.id) }}
                  className={`flex flex-col items-center gap-1 p-2.5 rounded-lg border text-center transition-colors ${
                    type === t.type
                      ? 'border-accent/40 bg-accent/10'
                      : 'border-border-base bg-bg-surface hover:bg-bg-raised'
                  }`}
                >
                  <span className="text-base">{t.emoji}</span>
                  <span className={`text-xs font-mono font-medium ${type === t.type ? 'text-accent' : 'text-text-primary'}`}>{t.label}</span>
                  <span className="text-xs text-text-muted">{t.desc}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Scope */}
          <div>
            <label className="text-xs font-medium text-text-muted uppercase tracking-wider mb-2 block">Scope（可选）</label>
            <input
              type="text"
              value={scope}
              onChange={e => setScope(e.target.value)}
              placeholder="影响范围，如: auth, ui, api"
              className="w-full px-3 py-2 rounded-lg bg-bg-surface border border-border-base text-sm font-mono text-text-primary focus:outline-none focus:border-accent"
            />
            <div className="flex flex-wrap gap-1.5 mt-2">
              {COMMON_SCOPES.map(s => (
                <button
                  key={s}
                  onClick={() => setScope(s)}
                  className={`px-2 py-0.5 rounded text-xs transition-colors ${
                    scope === s
                      ? 'bg-accent/10 text-accent border border-accent/30'
                      : 'bg-bg-raised text-text-muted hover:text-text-primary border border-transparent'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Description */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-medium text-text-muted uppercase tracking-wider">描述 *</label>
              <span className={`text-xs ${isOverLimit ? 'text-red-400' : 'text-text-muted'}`}>{charCount}/72</span>
            </div>
            <input
              type="text"
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="简短描述此次变更（祈使语气，首字母小写）"
              className={`w-full px-3 py-2 rounded-lg bg-bg-surface border text-sm text-text-primary focus:outline-none focus:border-accent ${isOverLimit ? 'border-red-500/50' : 'border-border-base'}`}
            />
          </div>

          {/* Options */}
          <div className="flex items-center gap-6">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={breaking}
                onChange={e => setBreaking(e.target.checked)}
                className="rounded"
              />
              <span className="text-sm text-text-secondary">破坏性变更 (BREAKING CHANGE)</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={showEmoji}
                onChange={e => setShowEmoji(e.target.checked)}
                className="rounded"
              />
              <span className="text-sm text-text-secondary">显示 Emoji</span>
            </label>
          </div>

          {/* Body */}
          <div>
            <label className="text-xs font-medium text-text-muted uppercase tracking-wider mb-1 block">提交正文（可选）</label>
            <textarea
              value={body}
              onChange={e => setBody(e.target.value)}
              placeholder="详细描述此次变更的动机..."
              rows={3}
              className="w-full px-3 py-2 rounded-lg bg-bg-surface border border-border-base text-sm text-text-primary focus:outline-none focus:border-accent resize-none"
            />
          </div>

          {/* Footer */}
          <div>
            <label className="text-xs font-medium text-text-muted uppercase tracking-wider mb-1 block">
              {breaking ? 'BREAKING CHANGE 描述' : 'Footer（可选）'}
            </label>
            <textarea
              value={footer}
              onChange={e => setFooter(e.target.value)}
              placeholder={breaking ? '描述破坏性变更的内容...' : '关联 issue: Closes #123, Refs #456'}
              rows={2}
              className="w-full px-3 py-2 rounded-lg bg-bg-surface border border-border-base text-sm text-text-primary focus:outline-none focus:border-accent resize-none"
            />
          </div>
        </div>

        {/* Right: Preview (2 cols) */}
        <div className="col-span-2 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <label className="text-xs font-medium text-text-muted uppercase tracking-wider">生成结果</label>
            {output && (
              <button
                onClick={handleCopy}
                className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-accent text-bg-base text-xs font-medium hover:bg-accent/90 transition-colors"
              >
                {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                复制
              </button>
            )}
          </div>

          {output ? (
            <div className="bg-bg-surface border border-border-base rounded-xl p-4">
              <pre className="text-sm font-mono text-text-primary whitespace-pre-wrap break-words leading-relaxed">{output}</pre>
            </div>
          ) : (
            <div className="flex items-center justify-center h-32 border-2 border-dashed border-border-base rounded-xl">
              <p className="text-sm text-text-muted">填写描述后预览提交信息</p>
            </div>
          )}

          {/* Format reference */}
          <div className="mt-4 p-4 bg-bg-surface border border-border-base rounded-xl">
            <p className="text-xs font-medium text-text-muted mb-2">Conventional Commits 格式</p>
            <pre className="text-xs font-mono text-text-muted leading-relaxed">{`<type>[scope]: <description>

[optional body]

[optional footer(s)]`}</pre>
          </div>

          {/* Example */}
          <div className="p-4 bg-bg-surface border border-border-base rounded-xl">
            <p className="text-xs font-medium text-text-muted mb-2">常见示例</p>
            <div className="space-y-2">
              {[
                'feat(auth): add OAuth2 login',
                'fix(api): handle null response gracefully',
                'docs: update README installation guide',
                'perf(db): add index on user_id column',
              ].map(ex => (
                <button
                  key={ex}
                  onClick={() => {
                    const [h] = ex.split('\n')
                    const match = h.match(/^(\w+)(?:\(([^)]+)\))?: (.+)$/)
                    if (match) {
                      setType(match[1])
                      setScope(match[2] || '')
                      setDescription(match[3])
                    }
                  }}
                  className="w-full text-left text-xs font-mono text-text-muted hover:text-text-primary p-1.5 rounded hover:bg-bg-raised transition-colors"
                >
                  {ex}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </ToolLayout>
  )
}
