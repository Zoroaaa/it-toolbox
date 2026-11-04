import { useState, useEffect, useCallback } from 'react'
import { ArrowRightLeft, Loader2, RefreshCw, TrendingUp, AlertCircle } from 'lucide-react'
import { ToolLayout } from '@/components/tool/ToolLayout'
import { meta } from './meta'
import type { ApiResponse, ExchangeRateInfo } from '@toolbox/types/api'

const POPULAR_CURRENCIES = [
  { code: 'CNY', name: '人民币', symbol: '¥' },
  { code: 'USD', name: '美元', symbol: '$' },
  { code: 'EUR', name: '欧元', symbol: '€' },
  { code: 'GBP', name: '英镑', symbol: '£' },
  { code: 'JPY', name: '日元', symbol: '¥' },
  { code: 'KRW', name: '韩元', symbol: '₩' },
  { code: 'HKD', name: '港币', symbol: 'HK$' },
  { code: 'TWD', name: '新台币', symbol: 'NT$' },
  { code: 'SGD', name: '新加坡元', symbol: 'S$' },
  { code: 'AUD', name: '澳元', symbol: 'A$' },
  { code: 'CAD', name: '加元', symbol: 'C$' },
  { code: 'CHF', name: '瑞士法郎', symbol: 'Fr' },
  { code: 'THB', name: '泰铢', symbol: '฿' },
  { code: 'MYR', name: '马来西亚林吉特', symbol: 'RM' },
  { code: 'INR', name: '印度卢比', symbol: '₹' },
  { code: 'RUB', name: '俄罗斯卢布', symbol: '₽' },
]

interface ExchangeRateResponse {
  rate: number
  from: string
  to: string
  amount: number
  result: number
  timestamp: number
  cached: boolean
}

export default function ExchangeRate() {
  const [amount, setAmount] = useState<string>('1')
  const [fromCurrency, setFromCurrency] = useState('USD')
  const [toCurrency, setToCurrency] = useState('CNY')
  const [result, setResult] = useState<ExchangeRateResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [rates, setRates] = useState<ExchangeRateInfo | null>(null)

  const fetchRate = useCallback(async () => {
    if (!amount || isNaN(Number(amount))) return
    
    setLoading(true)
    setError('')
    
    try {
      const res = await fetch(
        `/api/exchange?from=${fromCurrency}&to=${toCurrency}&amount=${amount}`
      )
      const data: ApiResponse<ExchangeRateResponse> = await res.json()
      
      if (data.success && data.data) {
        setResult(data.data)
      } else {
        setError(data.error || '获取汇率失败')
      }
    } catch (e) {
      setError('网络请求失败：' + (e as Error).message)
    }
    
    setLoading(false)
  }, [amount, fromCurrency, toCurrency])

  const fetchRates = useCallback(async () => {
    try {
      const res = await fetch('/api/exchange/rates?base=USD')
      const data: ApiResponse<ExchangeRateInfo> = await res.json()
      if (data.success && data.data) {
        setRates(data.data)
      }
    } catch {
      // 静默失败
    }
  }, [])

  useEffect(() => {
    fetchRate()
    fetchRates()
  }, [fetchRate, fetchRates])

  const swapCurrencies = () => {
    setFromCurrency(toCurrency)
    setToCurrency(fromCurrency)
  }

  const reset = () => {
    setAmount('1')
    setFromCurrency('USD')
    setToCurrency('CNY')
    setResult(null)
    setError('')
    fetchRate()
  }

  const getCurrencyInfo = (code: string) => {
    return POPULAR_CURRENCIES.find(c => c.code === code) || { code, name: code, symbol: '' }
  }

  const formatNumber = (num: number, decimals = 4) => {
    if (num >= 1000000) {
      return num.toLocaleString('zh-CN', { maximumFractionDigits: 2 })
    }
    return num.toLocaleString('zh-CN', { minimumFractionDigits: decimals > 2 ? 4 : 2, maximumFractionDigits: decimals })
  }

  return (
    <ToolLayout meta={meta} onReset={reset}>
      <div className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr,auto,1fr] gap-4 items-end">
          <div className="space-y-3">
            <label className="block text-sm text-text-secondary">金额</label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="输入金额"
              className="w-full px-4 py-3 bg-bg-raised border border-border-base rounded-lg text-text-primary text-lg font-mono placeholder:text-text-muted focus:outline-none focus:border-accent"
            />
            <select
              value={fromCurrency}
              onChange={(e) => setFromCurrency(e.target.value)}
              className="w-full px-4 py-3 bg-bg-raised border border-border-base rounded-lg text-text-primary focus:outline-none focus:border-accent"
            >
              {POPULAR_CURRENCIES.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.code} - {c.name}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={swapCurrencies}
            className="btn-ghost p-3 rounded-full hover:bg-bg-raised self-center lg:self-end mb-1"
            title="交换货币"
          >
            <ArrowRightLeft className="w-5 h-5" />
          </button>

          <div className="space-y-3">
            <label className="block text-sm text-text-secondary">目标货币</label>
            <div className="h-[50px] px-4 py-3 bg-bg-base border border-border-base rounded-lg text-text-primary text-lg font-mono">
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin text-accent" />
              ) : result ? (
                formatNumber(result.result)
              ) : (
                <span className="text-text-muted">-</span>
              )}
            </div>
            <select
              value={toCurrency}
              onChange={(e) => setToCurrency(e.target.value)}
              className="w-full px-4 py-3 bg-bg-raised border border-border-base rounded-lg text-text-primary focus:outline-none focus:border-accent"
            >
              {POPULAR_CURRENCIES.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.code} - {c.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {error && (
          <div className="flex items-center gap-2 p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <p className="text-sm">{error}</p>
          </div>
        )}

        {result && !error && (
          <div className="bg-bg-raised border border-border-base rounded-lg p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-text-secondary">汇率</span>
              <span className="font-mono text-text-primary">
                1 {result.from} = {formatNumber(result.rate, 6)} {result.to}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-text-secondary">更新时间</span>
              <span className="text-text-primary">
                {new Date(result.timestamp * 1000).toLocaleString('zh-CN')}
                {result.cached && <span className="ml-2 text-xs text-text-muted">(缓存)</span>}
              </span>
            </div>
          </div>
        )}

        <div className="flex items-center justify-between">
          <button
            onClick={fetchRate}
            disabled={loading}
            className="btn-primary flex items-center gap-2"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4" />
            )}
            刷新汇率
          </button>
        </div>

        {rates && (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-text-secondary">
              <TrendingUp className="w-4 h-4" />
              <span className="text-sm font-medium">热门汇率 (基准: USD)</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {['CNY', 'EUR', 'GBP', 'JPY', 'KRW', 'HKD', 'SGD', 'AUD'].map((code) => {
                const rate = rates.rates[code]
                const info = getCurrencyInfo(code)
                if (!rate) return null
                return (
                  <div
                    key={code}
                    className="bg-bg-raised border border-border-base rounded-lg p-3 cursor-pointer hover:border-accent transition-colors"
                    onClick={() => setToCurrency(code)}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-text-muted">{code}</span>
                      <span className="text-xs text-text-muted">{info.symbol}</span>
                    </div>
                    <p className="font-mono text-text-primary">{formatNumber(rate, 4)}</p>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </ToolLayout>
  )
}
