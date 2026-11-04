import React from 'react'
import ReactDOM from 'react-dom/client'
import { RouterProvider, createRouter } from '@tanstack/react-router'
import { routeTree } from './routeTree'
import { initTheme } from './store/app'
import './i18n'
import './index.css'

const router = createRouter({ routeTree })

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}

const cleanup = initTheme()

// 新版部署后旧 chunk 被回收会导致动态导入失败：自动刷新一次，避免白屏
if (typeof window !== 'undefined') {
  window.addEventListener('vite:preloadError', (event) => {
    event.preventDefault()
    const key = 'it-toolbox-chunk-reload'
    const last = Number(sessionStorage.getItem(key) ?? 0)
    if (Date.now() - last > 10000) {
      sessionStorage.setItem(key, String(Date.now()))
      window.location.reload()
    }
  })
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>,
)

if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    cleanup?.()
  })
}
