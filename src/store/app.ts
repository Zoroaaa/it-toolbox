import { create } from 'zustand'
import { createJSONStorage, persist, type StateStorage } from 'zustand/middleware'
import { getToolById } from '@/registry'

interface HistoryRecord {
  input: string
  timestamp: number
}

export type ThemeMode = 'dark' | 'light' | 'system'

/** 仅这些非敏感工具记录输入历史，避免密码/密钥类内容落盘 */
export const HISTORY_ENABLED = new Set([
  'json-formatter',
  'yaml-json',
  'toml-json',
  'xml-formatter',
  'css-formatter',
  'js-formatter',
  'sql-formatter',
  'base64',
  'url-encode',
  'case-converter',
  'text-counter',
  'text-diff',
  'text-transform',
  'cron-parser',
  'regex-tester',
  'json-path',
  'json-to-csv',
  'json-to-type',
  'line-sorter',
])

const LIMITS = {
  favorites: 200,
  historyPerTool: 10,
  historyTools: 30,
  recentTools: 20,
}

interface AppStore {
  favorites: string[]
  toggleFavorite: (id: string) => void
  isFavorited: (id: string) => boolean

  history: Record<string, HistoryRecord[]>
  addHistory: (toolId: string, input: string) => void
  getHistory: (toolId: string) => HistoryRecord[]
  removeHistory: (toolId: string, timestamp: number) => void
  clearHistory: (toolId?: string) => void

  recentTools: string[]
  addRecentTool: (id: string) => void

  themeMode: ThemeMode
  resolvedTheme: 'dark' | 'light'
  setThemeMode: (mode: ThemeMode) => void
  applyTheme: () => void
  getSystemTheme: () => 'dark' | 'light'

  mobileMenuOpen: boolean
  setMobileMenuOpen: (open: boolean) => void
  toggleMobileMenu: () => void
}

const getSystemTheme = (): 'dark' | 'light' => {
  if (typeof window === 'undefined') return 'dark'
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

const applyThemeToDOM = (theme: 'dark' | 'light') => {
  const html = document.documentElement

  html.classList.add('theme-transitioning')

  if (theme === 'dark') {
    html.classList.add('dark')
  } else {
    html.classList.remove('dark')
  }

  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      html.classList.remove('theme-transitioning')
    })
  })
}

/** 写入节流，避免每次 set 都同步序列化整份历史 */
function createThrottledStorage(wait = 200): StateStorage {
  let timer: ReturnType<typeof setTimeout> | null = null
  const pending = new Map<string, string>()
  // 创建时固定 storage 引用：节流写入可能在环境销毁后才触发（如测试 teardown），
  // 此时全局 localStorage 已不存在，直接用全局变量会抛 ReferenceError。
  const storage = typeof localStorage === 'undefined' ? null : localStorage

  const flush = () => {
    if (timer) {
      clearTimeout(timer)
      timer = null
    }
    if (!storage) return
    for (const [key, value] of pending) storage.setItem(key, value)
    pending.clear()
  }

  if (typeof window !== 'undefined') {
    window.addEventListener('pagehide', flush)
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') flush()
    })
  }

  return {
    getItem: (name) => storage?.getItem(name) ?? null,
    setItem: (name, value) => {
      pending.set(name, value)
      if (timer) return
      timer = setTimeout(flush, wait)
    },
    removeItem: (name) => {
      pending.delete(name)
      storage?.removeItem(name)
    },
  }
}

const isValidToolId = (id: unknown): id is string => typeof id === 'string' && Boolean(getToolById(id))

function sanitizeHistory(input: unknown): Record<string, HistoryRecord[]> {
  if (!input || typeof input !== 'object') return {}
  const result: Record<string, HistoryRecord[]> = {}

  for (const [toolId, records] of Object.entries(input as Record<string, unknown>)) {
    if (!HISTORY_ENABLED.has(toolId) || !isValidToolId(toolId) || !Array.isArray(records)) continue
    const cleaned = records
      .filter((record): record is HistoryRecord => {
        if (!record || typeof record !== 'object') return false
        const item = record as Partial<HistoryRecord>
        return typeof item.input === 'string' && typeof item.timestamp === 'number'
      })
      .slice(0, LIMITS.historyPerTool)
    if (cleaned.length) result[toolId] = cleaned
  }

  return Object.fromEntries(Object.entries(result).slice(0, LIMITS.historyTools))
}

export const useAppStore = create<AppStore>()(
  persist(
    (set, get) => ({
      favorites: [],
      toggleFavorite: (id) => set(s => {
        const favorites = s.favorites.includes(id)
          ? s.favorites.filter(f => f !== id)
          : [id, ...s.favorites].slice(0, LIMITS.favorites)
        return { favorites }
      }),
      isFavorited: (id) => get().favorites.includes(id),

      history: {},
      addHistory: (toolId, input) => {
        if (!HISTORY_ENABLED.has(toolId)) return
        if (!input.trim()) return
        set(s => {
          const prev = s.history[toolId] ?? []
          const filtered = prev.filter(r => r.input !== input)
          // 同一毫秒内连续写入时保证 timestamp 唯一，避免删除历史时误删多条
          const timestamp = Math.max(Date.now(), (prev[0]?.timestamp ?? 0) + 1)
          const updated = [{ input, timestamp }, ...filtered].slice(0, LIMITS.historyPerTool)
          const history = { ...s.history, [toolId]: updated }

          // 工具数超限时淘汰最早写入的键
          const keys = Object.keys(history)
          if (keys.length > LIMITS.historyTools) {
            const drop = keys.slice(0, keys.length - LIMITS.historyTools)
            for (const key of drop) delete history[key]
          }
          return { history }
        })
      },
      getHistory: (toolId) => get().history[toolId] ?? [],
      removeHistory: (toolId, timestamp) => set(s => ({
        history: {
          ...s.history,
          [toolId]: (s.history[toolId] ?? []).filter(record => record.timestamp !== timestamp),
        },
      })),
      clearHistory: (toolId) => set(s => {
        if (toolId) {
          const history = { ...s.history }
          delete history[toolId]
          return { history }
        }
        return { history: {} }
      }),

      recentTools: [],
      addRecentTool: (id) => set(s => ({
        recentTools: [id, ...s.recentTools.filter(t => t !== id)].slice(0, LIMITS.recentTools),
      })),

      themeMode: 'system',
      resolvedTheme: 'dark',

      getSystemTheme,

      setThemeMode: (mode) => {
        set({ themeMode: mode })
        get().applyTheme()
      },

      applyTheme: () => {
        const { themeMode } = get()
        const resolvedTheme = themeMode === 'system' ? getSystemTheme() : themeMode
        set({ resolvedTheme })
        applyThemeToDOM(resolvedTheme)
      },

      mobileMenuOpen: false,
      setMobileMenuOpen: (open) => set({ mobileMenuOpen: open }),
      toggleMobileMenu: () => set(s => ({ mobileMenuOpen: !s.mobileMenuOpen })),
    }),
    {
      name: 'it-toolbox-store',
      version: 1,
      storage: createJSONStorage(() => createThrottledStorage()),
      partialize: (s) => ({
        favorites: s.favorites,
        history: s.history,
        recentTools: s.recentTools,
        themeMode: s.themeMode,
      }),
      migrate: (persistedState) => {
        const state = (persistedState ?? {}) as Partial<AppStore>

        const favorites = Array.isArray(state.favorites)
          ? state.favorites.filter(isValidToolId).slice(0, LIMITS.favorites)
          : []
        const recentTools = Array.isArray(state.recentTools)
          ? state.recentTools.filter(isValidToolId).slice(0, LIMITS.recentTools)
          : []
        const themeMode =
          state.themeMode === 'dark' || state.themeMode === 'light' || state.themeMode === 'system'
            ? state.themeMode
            : 'system'

        return {
          favorites,
          recentTools,
          history: sanitizeHistory(state.history),
          themeMode,
        }
      },
    }
  )
)

export const initThemeListener = () => {
  const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')

  const handleChange = () => {
    const store = useAppStore.getState()
    if (store.themeMode === 'system') {
      store.applyTheme()
    }
  }

  mediaQuery.addEventListener('change', handleChange)

  return () => mediaQuery.removeEventListener('change', handleChange)
}

export const initTheme = () => {
  const store = useAppStore.getState()
  store.applyTheme()
  return initThemeListener()
}
