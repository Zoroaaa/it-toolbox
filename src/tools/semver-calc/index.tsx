import { useState, useMemo } from 'react'
import { Tag, Copy, Check } from 'lucide-react'
import semver from 'semver'
import { ToolLayout } from '@/components/tool/ToolLayout'
import { useAppStore } from '@/store/app'
import { useClipboard } from '@/hooks/useClipboard'
import { meta } from './meta'

const EXAMPLE_RANGES = [
  { range: '^1.2.3', desc: '兼容补丁和次版本升级' },
  { range: '~1.2.3', desc: '仅允许补丁版本升级' },
  { range: '>=1.2.0 <2.0.0', desc: '大于等于 1.2.0 且小于 2.0.0' },
  { range: '1.x || >=2.5.0', desc: '1.x 或大于等于 2.5.0' },
  { range: '*', desc: '任意版本' },
]

export default function SemverCalc() {
  const [verA, setVerA] = useState('1.2.3')
  const [verB, setVerB] = useState('1.3.0')
  const [rangeInput, setRangeInput] = useState('^1.2.3')
  const [rangeVer, setRangeVer] = useState('1.2.5')
  const [sortInput, setSortInput] = useState('1.0.0\n2.0.0-beta\n1.5.0\n2.0.0\n0.9.1')
  const { addRecentTool } = useAppStore()
  const { copy, copied } = useClipboard()

  const comparison = useMemo(() => {
    const a = semver.valid(semver.coerce(verA))
    const b = semver.valid(semver.coerce(verB))
    if (!a || !b) return null
    const result = semver.compare(a, b)
    return {
      aClean: a, bClean: b,
      symbol: result === 0 ? '=' : result > 0 ? '>' : '<',
      label: result === 0 ? '版本相等' : result > 0 ? 'A 更新' : 'B 更新',
      diff: semver.diff(a, b),
    }
  }, [verA, verB])

  const rangeResult = useMemo(() => {
    const v = semver.valid(semver.coerce(rangeVer))
    if (!v || !rangeInput) return null
    try {
      const valid = semver.validRange(rangeInput)
      if (!valid) return { error: '无效的版本范围表达式' }
      return {
        satisfies: semver.satisfies(v, rangeInput),
        cleanVer: v,
        cleanRange: valid,
      }
    } catch {
      return { error: '解析失败' }
    }
  }, [rangeVer, rangeInput])

  const bumps = useMemo(() => {
    const v = semver.valid(semver.coerce(verA))
    if (!v) return null
    return {
      major: semver.inc(v, 'major')!,
      minor: semver.inc(v, 'minor')!,
      patch: semver.inc(v, 'patch')!,
      premajor: semver.inc(v, 'premajor', 'beta')!,
      preminor: semver.inc(v, 'preminor', 'beta')!,
      prepatch: semver.inc(v, 'prepatch', 'beta')!,
    }
  }, [verA])

  const sorted = useMemo(() => {
    const versions = sortInput
      .split('\n')
      .map(v => v.trim())
      .filter(v => v && semver.valid(semver.coerce(v)))
    if (versions.length < 2) return []
    return semver.rsort(versions.map(v => semver.coerce(v)!.version))
  }, [sortInput])

  const handleStart = () => addRecentTool(meta.id)

  return (
    <ToolLayout meta={meta} onReset={() => {}}>
      <div className="flex flex-col gap-6">

        {/* Version Comparison */}
        <div className="bg-bg-surface border border-border-base rounded-xl p-4">
          <h3 className="text-sm font-semibold text-text-primary mb-3 flex items-center gap-2">
            <Tag className="w-4 h-4 text-accent" />版本比较
          </h3>
          <div className="flex items-center gap-3">
            <input
              value={verA}
              onChange={e => { setVerA(e.target.value); handleStart() }}
              placeholder="1.2.3"
              className="flex-1 px-3 py-2 rounded-lg bg-bg-raised border border-border-base font-mono text-sm text-text-primary focus:outline-none focus:border-accent"
            />
            {comparison ? (
              <div className={`text-2xl font-bold w-8 text-center shrink-0 ${
                comparison.symbol === '=' ? 'text-text-muted' : 'text-accent'
              }`}>{comparison.symbol}</div>
            ) : (
              <div className="text-text-muted w-8 text-center">vs</div>
            )}
            <input
              value={verB}
              onChange={e => { setVerB(e.target.value); handleStart() }}
              placeholder="2.0.0"
              className="flex-1 px-3 py-2 rounded-lg bg-bg-raised border border-border-base font-mono text-sm text-text-primary focus:outline-none focus:border-accent"
            />
          </div>
          {comparison && (
            <div className="mt-3 flex gap-2 text-sm">
              <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                comparison.symbol === '=' ? 'bg-text-muted/20 text-text-muted'
                : comparison.symbol === '>' ? 'bg-accent/20 text-accent'
                : 'bg-blue-500/20 text-blue-400'
              }`}>{comparison.label}</span>
              {comparison.diff && (
                <span className="px-2 py-0.5 rounded text-xs bg-bg-raised text-text-muted">
                  差异类型: {comparison.diff}
                </span>
              )}
            </div>
          )}
          {comparison && !comparison.symbol && (
            <p className="text-xs text-red-400 mt-2">版本格式无效</p>
          )}
        </div>

        {/* Version Bumping */}
        {bumps && (
          <div className="bg-bg-surface border border-border-base rounded-xl p-4">
            <h3 className="text-sm font-semibold text-text-primary mb-3">版本升级（基于 A）</h3>
            <div className="grid grid-cols-3 gap-2">
              {(Object.entries(bumps) as [string, string][]).map(([type, ver]) => (
                <button
                  key={type}
                  onClick={() => copy(ver)}
                  className="flex flex-col items-start px-3 py-2 rounded-lg bg-bg-raised hover:bg-bg-base border border-border-base transition-colors text-left"
                >
                  <span className="text-xs text-text-muted capitalize">{type}</span>
                  <span className="font-mono text-sm text-text-primary">{ver}</span>
                </button>
              ))}
            </div>
            {copied && <p className="text-xs text-green-400 mt-2">已复制 ✓</p>}
          </div>
        )}

        {/* Range Checking */}
        <div className="bg-bg-surface border border-border-base rounded-xl p-4">
          <h3 className="text-sm font-semibold text-text-primary mb-3">范围检查</h3>
          <div className="flex gap-3 mb-3">
            <div className="flex-1">
              <label className="text-xs text-text-muted mb-1 block">版本号</label>
              <input
                value={rangeVer}
                onChange={e => { setRangeVer(e.target.value); handleStart() }}
                placeholder="1.2.5"
                className="w-full px-3 py-2 rounded-lg bg-bg-raised border border-border-base font-mono text-sm text-text-primary focus:outline-none focus:border-accent"
              />
            </div>
            <div className="flex-1">
              <label className="text-xs text-text-muted mb-1 block">范围表达式</label>
              <input
                value={rangeInput}
                onChange={e => { setRangeInput(e.target.value); handleStart() }}
                placeholder="^1.2.3"
                className="w-full px-3 py-2 rounded-lg bg-bg-raised border border-border-base font-mono text-sm text-text-primary focus:outline-none focus:border-accent"
              />
            </div>
          </div>

          {rangeResult && (
            <div className={`px-3 py-2 rounded-lg text-sm font-medium ${
              'error' in rangeResult
                ? 'bg-red-500/10 text-red-400'
                : rangeResult.satisfies
                  ? 'bg-green-500/10 text-green-400'
                  : 'bg-red-500/10 text-red-400'
            }`}>
              {'error' in rangeResult
                ? `❌ ${rangeResult.error}`
                : rangeResult.satisfies
                  ? `✅ ${rangeResult.cleanVer} 满足范围 ${rangeInput}`
                  : `❌ ${rangeResult.cleanVer} 不满足范围 ${rangeInput}`
              }
            </div>
          )}

          {/* Range examples */}
          <div className="mt-3 flex flex-wrap gap-1.5">
            {EXAMPLE_RANGES.map(ex => (
              <button
                key={ex.range}
                onClick={() => setRangeInput(ex.range)}
                title={ex.desc}
                className="px-2 py-0.5 rounded bg-bg-raised hover:bg-bg-base border border-border-base font-mono text-xs text-text-muted transition-colors"
              >
                {ex.range}
              </button>
            ))}
          </div>
        </div>

        {/* Sort */}
        <div className="bg-bg-surface border border-border-base rounded-xl p-4">
          <h3 className="text-sm font-semibold text-text-primary mb-3">版本排序（最新在前）</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-text-muted mb-1 block">输入版本列表（每行一个）</label>
              <textarea
                value={sortInput}
                onChange={e => { setSortInput(e.target.value); handleStart() }}
                rows={6}
                className="w-full px-3 py-2 rounded-lg bg-bg-raised border border-border-base font-mono text-sm text-text-primary focus:outline-none focus:border-accent resize-none"
              />
            </div>
            <div>
              <label className="text-xs text-text-muted mb-1 block">排序结果</label>
              <div className="bg-bg-raised rounded-lg border border-border-base p-3 h-[140px] overflow-auto">
                {sorted.map((v, i) => (
                  <div key={v} className="flex items-center gap-2 py-0.5">
                    <span className="text-xs text-text-muted w-5">{i + 1}.</span>
                    <span className="font-mono text-sm text-text-primary">{v}</span>
                    {i === 0 && <span className="text-xs bg-accent/20 text-accent px-1 rounded">最新</span>}
                  </div>
                ))}
                {sorted.length === 0 && <p className="text-xs text-text-muted">请输入有效的版本号</p>}
              </div>
            </div>
          </div>
        </div>

      </div>
    </ToolLayout>
  )
}
