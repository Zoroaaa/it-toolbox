import { useState } from 'react'
import { Copy, Check, AlertCircle, Sparkles, AlertTriangle, Info } from 'lucide-react'
import { ToolLayout } from '@/components/tool/ToolLayout'
import { useClipboard } from '@/hooks/useClipboard'
import { meta } from './meta'
import { callAi } from '@/lib/ai'

interface ShellResult {
  bash: string
  powershell: string
  explanation: string
  warnings: string[]
  isDangerous: boolean
}

type ShellType = 'bash' | 'powershell'

export default function AiShellCmd() {
  const [description, setDescription] = useState('')
  const [shellType, setShellType] = useState<ShellType>('bash')
  const [result, setResult] = useState<ShellResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const { copy, copied } = useClipboard()

  const generate = async () => {
    if (!description.trim()) return
    setLoading(true)
    setError('')
    setResult(null)
    try {
      const ai = await callAi<ShellResult>('shell-cmd', { description })
      if (ai.ok) setResult(ai.data)
      else setError(ai.error)
    } catch (e) {
      setError('网络错误：' + (e as Error).message)
    } finally {
      setLoading(false)
    }
  }

  const currentCmd = result ? (shellType === 'bash' ? result.bash : result.powershell) : ''

  const examples = [
    '查找当前目录下所有 .log 文件',
    '删除 7 天前的备份文件',
    '统计代码行数',
    '批量重命名文件',
    '查看端口占用情况',
    '压缩文件夹并排除某些文件',
  ]

  return (
    <ToolLayout meta={meta} onReset={() => { setDescription(''); setResult(null); setError('') }}>
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <label className="text-xs font-medium text-text-muted uppercase tracking-wider">描述你想执行的操作</label>
          <input
            className="tool-input"
            placeholder="例如：查找当前目录下所有超过 100MB 的文件"
            value={description}
            onChange={e => setDescription(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && generate()}
          />
          <div className="flex flex-wrap gap-1.5">
            {examples.map(ex => (
              <button
                key={ex}
                onClick={() => setDescription(ex)}
                className="px-2 py-1 text-xs rounded-md bg-bg-raised text-text-muted hover:text-text-primary hover:bg-bg-surface border border-border-base transition-colors"
              >
                {ex}
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={generate}
          disabled={loading || !description.trim()}
          className="btn-primary gap-2"
        >
          <Sparkles className="w-4 h-4" />
          {loading ? '生成中...' : 'AI 生成命令'}
        </button>

        {error && (
          <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 flex gap-2 text-xs text-rose-400">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            {error}
          </div>
        )}

        {result && (
          <div className="flex flex-col gap-3">
            {result.isDangerous && (
              <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/30 flex gap-2 text-xs text-amber-400">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                <div>
                  <span className="font-medium">危险命令！</span>
                  <span className="ml-1">此命令可能会对系统造成不可逆的影响，请谨慎执行。</span>
                </div>
              </div>
            )}

            {result.warnings.length > 0 && (
              <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/30 flex flex-col gap-1 text-xs text-amber-400">
                {result.warnings.map((warning, i) => (
                  <div key={i} className="flex gap-2">
                    <Info className="w-4 h-4 shrink-0 mt-0.5" />
                    {warning}
                  </div>
                ))}
              </div>
            )}

            <div className="flex items-center gap-2">
              <button
                onClick={() => setShellType('bash')}
                className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-colors ${
                  shellType === 'bash'
                    ? 'bg-accent text-white'
                    : 'bg-bg-raised text-text-muted hover:text-text-primary border border-border-base'
                }`}
              >
                Bash
              </button>
              <button
                onClick={() => setShellType('powershell')}
                className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-colors ${
                  shellType === 'powershell'
                    ? 'bg-accent text-white'
                    : 'bg-bg-raised text-text-muted hover:text-text-primary border border-border-base'
                }`}
              >
                PowerShell
              </button>
            </div>

            <div className="bg-bg-surface rounded-lg border border-border-base p-4 flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-text-muted uppercase tracking-wider">
                  {shellType === 'bash' ? 'Bash 命令' : 'PowerShell 命令'}
                </span>
                <button onClick={() => copy(currentCmd)} className="btn-ghost text-xs gap-1">
                  {copied ? <Check className="w-3.5 h-3.5 text-accent" /> : <Copy className="w-3.5 h-3.5" />}
                  复制
                </button>
              </div>
              <pre className="font-mono text-sm text-text-primary bg-bg-raised rounded-lg p-3 overflow-x-auto">
                {currentCmd}
              </pre>
              <div className="text-xs text-text-secondary leading-relaxed">
                <span className="font-medium text-text-primary">说明：</span>
                {result.explanation}
              </div>
            </div>
          </div>
        )}
      </div>
    </ToolLayout>
  )
}
