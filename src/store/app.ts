import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface HistoryRecord {
  input: string
  timestamp: number
}

export type ThemeMode = 'dark' | 'light' | 'system'

interface AppStore {
  favorites: string[]
  toggleFavorite: (id: string) => void
  isFavorited: (id: string) => boolean

  history: Record<string, HistoryRecord[]>
  addHistory: (toolId: string, input: string) => void
  getHistory: (toolId: string) => HistoryRecord[]

  recentTools: string[]
  addRecentTool: (id: string) => void

  themeMode: ThemeMode
  resolvedTheme: 'dark' | 'light'
  setThemeMode: (mode: ThemeMode) => void
  applyTheme: () => void
  getSystemTheme: () => 'dark' | 'light'
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

export const useAppStore = create<AppStore>()(
  persist(
    (set, get) => ({
      favorites: [],
      toggleFavorite: (id) => set(s => ({
        favorites: s.favorites.includes(id)
          ? s.favorites.filter(f => f !== id)
          : [id, ...s.favorites],
      })),
      isFavorited: (id) => get().favorites.includes(id),

      history: {},
      addHistory: (toolId, input) => {
        if (!input.trim()) return
        set(s => {
          const prev = s.history[toolId] ?? []
          const filtered = prev.filter(r => r.input !== input)
          const updated = [{ input, timestamp: Date.now() }, ...filtered].slice(0, 20)
          return { history: { ...s.history, [toolId]: updated } }
        })
      },
      getHistory: (toolId) => get().history[toolId] ?? [],

      recentTools: [],
      addRecentTool: (id) => set(s => ({
        recentTools: [id, ...s.recentTools.filter(t => t !== id)].slice(0, 20),
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
    }),
    {
      name: 'it-toolbox-store',
      partialize: (s) => ({
        favorites: s.favorites,
        history: s.history,
        recentTools: s.recentTools,
        themeMode: s.themeMode,
      }),
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
