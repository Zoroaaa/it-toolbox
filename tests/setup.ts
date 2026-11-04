import { vi } from 'vitest'

// happy-dom 未实现 matchMedia，主题逻辑依赖它
if (typeof window !== 'undefined' && !window.matchMedia) {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: (query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }),
  })
}

if (typeof globalThis.ResizeObserver === 'undefined') {
  globalThis.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  } as unknown as typeof ResizeObserver
}

// 固定随机源，避免生成器测试抖动
let uuidCounter = 0
if (!globalThis.crypto) {
  Object.defineProperty(globalThis, 'crypto', { value: {} })
}
if (!globalThis.crypto.randomUUID) {
  Object.defineProperty(globalThis.crypto, 'randomUUID', {
    value: () => {
      uuidCounter += 1
      return `00000000-0000-4000-8000-${String(uuidCounter).padStart(12, '0')}`
    },
  })
}
