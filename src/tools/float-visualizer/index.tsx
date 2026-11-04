import { useState, useMemo } from 'react'
import { Copy, Check, Info } from 'lucide-react'
import { ToolLayout } from '@/components/tool/ToolLayout'
import { useClipboard } from '@/hooks/useClipboard'
import { meta } from './meta'

type Precision = 'single' | 'double'

interface FloatComponents {
  sign: string
  exponent: string
  mantissa: string
  signValue: number
  exponentValue: number
  exponentBias: number
  mantissaValue: number
  actualExponent: number
  isDenormalized: boolean
  isInfinity: boolean
  isNaN: boolean
  decimalValue: number
  hexValue: string
}

function floatToBinary(num: number, precision: Precision): FloatComponents | null {
  if (isNaN(num)) {
    if (precision === 'single') {
      return {
        sign: '0',
        exponent: '11111111',
        mantissa: '00000000000000000000001',
        signValue: 0,
        exponentValue: 255,
        exponentBias: 127,
        mantissaValue: 1,
        actualExponent: 0,
        isDenormalized: false,
        isInfinity: false,
        isNaN: true,
        decimalValue: NaN,
        hexValue: '0x7FC00000',
      }
    } else {
      return {
        sign: '0',
        exponent: '11111111111',
        mantissa: '0000000000000000000000000000000000000000000000000001',
        signValue: 0,
        exponentValue: 2047,
        exponentBias: 1023,
        mantissaValue: 1,
        actualExponent: 0,
        isDenormalized: false,
        isInfinity: false,
        isNaN: true,
        decimalValue: NaN,
        hexValue: '0x7FF8000000000001',
      }
    }
  }

  if (!isFinite(num)) {
    const sign = num < 0 ? 1 : 0
    if (precision === 'single') {
      return {
        sign: sign.toString(),
        exponent: '11111111',
        mantissa: '00000000000000000000000',
        signValue: sign,
        exponentValue: 255,
        exponentBias: 127,
        mantissaValue: 0,
        actualExponent: 0,
        isDenormalized: false,
        isInfinity: true,
        isNaN: false,
        decimalValue: num,
        hexValue: sign === 0 ? '0x7F800000' : '0xFF800000',
      }
    } else {
      return {
        sign: sign.toString(),
        exponent: '11111111111',
        mantissa: '0000000000000000000000000000000000000000000000000000',
        signValue: sign,
        exponentValue: 2047,
        exponentBias: 1023,
        mantissaValue: 0,
        actualExponent: 0,
        isDenormalized: false,
        isInfinity: true,
        isNaN: false,
        decimalValue: num,
        hexValue: sign === 0 ? '0x7FF0000000000000' : '0xFFF0000000000000',
      }
    }
  }

  const buffer = new ArrayBuffer(8)
  const view = new DataView(buffer)

  if (precision === 'single') {
    view.setFloat32(0, num, false)
    const bits = view.getUint32(0, false)
    const sign = (bits >>> 31) & 1
    const exponent = (bits >>> 23) & 0xFF
    const mantissa = bits & 0x7FFFFF

    const signStr = sign.toString()
    const expStr = exponent.toString(2).padStart(8, '0')
    const mantStr = mantissa.toString(2).padStart(23, '0')

    const isDenormalized = exponent === 0
    const actualExp = isDenormalized ? -126 : exponent - 127

    return {
      sign: signStr,
      exponent: expStr,
      mantissa: mantStr,
      signValue: sign,
      exponentValue: exponent,
      exponentBias: 127,
      mantissaValue: mantissa,
      actualExponent: actualExp,
      isDenormalized,
      isInfinity: false,
      isNaN: false,
      decimalValue: num,
      hexValue: '0x' + bits.toString(16).toUpperCase().padStart(8, '0'),
    }
  } else {
    view.setFloat64(0, num, false)
    const highBits = view.getUint32(0, false)
    const lowBits = view.getUint32(4, false)

    const sign = (highBits >>> 31) & 1
    const exponent = (highBits >>> 20) & 0x7FF
    const mantissaHigh = highBits & 0xFFFFF
    const mantissa = (BigInt(mantissaHigh) << 32n) | BigInt(lowBits)

    const signStr = sign.toString()
    const expStr = exponent.toString(2).padStart(11, '0')
    const mantStr = mantissa.toString(2).padStart(52, '0')

    const isDenormalized = exponent === 0
    const actualExp = isDenormalized ? -1022 : exponent - 1023

    const hexValue = '0x' + 
      highBits.toString(16).toUpperCase().padStart(8, '0') +
      lowBits.toString(16).toUpperCase().padStart(8, '0')

    return {
      sign: signStr,
      exponent: expStr,
      mantissa: mantStr,
      signValue: sign,
      exponentValue: exponent,
      exponentBias: 1023,
      mantissaValue: Number(mantissa),
      actualExponent: actualExp,
      isDenormalized,
      isInfinity: false,
      isNaN: false,
      decimalValue: num,
      hexValue,
    }
  }
}

function binaryToFloat(sign: string, exponent: string, mantissa: string, precision: Precision): number | null {
  try {
    const signBit = parseInt(sign, 2)
    const expBits = parseInt(exponent, 2)
    const mantBits = parseInt(mantissa, 2)

    const buffer = new ArrayBuffer(8)
    const view = new DataView(buffer)

    if (precision === 'single') {
      const bits = (signBit << 31) | (expBits << 23) | mantBits
      view.setUint32(0, bits, false)
      return view.getFloat32(0, false)
    } else {
      const highBits = (signBit << 31) | (expBits << 20) | (mantBits >>> 32)
      const lowBits = mantBits & 0xFFFFFFFF
      view.setUint32(0, highBits, false)
      view.setUint32(4, lowBits, false)
      return view.getFloat64(0, false)
    }
  } catch {
    return null
  }
}

export default function FloatVisualizer() {
  const [input, setInput] = useState('3.14159')
  const [precision, setPrecision] = useState<Precision>('double')
  const [mode, setMode] = useState<'decimal' | 'binary'>('decimal')
  const [binaryInput, setBinaryInput] = useState({
    sign: '0',
    exponent: '01111111111',
    mantissa: '1001001000011111101101010100010001000010110100011000',
  })
  const { copy, copied } = useClipboard()

  const result = useMemo(() => {
    if (mode === 'decimal') {
      const num = parseFloat(input)
      if (isNaN(num)) return null
      return floatToBinary(num, precision)
    } else {
      const num = binaryToFloat(
        binaryInput.sign,
        binaryInput.exponent,
        binaryInput.mantissa,
        precision
      )
      if (num === null) return null
      return floatToBinary(num, precision)
    }
  }, [input, precision, mode, binaryInput])

  const reset = () => {
    setInput('3.14159')
    setPrecision('double')
    setMode('decimal')
    setBinaryInput({
      sign: '0',
      exponent: '01111111111',
      mantissa: '1001001000011111101101010100010001000010110100011000',
    })
  }

  const outputValue = result ? `${result.hexValue}\nSign: ${result.sign}\nExponent: ${result.exponent}\nMantissa: ${result.mantissa}` : ''

  return (
    <ToolLayout meta={meta} onReset={reset} outputValue={outputValue}>
      <div className="flex items-center gap-2 mb-4 flex-wrap">
        <button
          onClick={() => setMode('decimal')}
          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
            mode === 'decimal'
              ? 'bg-accent text-bg-base'
              : 'bg-bg-surface text-text-secondary hover:bg-bg-raised border border-border-base'
          }`}
        >
          十进制输入
        </button>
        <button
          onClick={() => setMode('binary')}
          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
            mode === 'binary'
              ? 'bg-accent text-bg-base'
              : 'bg-bg-surface text-text-secondary hover:bg-bg-raised border border-border-base'
          }`}
        >
          二进制输入
        </button>
        <div className="flex items-center gap-2 ml-auto">
          <button
            onClick={() => setPrecision('single')}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              precision === 'single'
                ? 'bg-accent text-bg-base'
                : 'bg-bg-surface text-text-secondary hover:bg-bg-raised border border-border-base'
            }`}
          >
            单精度 (32位)
          </button>
          <button
            onClick={() => setPrecision('double')}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              precision === 'double'
                ? 'bg-accent text-bg-base'
                : 'bg-bg-surface text-text-secondary hover:bg-bg-raised border border-border-base'
            }`}
          >
            双精度 (64位)
          </button>
        </div>
      </div>

      {mode === 'decimal' && (
        <div className="mb-4">
          <label className="text-xs font-medium text-text-muted uppercase tracking-wider block mb-2">
            输入浮点数
          </label>
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="输入浮点数，如 3.14159, -0.5, 1e10"
            className="w-full px-4 py-3 rounded-xl bg-bg-surface border border-border-base text-text-primary text-lg font-mono focus:outline-none focus:border-accent"
          />
        </div>
      )}

      {mode === 'binary' && (
        <div className="mb-4 space-y-3">
          <div>
            <label className="text-xs font-medium text-text-muted uppercase tracking-wider block mb-2">
              符号位 (1位)
            </label>
            <input
              type="text"
              value={binaryInput.sign}
              onChange={e => setBinaryInput(prev => ({ ...prev, sign: e.target.value.replace(/[^01]/g, '').slice(0, 1) }))}
              placeholder="0 或 1"
              className="w-20 px-3 py-2 rounded-lg bg-bg-surface border border-border-base text-text-primary font-mono focus:outline-none focus:border-accent"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-text-muted uppercase tracking-wider block mb-2">
              阶码 ({precision === 'single' ? 8 : 11}位)
            </label>
            <input
              type="text"
              value={binaryInput.exponent}
              onChange={e => setBinaryInput(prev => ({ 
                ...prev, 
                exponent: e.target.value.replace(/[^01]/g, '').slice(0, precision === 'single' ? 8 : 11) 
              }))}
              placeholder={precision === 'single' ? '00000000' : '00000000000'}
              className="w-full px-3 py-2 rounded-lg bg-bg-surface border border-border-base text-text-primary font-mono focus:outline-none focus:border-accent"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-text-muted uppercase tracking-wider block mb-2">
              尾数 ({precision === 'single' ? 23 : 52}位)
            </label>
            <input
              type="text"
              value={binaryInput.mantissa}
              onChange={e => setBinaryInput(prev => ({ 
                ...prev, 
                mantissa: e.target.value.replace(/[^01]/g, '').slice(0, precision === 'single' ? 23 : 52) 
              }))}
              placeholder={precision === 'single' ? '00000000000000000000000' : '0000000000000000000000000000000000000000000000000000'}
              className="w-full px-3 py-2 rounded-lg bg-bg-surface border border-border-base text-text-primary font-mono text-sm focus:outline-none focus:border-accent"
            />
          </div>
        </div>
      )}

      {result && (
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-bg-surface border border-border-base">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-medium text-text-muted uppercase tracking-wider">二进制表示</span>
              <button
                onClick={() => copy(`${result.sign} ${result.exponent} ${result.mantissa}`)}
                className="btn-ghost text-xs"
              >
                {copied ? <Check className="w-3 h-3 text-accent" /> : <Copy className="w-3 h-3" />}
                复制
              </button>
            </div>
            <div className="flex items-center gap-1 font-mono text-sm overflow-x-auto pb-2">
              <div className="flex-shrink-0">
                <div className="px-2 py-1 rounded bg-rose-500/20 text-rose-400 border border-rose-500/30">
                  {result.sign}
                </div>
                <div className="text-xs text-center text-text-muted mt-1">符号</div>
              </div>
              <div className="flex-shrink-0">
                <div className="px-2 py-1 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  {result.exponent}
                </div>
                <div className="text-xs text-center text-text-muted mt-1">阶码</div>
              </div>
              <div className="flex-shrink-0">
                <div className="px-2 py-1 rounded bg-blue-500/20 text-blue-400 border border-blue-500/30">
                  {result.mantissa}
                </div>
                <div className="text-xs text-center text-text-muted mt-1">尾数</div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="p-3 rounded-lg bg-bg-surface border border-border-base">
              <div className="text-xs text-text-muted mb-1">十六进制</div>
              <div className="font-mono text-sm text-accent">{result.hexValue}</div>
            </div>
            <div className="p-3 rounded-lg bg-bg-surface border border-border-base">
              <div className="text-xs text-text-muted mb-1">十进制值</div>
              <div className="font-mono text-sm text-text-primary">{result.isNaN ? 'NaN' : result.isInfinity ? (result.signValue ? '-∞' : '+∞') : result.decimalValue}</div>
            </div>
            <div className="p-3 rounded-lg bg-bg-surface border border-border-base">
              <div className="text-xs text-text-muted mb-1">阶码值</div>
              <div className="font-mono text-sm text-text-primary">{result.exponentValue}</div>
            </div>
            <div className="p-3 rounded-lg bg-bg-surface border border-border-base">
              <div className="text-xs text-text-muted mb-1">实际指数</div>
              <div className="font-mono text-sm text-text-primary">{result.actualExponent}</div>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-bg-surface border border-border-base">
            <div className="flex items-center gap-2 mb-3">
              <Info className="w-4 h-4 text-accent" />
              <span className="text-xs font-medium text-text-muted uppercase tracking-wider">IEEE 754 解释</span>
            </div>
            <div className="space-y-2 text-sm text-text-secondary">
              <p>
                <span className="text-text-primary font-medium">精度:</span>{' '}
                {precision === 'single' ? '单精度 (32位)' : '双精度 (64位)'}
              </p>
              <p>
                <span className="text-text-primary font-medium">符号位:</span>{' '}
                {result.signValue === 0 ? '正数 (+)' : '负数 (-)'}
              </p>
              <p>
                <span className="text-text-primary font-medium">偏移值:</span>{' '}
                {result.exponentBias}
              </p>
              <p>
                <span className="text-text-primary font-medium">存储阶码:</span>{' '}
                {result.exponentValue} (二进制: {result.exponent})
              </p>
              <p>
                <span className="text-text-primary font-medium">实际指数:</span>{' '}
                {result.actualExponent} = {result.exponentValue} - {result.exponentBias}
              </p>
              {result.isDenormalized && (
                <p className="text-amber-400">
                  ⚠️ 非规格化数 (阶码为0)
                </p>
              )}
              {result.isInfinity && (
                <p className="text-amber-400">
                  ⚠️ 无穷大
                </p>
              )}
              {result.isNaN && (
                <p className="text-amber-400">
                  ⚠️ 非数字 (NaN)
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </ToolLayout>
  )
}
