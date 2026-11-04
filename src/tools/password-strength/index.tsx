import { useState, useEffect, useMemo } from 'react'
import { Shield, AlertTriangle, CheckCircle, Eye, EyeOff, Copy, Check } from 'lucide-react'
import zxcvbn from 'zxcvbn'
import { ToolLayout } from '@/components/tool/ToolLayout'
import { useClipboard } from '@/hooks/useClipboard'
import { meta } from './meta'

const STRENGTH_LEVELS = [
  { label: '非常弱', color: '#ef4444', bg: 'bg-red-500', description: '极易被破解' },
  { label: '弱', color: '#f97316', bg: 'bg-orange-500', description: '容易被破解' },
  { label: '一般', color: '#eab308', bg: 'bg-yellow-500', description: '安全性一般' },
  { label: '强', color: '#22c55e', bg: 'bg-green-500', description: '较难破解' },
  { label: '非常强', color: '#10b981', bg: 'bg-emerald-500', description: '极难破解' },
]

function formatCrackTime(seconds: number | string): string {
  if (typeof seconds === 'string') return seconds
  if (seconds < 0.001) return '瞬间'
  if (seconds < 1) return `${(seconds * 1000).toFixed(0)} 毫秒`
  if (seconds < 60) return `${Math.round(seconds)} 秒`
  if (seconds < 3600) return `${Math.round(seconds / 60)} 分钟`
  if (seconds < 86400) return `${Math.round(seconds / 3600)} 小时`
  if (seconds < 2592000) return `${Math.round(seconds / 86400)} 天`
  if (seconds < 31536000) return `${Math.round(seconds / 2592000)} 个月`
  if (seconds < 3.15e9) return `${Math.round(seconds / 31536000)} 年`
  if (seconds < 3.15e12) return `${Math.round(seconds / 3.15e9)} 千年`
  return '数百万年+'
}

interface CharacterAnalysis {
  hasLower: boolean
  hasUpper: boolean
  hasNumber: boolean
  hasSymbol: boolean
  length: number
  uniqueChars: number
  entropy: number
}

function analyzeCharacters(password: string): CharacterAnalysis {
  return {
    hasLower: /[a-z]/.test(password),
    hasUpper: /[A-Z]/.test(password),
    hasNumber: /[0-9]/.test(password),
    hasSymbol: /[^a-zA-Z0-9]/.test(password),
    length: password.length,
    uniqueChars: new Set(password).size,
    entropy: calculateEntropy(password),
  }
}

function calculateEntropy(password: string): number {
  if (!password) return 0
  let poolSize = 0
  if (/[a-z]/.test(password)) poolSize += 26
  if (/[A-Z]/.test(password)) poolSize += 26
  if (/[0-9]/.test(password)) poolSize += 10
  if (/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?`~]/.test(password)) poolSize += 32
  if (/[^a-zA-Z0-9!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?`~]/.test(password)) poolSize += 100
  
  if (poolSize === 0) poolSize = 26
  return Math.log2(Math.pow(poolSize, password.length))
}

export default function PasswordStrength() {
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [zxcvbnResult, setZxcvbnResult] = useState<ReturnType<typeof zxcvbn> | null>(null)
  const { copy, copied } = useClipboard()

  useEffect(() => {
    if (password) {
      setZxcvbnResult(zxcvbn(password))
    } else {
      setZxcvbnResult(null)
    }
  }, [password])

  const charAnalysis = useMemo(() => analyzeCharacters(password), [password])

  const level = zxcvbnResult ? STRENGTH_LEVELS[zxcvbnResult.score] : null

  const crackTimes = useMemo(() => {
    if (!zxcvbnResult) return null
    return {
      onlineThrottled: formatCrackTime(zxcvbnResult.crack_times_seconds.online_throttling_100_per_hour),
      onlineNoThrottling: formatCrackTime(zxcvbnResult.crack_times_seconds.online_no_throttling_10_per_second),
      offlineSlow: formatCrackTime(zxcvbnResult.crack_times_seconds.offline_slow_hashing_1e4_per_second),
      offlineFast: formatCrackTime(zxcvbnResult.crack_times_seconds.offline_fast_hashing_1e10_per_second),
    }
  }, [zxcvbnResult])

  const reset = () => {
    setPassword('')
    setShowPassword(false)
    setZxcvbnResult(null)
  }

  return (
    <ToolLayout meta={meta} onReset={reset}>
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="relative">
          <label className="text-xs font-medium text-text-muted uppercase tracking-wider block mb-2">
            输入密码进行分析
          </label>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="输入要分析的密码..."
              className="w-full px-4 py-3 pr-20 rounded-xl bg-bg-surface border border-border-base text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent font-mono text-sm"
            />
            <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
              <button
                onClick={() => copy(password)}
                disabled={!password}
                className="p-2 rounded-lg hover:bg-bg-raised text-text-muted hover:text-text-primary transition-colors disabled:opacity-50"
                title="复制"
              >
                {copied ? <Check className="w-4 h-4 text-accent" /> : <Copy className="w-4 h-4" />}
              </button>
              <button
                onClick={() => setShowPassword(!showPassword)}
                className="p-2 rounded-lg hover:bg-bg-raised text-text-muted hover:text-text-primary transition-colors"
                title={showPassword ? '隐藏' : '显示'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
          <div className="text-xs text-text-muted mt-1">{password.length} 字符</div>
        </div>

        {zxcvbnResult && level && (
          <>
            <div className="p-4 rounded-xl bg-bg-surface border border-border-base">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Shield className="w-5 h-5" style={{ color: level.color }} />
                  <span className="text-lg font-semibold" style={{ color: level.color }}>
                    {level.label}
                  </span>
                </div>
                <span className="text-sm text-text-muted">{level.description}</span>
              </div>

              <div className="h-3 bg-bg-raised rounded-full overflow-hidden mb-3">
                <div
                  className={`h-full transition-all duration-500 rounded-full ${level.bg}`}
                  style={{ width: `${(zxcvbnResult.score + 1) * 20}%` }}
                />
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-text-muted">熵值:</span>
                  <span className="ml-2 font-mono text-text-primary">
                    {charAnalysis.entropy.toFixed(1)} bits
                  </span>
                </div>
                <div>
                  <span className="text-text-muted">唯一字符:</span>
                  <span className="ml-2 font-mono text-text-primary">
                    {charAnalysis.uniqueChars} / {charAnalysis.length}
                  </span>
                </div>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-bg-surface border border-border-base">
              <h3 className="text-sm font-medium text-text-primary mb-3">破解时间估算</h3>
              <div className="space-y-2">
                {crackTimes && (
                  <>
                    <div className="flex justify-between items-center py-2 border-b border-border-base">
                      <span className="text-sm text-text-muted">在线攻击（限速 100次/小时）</span>
                      <span className="font-mono text-sm text-text-primary">{crackTimes.onlineThrottled}</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-border-base">
                      <span className="text-sm text-text-muted">在线攻击（无限制 10次/秒）</span>
                      <span className="font-mono text-sm text-text-primary">{crackTimes.onlineNoThrottling}</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-border-base">
                      <span className="text-sm text-text-muted">离线攻击（慢速哈希 1万次/秒）</span>
                      <span className="font-mono text-sm text-text-primary">{crackTimes.offlineSlow}</span>
                    </div>
                    <div className="flex justify-between items-center py-2">
                      <span className="text-sm text-text-muted">离线攻击（快速哈希 100亿次/秒）</span>
                      <span className="font-mono text-sm text-text-primary">{crackTimes.offlineFast}</span>
                    </div>
                  </>
                )}
              </div>
            </div>

            <div className="p-4 rounded-xl bg-bg-surface border border-border-base">
              <h3 className="text-sm font-medium text-text-primary mb-3">字符组成</h3>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: '小写字母 (a-z)', check: charAnalysis.hasLower },
                  { label: '大写字母 (A-Z)', check: charAnalysis.hasUpper },
                  { label: '数字 (0-9)', check: charAnalysis.hasNumber },
                  { label: '特殊字符 (!@#...)', check: charAnalysis.hasSymbol },
                ].map(item => (
                  <div
                    key={item.label}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg ${
                      item.check
                        ? 'bg-accent/10 text-accent'
                        : 'bg-bg-raised text-text-muted'
                    }`}
                  >
                    {item.check ? (
                      <CheckCircle className="w-4 h-4" />
                    ) : (
                      <div className="w-4 h-4 rounded-full border border-current" />
                    )}
                    <span className="text-sm">{item.label}</span>
                  </div>
                ))}
              </div>
            </div>

            {(zxcvbnResult.feedback.warning || zxcvbnResult.feedback.suggestions.length > 0) && (
              <div className="p-4 rounded-xl bg-bg-surface border border-border-base">
                <h3 className="text-sm font-medium text-text-primary mb-3">改进建议</h3>
                
                {zxcvbnResult.feedback.warning && (
                  <div className="flex items-start gap-2 mb-3 p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
                    <AlertTriangle className="w-4 h-4 text-yellow-500 flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-yellow-400">{zxcvbnResult.feedback.warning}</span>
                  </div>
                )}

                {zxcvbnResult.feedback.suggestions.length > 0 && (
                  <ul className="space-y-1">
                    {zxcvbnResult.feedback.suggestions.map((suggestion, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-text-secondary">
                        <span className="text-accent">•</span>
                        {suggestion}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}

            {zxcvbnResult.sequence && zxcvbnResult.sequence.length > 0 && (
              <div className="p-4 rounded-xl bg-bg-surface border border-border-base">
                <h3 className="text-sm font-medium text-text-primary mb-3">检测到的模式</h3>
                <div className="flex flex-wrap gap-2">
                  {zxcvbnResult.sequence.map((seq, i) => (
                    <span
                      key={i}
                      className="px-2 py-1 rounded-md text-xs font-medium bg-bg-raised text-text-secondary border border-border-base"
                    >
                      {seq.pattern}
                      {seq.token && <span className="text-text-muted ml-1">"{seq.token}"</span>}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {!password && (
          <div className="h-48 rounded-xl bg-bg-raised border border-border-base flex items-center justify-center">
            <p className="text-text-muted text-sm">输入密码后实时分析强度</p>
          </div>
        )}
      </div>
    </ToolLayout>
  )
}
