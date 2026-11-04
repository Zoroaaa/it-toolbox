export type CallAiResult<T> = { ok: true; data: T } | { ok: false; error: string }

const DEFAULT_TIMEOUT_MS = 30000

/**
 * 统一 AI 接口调用：超时中断、非 JSON 响应兜底、HTTP 状态与业务错误统一成 error。
 */
export async function callAi<T>(
  endpoint: string,
  payload: unknown,
  timeoutMs: number = DEFAULT_TIMEOUT_MS,
): Promise<CallAiResult<T>> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)

  try {
    const res = await fetch(`/api/ai/${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: controller.signal,
    })

    const text = await res.text()
    let json: { success?: boolean; data?: T; error?: string }
    try {
      json = JSON.parse(text) as typeof json
    } catch {
      return { ok: false, error: `服务返回非 JSON 响应（HTTP ${res.status}）` }
    }

    if (!res.ok || !json.success) {
      return { ok: false, error: json.error ?? `请求失败（HTTP ${res.status}）` }
    }
    if (json.data === undefined || json.data === null) {
      return { ok: false, error: '服务返回数据为空' }
    }

    return { ok: true, data: json.data }
  } catch (e) {
    const error = e as Error
    if (error.name === 'AbortError') {
      return { ok: false, error: `请求超时（${Math.round(timeoutMs / 1000)}s），请稍后重试` }
    }
    return { ok: false, error: `网络错误：${error.message}` }
  } finally {
    clearTimeout(timer)
  }
}
