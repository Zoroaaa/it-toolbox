import { useState, useCallback, useMemo } from 'react'
import { ArrowLeftRight, Copy, Check } from 'lucide-react'
import { ToolLayout } from '@/components/tool/ToolLayout'
import { useClipboard } from '@/hooks/useClipboard'
import { meta } from './meta'
import { toRoman as toRomanCore, fromRoman as fromRomanCore } from '@core/number'

const ROMAN_NUMERALS: [string, number][] = [
  ['M', 1000],
  ['CM', 900],
  ['D', 500],
  ['CD', 400],
  ['C', 100],
  ['XC', 90],
  ['L', 50],
  ['XL', 40],
  ['X', 10],
  ['IX', 9],
  ['V', 5],
  ['IV', 4],
  ['I', 1],
]

function toRoman(num: number): string {
  const result = toRomanCore(num)
  return result.ok ? result.value : '超出范围'
}

function fromRoman(roman: string): number | null {
  const result = fromRomanCore(roman)
  return result.ok ? result.value : null
}

export default function RomanNumeralConverter() {
  const [arabic, setArabic] = useState('')
  const [roman, setRoman] = useState('')
  const [mode, setMode] = useState<'toRoman' | 'fromRoman'>('toRoman')
  const { copy, copied } = useClipboard()

  const convertedRoman = useMemo(() => {
    const num = parseInt(arabic)
    if (isNaN(num)) return ''
    return toRoman(num)
  }, [arabic])

  const convertedArabic = useMemo(() => {
    if (!roman.trim()) return ''
    const result = fromRoman(roman)
    return result !== null ? result.toString() : '无效的罗马数字'
  }, [roman])

  const swap = useCallback(() => {
    if (mode === 'toRoman') {
      setMode('fromRoman')
      setArabic('')
      setRoman(convertedRoman)
    } else {
      setMode('toRoman')
      setRoman('')
      setArabic(convertedArabic !== '无效的罗马数字' ? convertedArabic : '')
    }
  }, [mode, convertedRoman, convertedArabic])

  const reset = () => {
    setArabic('')
    setRoman('')
    setMode('toRoman')
  }

  const outputValue = mode === 'toRoman' ? convertedRoman : convertedArabic

  return (
    <ToolLayout meta={meta} onReset={reset} outputValue={outputValue}>
      <div className="flex items-center gap-2 mb-4">
        <button
          onClick={() => setMode('toRoman')}
          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
            mode === 'toRoman'
              ? 'bg-accent text-bg-base'
              : 'bg-bg-surface text-text-secondary hover:bg-bg-raised border border-border-base'
          }`}
        >
          阿拉伯数字 → 罗马数字
        </button>
        <button
          onClick={() => setMode('fromRoman')}
          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
            mode === 'fromRoman'
              ? 'bg-accent text-bg-base'
              : 'bg-bg-surface text-text-secondary hover:bg-bg-raised border border-border-base'
          }`}
        >
          罗马数字 → 阿拉伯数字
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-start">
        <div className="space-y-3">
          <label className="text-xs font-medium text-text-muted uppercase tracking-wider block">
            {mode === 'toRoman' ? '阿拉伯数字' : '罗马数字'}
          </label>
          <input
            type={mode === 'toRoman' ? 'number' : 'text'}
            value={mode === 'toRoman' ? arabic : roman}
            onChange={e => mode === 'toRoman' ? setArabic(e.target.value) : setRoman(e.target.value.toUpperCase())}
            placeholder={mode === 'toRoman' ? '输入阿拉伯数字' : '输入罗马数字'}
            className="w-full px-4 py-3 rounded-xl bg-bg-surface border border-border-base text-text-primary text-lg font-mono focus:outline-none focus:border-accent"
          />
          {mode === 'toRoman' && (
            <p className="text-xs text-text-muted">范围: 1 - 3,999,999</p>
          )}
        </div>

        <div className="flex items-center justify-center pt-8">
          <button
            onClick={swap}
            className="p-3 rounded-xl bg-bg-surface border border-border-base hover:bg-bg-raised hover:border-accent transition-colors"
            title="交换转换方向"
          >
            <ArrowLeftRight className="w-5 h-5 text-text-secondary" />
          </button>
        </div>

        <div className="space-y-3">
          <label className="text-xs font-medium text-text-muted uppercase tracking-wider block">
            {mode === 'toRoman' ? '罗马数字' : '阿拉伯数字'}
          </label>
          <div className="relative">
            <input
              type="text"
              value={outputValue}
              readOnly
              placeholder="转换结果"
              className="w-full px-4 py-3 pr-12 rounded-xl bg-bg-surface border border-border-base text-text-primary text-lg font-mono focus:outline-none focus:border-accent"
            />
            {outputValue && (
              <button
                onClick={() => copy(outputValue)}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-lg hover:bg-bg-raised"
              >
                {copied ? <Check className="w-4 h-4 text-accent" /> : <Copy className="w-4 h-4 text-text-muted" />}
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="p-4 rounded-xl bg-bg-surface border border-border-base">
        <h3 className="text-sm font-medium text-text-primary mb-3">罗马数字对照表</h3>
        <div className="grid grid-cols-4 gap-2 text-xs">
          {ROMAN_NUMERALS.map(([symbol, value]) => (
            <div key={symbol} className="p-2 rounded bg-bg-raised text-center">
              <div className="font-mono font-bold text-accent">{symbol}</div>
              <div className="text-text-muted">{value}</div>
            </div>
          ))}
        </div>
      </div>
    </ToolLayout>
  )
}
