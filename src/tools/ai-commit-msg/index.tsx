import { useState } from 'react'
import { Sparkles, Copy, Check, AlertCircle, GitCommit } from 'lucide-react'
import { ToolLayout } from '@/components/tool/ToolLayout'
import { useClipboard } from '@/hooks/useClipboard'
import { meta } from './meta'
import { callAi } from '@/lib/ai'

interface CommitResult {
  message: string
  type: string
  scope: string
  description: string
  body?: string
}

const EXAMPLES = [
  `diff --git a/src/utils.ts b/src/utils.ts
new file mode 100644
index 0000000..abc1234
--- /dev/null
+++ b/src/utils.ts
@@ -0,0 +1,10 @@
+export function formatDate(date: Date): string {
+  return date.toISOString().split('T')[0]
+}`,
  `diff --git a/src/api.ts b/src/api.ts
index abc1234..def5678 100644
--- a/src/api.ts
+++ b/src/api.ts
@@ -5,7 +5,7 @@ export async function fetchData(url: string) {
-  const response = await fetch(url)
+  const response = await fetch(url, { timeout: 5000 })
   return response.json()
 }`,
  `diff --git a/src/auth.ts b/src/auth.ts
deleted file mode 100644
index abc1234..0000000
--- a/src/auth.ts
+++ /dev/null
@@ -1,20 +0,0 @@
-export function login(user: string, pass: string) {
-  // deprecated
-}`,
]

export default function AiCommitMsg() {
  const [diffInput, setDiffInput] = useState('')
  const [result, setResult] = useState<CommitResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const { copy, copied } = useClipboard()

  const generate = async () => {
    if (!diffInput.trim()) return
    setLoading(true)
    setError('')
    setResult(null)
    
    try {
      const ai = await callAi<CommitResult>('commit-msg', { diff: diffInput })

      if (ai.ok) setResult(ai.data)
      else setError(ai.error)
    } catch (e) {
      setError('网络错误：' + (e as Error).message)
    } finally {
      setLoading(false)
    }
  }

  const reset = () => {
    setDiffInput('')
    setResult(null)
    setError('')
  }

  const outputValue = result?.message ?? ''

  return (
    <ToolLayout meta={meta} onReset={reset} outputValue={outputValue}>
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <label className="text-xs font-medium text-text-muted uppercase tracking-wider">Git Diff内容</label>
          <textarea
            value={diffInput}
            onChange={e => setDiffInput(e.target.value)}
            placeholder="粘贴 git diff 输出内容，AI将生成符合 Conventional Commits 规范的提交信息..."
            className="w-full h-48 px-4 py-3 rounded-xl bg-bg-surface border border-border-base text-text-primary font-mono text-sm focus:outline-none focus:border-accent resize-none"
            spellCheck={false}
          />
        </div>

        <div className="flex flex-wrap gap-1.5">
          <span className="text-xs text-text-muted">示例:</span>
          {EXAMPLES.map((ex, i) => (
            <button
              key={i}
              onClick={() => setDiffInput(ex)}
              className="px-2 py-1 text-xs rounded-md bg-bg-raised text-text-muted hover:text-text-primary hover:bg-bg-surface border border-border-base transition-colors"
            >
              {i === 0 ? '新增文件' : i === 1 ? '修改代码' : '删除文件'}
            </button>
          ))}
        </div>

        <button
          onClick={generate}
          disabled={loading || !diffInput.trim()}
          className="btn-primary w-full"
        >
          <Sparkles className="w-4 h-4" />
          {loading ? '生成中...' : 'AI生成提交信息'}
        </button>

        {error && (
          <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 flex gap-2 text-xs text-rose-400">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            {error}
          </div>
        )}

        {result && (
          <div className="space-y-4">
            <div className="bg-bg-surface rounded-lg border border-border-base p-4 flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-text-muted uppercase tracking-wider flex items-center gap-2">
                  <GitCommit className="w-4 h-4" />
                  提交信息
                </span>
                <button
                  onClick={() => copy(result.message)}
                  className="btn-ghost text-xs"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-accent" /> : <Copy className="w-3.5 h-3.5" />}
                  复制
                </button>
              </div>
              <div className="bg-bg-raised rounded-lg p-4 font-mono text-sm text-accent">
                {result.message}
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="p-3 rounded-lg bg-bg-surface border border-border-base">
                <div className="text-xs text-text-muted mb-1">类型</div>
                <div className="font-mono text-sm text-accent">{result.type}</div>
              </div>
              <div className="p-3 rounded-lg bg-bg-surface border border-border-base">
                <div className="text-xs text-text-muted mb-1">范围</div>
                <div className="font-mono text-sm text-text-primary">{result.scope || '-'}</div>
              </div>
              <div className="p-3 rounded-lg bg-bg-surface border border-border-base">
                <div className="text-xs text-text-muted mb-1">描述</div>
                <div className="text-sm text-text-primary truncate" title={result.description}>
                  {result.description}
                </div>
              </div>
            </div>

            {result.body && (
              <div className="bg-bg-surface rounded-lg border border-border-base p-4">
                <div className="text-xs font-medium text-text-muted uppercase tracking-wider mb-2">详细说明</div>
                <p className="text-sm text-text-secondary whitespace-pre-wrap">{result.body}</p>
              </div>
            )}

            <div className="p-4 rounded-xl bg-bg-raised border border-border-base">
              <div className="text-xs font-medium text-text-muted uppercase tracking-wider mb-2">Conventional Commits 格式说明</div>
              <div className="text-sm text-text-secondary space-y-1">
                <p><code className="text-accent">feat:</code> 新功能</p>
                <p><code className="text-accent">fix:</code> Bug修复</p>
                <p><code className="text-accent">docs:</code> 文档更新</p>
                <p><code className="text-accent">style:</code> 代码格式(不影响代码运行)</p>
                <p><code className="text-accent">refactor:</code> 重构</p>
                <p><code className="text-accent">perf:</code> 性能优化</p>
                <p><code className="text-accent">test:</code> 测试相关</p>
                <p><code className="text-accent">chore:</code> 构建/工具相关</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </ToolLayout>
  )
}
