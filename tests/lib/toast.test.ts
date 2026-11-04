import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { toast, dismissToast, getToasts } from '@/lib/toast'

const clear = () => {
  for (const item of [...getToasts()]) dismissToast(item.id)
}

describe('Toast 队列', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    clear()
  })

  afterEach(() => {
    clear()
    vi.useRealTimers()
  })

  it('success 入队并在超时后自动移除', () => {
    toast.success('已复制', 1000)
    expect(getToasts()).toHaveLength(1)
    expect(getToasts()[0].message).toBe('已复制')

    vi.advanceTimersByTime(1000)
    expect(getToasts()).toHaveLength(0)
  })

  it('error 默认停留更久', () => {
    toast.error('失败')
    vi.advanceTimersByTime(3000)
    expect(getToasts()).toHaveLength(1)
    vi.advanceTimersByTime(3000)
    expect(getToasts()).toHaveLength(0)
  })

  it('最多保留 3 条，超出丢弃最早一条', () => {
    toast.info('1', 0)
    toast.info('2', 0)
    toast.info('3', 0)
    toast.info('4', 0)

    expect(getToasts().map((item) => item.message)).toEqual(['2', '3', '4'])
  })

  it('dismissToast 只移除指定条目', () => {
    const first = toast.info('a', 0)
    toast.info('b', 0)
    dismissToast(first)
    expect(getToasts().map((item) => item.message)).toEqual(['b'])
  })
})
