import { analyzeHar, type HarReport } from '@core/har'

interface HarRequest {
  id: number
  text: string
}

export interface HarResponse {
  id: number
  ok: boolean
  error?: string
  report?: HarReport
}

const ctx = self as unknown as {
  onmessage: ((event: MessageEvent<HarRequest>) => void) | null
  postMessage: (message: HarResponse) => void
}

/**
 * 解析与聚合都放在 Worker：10MB 以上的 HAR 有数千条请求，
 * 在主线程 JSON.parse + 多轮聚合会明显掉帧。
 */
ctx.onmessage = (event) => {
  const { id, text } = event.data
  const result = analyzeHar(text)
  if (!result.ok) {
    ctx.postMessage({ id, ok: false, error: result.error })
    return
  }
  ctx.postMessage({ id, ok: true, report: result.value })
}
