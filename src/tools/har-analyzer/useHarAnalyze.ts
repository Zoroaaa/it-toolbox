import { useCallback, useEffect, useRef, useState } from 'react'
import type { HarReport } from '@core/har'
import type { HarResponse } from './harWorker'

interface HarState {
  running: boolean
  error: string
  report: HarReport | null
}

const EMPTY: HarState = { running: false, error: '', report: null }

export function useHarAnalyze() {
  const [state, setState] = useState<HarState>(EMPTY)
  const workerRef = useRef<Worker | null>(null)
  const requestIdRef = useRef(0)

  useEffect(() => {
    return () => {
      workerRef.current?.terminate()
      workerRef.current = null
    }
  }, [])

  const analyze = useCallback((text: string) => {
    const id = ++requestIdRef.current
    let worker = workerRef.current
    if (!worker) {
      worker = new Worker(new URL('./harWorker.ts', import.meta.url), { type: 'module' })
      workerRef.current = worker
    }

    worker.onmessage = (event: MessageEvent<HarResponse>) => {
      const response = event.data
      if (response.id !== requestIdRef.current) return
      if (!response.ok || !response.report) {
        setState({ running: false, error: response.error ?? '解析失败', report: null })
        return
      }
      setState({ running: false, error: '', report: response.report })
    }

    setState((prev) => ({ ...prev, running: true, error: '' }))
    worker.postMessage({ id, text })
  }, [])

  const reset = useCallback(() => {
    requestIdRef.current++
    setState(EMPTY)
  }, [])

  return { ...state, analyze, reset }
}
