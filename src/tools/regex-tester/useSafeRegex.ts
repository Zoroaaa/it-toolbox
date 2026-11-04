import { useEffect, useRef, useState } from 'react'
import type { RegexResult } from '@core/regex'

const TIMEOUT_MS = 1000

interface SafeRegexState {
  result: RegexResult
  pending: boolean
  timedOut: boolean
}

/**
 * 在 Web Worker 中执行正则，超时后直接销毁 Worker。
 * 原生 RegExp 没有超时机制，灾难性回溯会阻塞调用线程；
 * 放进 Worker 后主线程始终可响应，超时通过 terminate() 强制中断。
 */
export function useSafeRegex(pattern: string, input: string, flags: string): SafeRegexState {
  const [state, setState] = useState<SafeRegexState>({ result: { matches: [] }, pending: false, timedOut: false })
  const workerRef = useRef<Worker | null>(null)
  const requestIdRef = useRef(0)
  const timerRef = useRef<number | null>(null)

  useEffect(() => {
    return () => {
      if (timerRef.current !== null) clearTimeout(timerRef.current)
      workerRef.current?.terminate()
      workerRef.current = null
    }
  }, [])

  useEffect(() => {
    if (!pattern) {
      // 清空表达式时直接销毁 Worker，避免卡在旧任务的线程继续占用 CPU
      workerRef.current?.terminate()
      workerRef.current = null
      setState({ result: { matches: [] }, pending: false, timedOut: false })
      return
    }

    const id = ++requestIdRef.current

    let worker = workerRef.current
    if (!worker) {
      worker = new Worker(new URL('./regexWorker.ts', import.meta.url), { type: 'module' })
      worker.onmessage = (event: MessageEvent<{ id: number } & RegexResult>) => {
        if (event.data.id !== requestIdRef.current) return
        if (timerRef.current !== null) {
          clearTimeout(timerRef.current)
          timerRef.current = null
        }
        const result: RegexResult = {
          matches: event.data.matches,
          error: event.data.error,
          truncated: event.data.truncated,
        }
        setState({ result, pending: false, timedOut: false })
      }
      workerRef.current = worker
    }

    setState(prev => ({ ...prev, pending: true, timedOut: false }))
    worker.postMessage({ id, pattern, input, flags })

    const targetWorker = worker
    if (timerRef.current !== null) clearTimeout(timerRef.current)
    timerRef.current = window.setTimeout(() => {
      if (requestIdRef.current !== id) return
      timerRef.current = null
      targetWorker.terminate()
      if (workerRef.current === targetWorker) workerRef.current = null
      setState({
        result: { matches: [], error: `执行超时（超过 ${TIMEOUT_MS}ms），表达式可能存在灾难性回溯，已强制终止` },
        pending: false,
        timedOut: true,
      })
    }, TIMEOUT_MS)

    return () => {
      // 输入变化时只取消本次计时；正在执行的任务会在下一次超时时被 terminate 中断
      if (timerRef.current !== null) {
        clearTimeout(timerRef.current)
        timerRef.current = null
      }
    }
  }, [pattern, input, flags])

  return state
}
