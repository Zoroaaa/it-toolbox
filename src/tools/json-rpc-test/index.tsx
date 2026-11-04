import { useState } from 'react'
import { Send, Copy, Check, AlertCircle, Clock } from 'lucide-react'
import { ToolLayout } from '@/components/tool/ToolLayout'
import { useClipboard } from '@/hooks/useClipboard'
import { meta } from './meta'

interface JsonRpcRequest {
  jsonrpc: '2.0'
  method: string
  params: unknown
  id: number | string
}

interface JsonRpcResponse {
  jsonrpc: '2.0'
  result?: unknown
  error?: { code: number; message: string; data?: unknown }
  id: number | string
}

interface HistoryItem {
  id: string
  timestamp: number
  url: string
  request: JsonRpcRequest
  response: JsonRpcResponse | null
  error: string | null
}

export default function JsonRpcTest() {
  const [url, setUrl] = useState('')
  const [method, setMethod] = useState('')
  const [params, setParams] = useState('{}')
  const [requestId, setRequestId] = useState('1')
  const [response, setResponse] = useState<JsonRpcResponse | null>(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [history, setHistory] = useState<HistoryItem[]>([])
  const { copy, copied } = useClipboard()

  const sendRequest = async () => {
    if (!url.trim() || !method.trim()) return

    let parsedParams: unknown
    try {
      parsedParams = JSON.parse(params)
    } catch {
      setError('参数 JSON 格式错误')
      return
    }

    const request: JsonRpcRequest = {
      jsonrpc: '2.0',
      method,
      params: parsedParams,
      id: requestId || Date.now(),
    }

    setLoading(true)
    setError('')
    setResponse(null)

    try {
      const res = await fetch('/api/proxy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url,
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(request),
        }),
      })
      const json = (await res.json()) as {
        success: boolean
        status?: number
        statusText?: string
        body?: string
        error?: string
      }

      if (!res.ok || !json.success) {
        const errorMsg = json.error ?? `请求失败${json.status ? `（HTTP ${json.status}）` : ''}`
        setError(errorMsg)
        setHistory(prev => [{
          id: Date.now().toString(),
          timestamp: Date.now(),
          url,
          request,
          response: null,
          error: errorMsg,
        }, ...prev].slice(0, 20))
        return
      }

      let rpcResponse: JsonRpcResponse
      try {
        rpcResponse = JSON.parse(json.body ?? '') as JsonRpcResponse
      } catch {
        const errorMsg = `响应不是合法 JSON（HTTP ${json.status}）`
        setError(errorMsg)
        return
      }

      setResponse(rpcResponse)
      setHistory(prev => [{
        id: Date.now().toString(),
        timestamp: Date.now(),
        url,
        request,
        response: rpcResponse,
        error: rpcResponse.error ? rpcResponse.error.message : null,
      }, ...prev].slice(0, 20))

      if (rpcResponse.error) setError(`JSON-RPC 错误 ${rpcResponse.error.code}：${rpcResponse.error.message}`)
    } catch (e) {
      const errorMsg = '网络错误：' + (e as Error).message
      setError(errorMsg)
    } finally {
      setLoading(false)
    }
  }

  const loadFromHistory = (item: HistoryItem) => {
    setUrl(item.url)
    setMethod(item.request.method)
    setParams(JSON.stringify(item.request.params, null, 2))
    setRequestId(String(item.request.id))
    if (item.response) setResponse(item.response)
    if (item.error) setError(item.error)
  }

  const examples = [
    { method: 'eth_blockNumber', params: '[]', url: 'https://eth.llamarpc.com' },
    { method: 'eth_getBalance', params: '["0x742d35Cc6634C0532925a3b844Bc454e4438f44e", "latest"]', url: 'https://eth.llamarpc.com' },
    { method: 'getblockcount', params: '[]', url: 'https://btc.example.com/rpc' },
  ]

  return (
    <ToolLayout meta={meta} onReset={() => { setUrl(''); setMethod(''); setParams('{}'); setRequestId('1'); setResponse(null); setError('') }}>
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <label className="text-xs font-medium text-text-muted uppercase tracking-wider">RPC 端点 URL</label>
          <input
            className="tool-input font-mono text-sm"
            placeholder="https://api.example.com/rpc"
            value={url}
            onChange={e => setUrl(e.target.value)}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-2">
            <label className="text-xs font-medium text-text-muted uppercase tracking-wider">方法名</label>
            <input
              className="tool-input font-mono text-sm"
              placeholder="eth_blockNumber"
              value={method}
              onChange={e => setMethod(e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-xs font-medium text-text-muted uppercase tracking-wider">请求 ID</label>
            <input
              className="tool-input font-mono text-sm"
              placeholder="1"
              value={requestId}
              onChange={e => setRequestId(e.target.value)}
            />
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-xs font-medium text-text-muted uppercase tracking-wider">参数（JSON）</label>
          <textarea
            className="tool-input font-mono text-sm h-24 resize-none"
            placeholder="[]"
            value={params}
            onChange={e => setParams(e.target.value)}
            spellCheck={false}
          />
        </div>

        <div className="flex flex-wrap gap-1.5">
          {examples.map((ex, i) => (
            <button
              key={i}
              onClick={() => { setUrl(ex.url); setMethod(ex.method); setParams(ex.params) }}
              className="px-2 py-1 text-xs rounded-md bg-bg-raised text-text-muted hover:text-text-primary hover:bg-bg-surface border border-border-base transition-colors"
            >
              {ex.method}
            </button>
          ))}
        </div>

        <button
          onClick={sendRequest}
          disabled={loading || !url.trim() || !method.trim()}
          className="btn-primary gap-2"
        >
          <Send className="w-4 h-4" />
          {loading ? '发送中...' : '发送请求'}
        </button>

        {error && (
          <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 flex gap-2 text-xs text-rose-400">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            {error}
          </div>
        )}

        {response && (
          <div className="bg-bg-surface rounded-lg border border-border-base overflow-hidden">
            <div className="px-4 py-2 bg-bg-raised border-b border-border-base flex items-center justify-between">
              <span className="text-xs font-medium text-text-muted uppercase tracking-wider">响应结果</span>
              <button onClick={() => copy(JSON.stringify(response, null, 2))} className="btn-ghost text-xs gap-1">
                {copied ? <Check className="w-3.5 h-3.5 text-accent" /> : <Copy className="w-3.5 h-3.5" />}
                复制
              </button>
            </div>
            <pre className="p-4 font-mono text-sm text-text-primary overflow-auto max-h-64">
              {JSON.stringify(response, null, 2)}
            </pre>
          </div>
        )}

        {history.length > 0 && (
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-text-muted uppercase tracking-wider">历史记录</span>
              <button onClick={() => setHistory([])} className="text-xs text-text-muted hover:text-text-primary">
                清空
              </button>
            </div>
            <div className="max-h-40 overflow-auto space-y-1">
              {history.map(item => (
                <button
                  key={item.id}
                  onClick={() => loadFromHistory(item)}
                  className="w-full p-2 rounded-lg bg-bg-raised border border-border-base hover:bg-bg-surface transition-colors text-left"
                >
                  <div className="flex items-center gap-2">
                    <Clock className="w-3 h-3 text-text-muted" />
                    <span className="font-mono text-xs text-text-primary">{item.request.method}</span>
                    <span className="text-xs text-text-muted ml-auto">
                      {new Date(item.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </ToolLayout>
  )
}
