import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface HistoryRecord {
  input: string
  timestamp: number
}

interface AppStore {
  // Favorites
  favorites: string[]
  toggleFavorite: (id: string) => void
  isFavorited: (id: string) => boolean

  // History: toolId -> recent inputs
  history: Record<string, HistoryRecord[]>
  addHistory: (toolId: string, input: string) => void
  getHistory: (toolId: string) => HistoryRecord[]

  // Recently used tool IDs
  recentTools: string[]
  addRecentTool: (id: string) => void

  // Theme
  theme: 'dark' | 'light'
  setTheme: (theme: 'dark' | 'light') => void
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
          const updated = [{ input, timestamp: Date.now() }, ...filtered].slice(0, 10)
          return { history: { ...s.history, [toolId]: updated } }
        })
      },
      getHistory: (toolId) => get().history[toolId] ?? [],

      recentTools: [],
      addRecentTool: (id) => set(s => ({
        recentTools: [id, ...s.recentTools.filter(t => t !== id)].slice(0, 20),
      })),

      theme: 'dark',
      setTheme: (theme) => {
        set({ theme })
        document.documentElement.classList.toggle('dark', theme === 'dark')
      },
    }),
    {
      name: 'it-toolbox-store',
      partialize: (s) => ({
        favorites: s.favorites,
        history: s.history,
        recentTools: s.recentTools,
        theme: s.theme,
      }),
    }
  )
)
