import { useState, useMemo } from 'react'
import { Calculator, AlertCircle, Copy, Check, Info } from 'lucide-react'
import { ToolLayout } from '@/components/tool/ToolLayout'
import { meta } from './meta'
import { useClipboard } from '@/hooks/useClipboard'
import { create, all } from 'mathjs'

// 原生 Number 是 IEEE 754 双精度，超过 2^53 的整数会丢精度；
// 统一使用 BigNumber（十进制任意精度），保证大数运算结果准确。
const math = create(all, { number: 'BigNumber', precision: 64 })
// mathjs 以 log 表示自然对数，补充 ln 别名以匹配工具文档
math.import({ ln: math.log })

const EXAMPLES = [
  { expr: '2 + 3 * 4', desc: '基础运算' },
  { expr: 'sqrt(16) + pow(2, 3)', desc: '平方根、幂运算' },
  { expr: 'sin(pi/2) + cos(0)', desc: '三角函数' },
  { expr: 'log(100) + ln(e)', desc: '对数函数' },
  { expr: 'abs(-5) + round(3.7)', desc: '绝对值、四舍五入' },
  { expr: '12 inch to cm', desc: '单位换算' },
  { expr: '5 km + 2 mile to m', desc: '复合单位' },
  { expr: 'factorial(5)', desc: '阶乘' },
  { expr: 'bin(255) + hex(16)', desc: '进制转换' },
  { expr: 'derivative("x^2", "x")', desc: '求导' },
]

const FUNCTIONS = [
  { name: 'sqrt', desc: '平方根' },
  { name: 'pow', desc: '幂运算' },
  { name: 'abs', desc: '绝对值' },
  { name: 'round', desc: '四舍五入' },
  { name: 'floor', desc: '向下取整' },
  { name: 'ceil', desc: '向上取整' },
  { name: 'sin/cos/tan', desc: '三角函数' },
  { name: 'asin/acos/atan', desc: '反三角函数' },
  { name: 'log / ln', desc: '自然对数(e为底)' },
  { name: 'log10', desc: '常用对数(10为底)' },
  { name: 'exp', desc: 'e的幂次' },
  { name: 'factorial', desc: '阶乘' },
]

const CONSTANTS = [
  { name: 'pi', value: '3.141592653589793', desc: '圆周率' },
  { name: 'e', value: '2.718281828459045', desc: '自然常数' },
  { name: 'phi', value: '1.618033988749895', desc: '黄金比例' },
]

export default function MathEval() {
  const [expression, setExpression] = useState('')
  const [error, setError] = useState('')
  const { copy, copied } = useClipboard()

  const result = useMemo(() => {
    setError('')
    if (!expression.trim()) return null
    
    try {
      const res = math.evaluate(expression)
      return res
    } catch (e) {
      setError((e as Error).message)
      return null
    }
  }, [expression])

  const reset = () => {
    setExpression('')
    setError('')
  }

  const formatResult = (val: unknown): string => {
    if (typeof val === 'number') {
      if (Number.isInteger(val)) return val.toString()
      if (Math.abs(val) < 0.0001 || Math.abs(val) > 1e10) {
        return val.toExponential(6)
      }
      return val.toPrecision(10).replace(/\.?0+$/, '')
    }
    if (typeof val === 'object' && val !== null) {
      // 符号运算返回的是 AST 节点（如导数），用其表达式文本而不是序列化 JSON
      if ('isNode' in val && (val as { isNode: true, toString: () => string }).isNode) {
        return (val as { toString: () => string }).toString()
      }
      // BigNumber / Unit / Complex / Matrix 都实现了有意义的 toString
      const str = String(val)
      return str === '[object Object]' ? JSON.stringify(val) : str
    }
    return String(val)
  }

  return (
    <ToolLayout meta={meta} onReset={reset}>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-text-secondary mb-2">数学表达式</label>
          <div className="relative">
            <Calculator className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
            <input
              type="text"
              value={expression}
              onChange={(e) => setExpression(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && expression}
              placeholder="输入数学表达式，如: 2 + 3 * 4, sqrt(16), sin(pi/2)"
              className="w-full pl-10 pr-4 py-3 bg-bg-raised border border-border-base rounded-lg text-text-primary font-mono text-lg placeholder:text-text-muted focus:outline-none focus:border-accent"
              autoComplete="off"
            />
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {EXAMPLES.map((ex) => (
            <button
              key={ex.expr}
              onClick={() => setExpression(ex.expr)}
              className="px-3 py-1.5 text-xs bg-bg-base border border-border-base rounded-lg hover:border-accent transition-colors"
              title={ex.desc}
            >
              <code className="text-text-secondary">{ex.expr}</code>
            </button>
          ))}
        </div>

        {error ? (
          <div className="flex items-start gap-2 p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <span className="break-all">{error}</span>
          </div>
        ) : result !== null ? (
          <div className="bg-bg-raised border border-border-base rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-text-muted">结果</span>
              <button
                onClick={() => copy(formatResult(result))}
                className="btn-ghost text-xs"
              >
                {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                复制
              </button>
            </div>
            <p className="text-2xl font-mono text-text-primary break-all">
              {formatResult(result)}
            </p>
          </div>
        ) : (
          <div className="bg-bg-raised border border-border-base rounded-lg p-4 text-center text-text-muted">
            输入表达式开始计算
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-bg-surface border border-border-base rounded-lg p-4">
            <div className="flex items-center gap-2 mb-3">
              <Info className="w-4 h-4 text-accent" />
              <h3 className="text-sm font-medium text-text-secondary">常用函数</h3>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              {FUNCTIONS.map((fn) => (
                <div key={fn.name} className="flex items-center gap-2">
                  <code className="text-accent">{fn.name}</code>
                  <span className="text-text-muted">{fn.desc}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-bg-surface border border-border-base rounded-lg p-4">
            <div className="flex items-center gap-2 mb-3">
              <Info className="w-4 h-4 text-accent" />
              <h3 className="text-sm font-medium text-text-secondary">数学常量</h3>
            </div>
            <div className="space-y-2 text-xs">
              {CONSTANTS.map((c) => (
                <div key={c.name} className="flex items-center justify-between">
                  <code className="text-accent">{c.name}</code>
                  <span className="text-text-muted font-mono">{c.value}</span>
                  <span className="text-text-muted">{c.desc}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </ToolLayout>
  )
}
