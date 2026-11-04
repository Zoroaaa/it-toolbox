import { useSyncExternalStore } from 'react'

export type ToastVariant = 'success' | 'error' | 'info'

export interface ToastItem {
  id: number
  message: string
  variant: ToastVariant
  duration: number
}

let nextId = 1
let items: ToastItem[] = []
const listeners = new Set<() => void>()

const emit = () => listeners.forEach((listener) => listener())

function push(message: string, variant: ToastVariant, duration: number) {
  const item: ToastItem = { id: nextId++, message, variant, duration }
  items = [...items, item].slice(-3)
  emit()

  if (duration > 0) {
    setTimeout(() => dismissToast(item.id), duration)
  }
  return item.id
}

export function dismissToast(id: number) {
  items = items.filter((item) => item.id !== id)
  emit()
}

export const toast = {
  success: (message: string, duration = 2500) => push(message, 'success', duration),
  error: (message: string, duration = 6000) => push(message, 'error', duration),
  info: (message: string, duration = 3000) => push(message, 'info', duration),
}

const subscribe = (listener: () => void) => {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

const getSnapshot = () => items

export function getToasts(): ToastItem[] {
  return items
}

export function useToasts(): ToastItem[] {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot)
}
