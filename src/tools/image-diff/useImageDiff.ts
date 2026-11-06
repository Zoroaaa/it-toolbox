import { useEffect, useRef, useState } from 'react'
import type { DiffResponse } from './diffWorker'

export interface DiffData {
  width: number
  height: number
  widthA: number
  heightA: number
  widthB: number
  heightB: number
  diffPixels: number
  ratio: number
}

interface DiffState {
  running: boolean
  error: string
  data: DiffData | null
  diffUrl: string
}

const EMPTY: DiffState = { running: false, error: '', data: null, diffUrl: '' }

/**
 * 在 Worker 中解码并逐像素比对。
 * 大图解码与 O(width×height) 的逐像素循环放主线程会直接卡住交互，
 * 这也是本工具验收标准里「不阻塞主线程」的实现方式。
 */
export function useImageDiff(a: Blob | null, b: Blob | null, threshold: number): DiffState {
  const [state, setState] = useState<DiffState>(EMPTY)
  const workerRef = useRef<Worker | null>(null)
  const requestIdRef = useRef(0)
  const urlRef = useRef('')

  useEffect(() => {
    return () => {
      workerRef.current?.terminate()
      workerRef.current = null
      if (urlRef.current) URL.revokeObjectURL(urlRef.current)
    }
  }, [])

  useEffect(() => {
    if (!a || !b) {
      setState(EMPTY)
      if (urlRef.current) {
        URL.revokeObjectURL(urlRef.current)
        urlRef.current = ''
      }
      return
    }

    const id = ++requestIdRef.current
    let worker = workerRef.current
    if (!worker) {
      worker = new Worker(new URL('./diffWorker.ts', import.meta.url), { type: 'module' })
      workerRef.current = worker
    }

    worker.onmessage = (event: MessageEvent<DiffResponse>) => {
      const response = event.data
      if (response.id !== requestIdRef.current) return

      if (!response.ok) {
        setState({ ...EMPTY, error: response.error ?? '比对失败' })
        return
      }

      if (urlRef.current) URL.revokeObjectURL(urlRef.current)
      const diffUrl = response.diffBlob ? URL.createObjectURL(response.diffBlob) : ''
      urlRef.current = diffUrl

      setState({
        running: false,
        error: '',
        data: {
          width: response.width,
          height: response.height,
          widthA: response.widthA,
          heightA: response.heightA,
          widthB: response.widthB,
          heightB: response.heightB,
          diffPixels: response.diffPixels,
          ratio: response.ratio,
        },
        diffUrl,
      })
    }

    setState((prev) => ({ ...prev, running: true, error: '' }))
    worker.postMessage({ id, a, b, threshold })
  }, [a, b, threshold])

  return state
}
