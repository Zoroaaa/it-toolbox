import React from 'react'
import ReactDOM from 'react-dom/client'
import { RouterProvider, createRouter } from '@tanstack/react-router'
import { routeTree } from './routeTree'
import { initTheme } from './store/app'
import i18n, { ensureLanguage } from './i18n'
import { ErrorBoundary } from './components/system/ErrorBoundary'
import './index.css'

const router = createRouter({
  routeTree,
  defaultPreload: 'intent',
  defaultPendingMs: 200,
  defaultPendingMinMs: 300,
})

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

async function bootstrap() {
  // 英文词典按需加载，加载完成后再渲染，避免先中文后英文的闪烁
  const language = await ensureLanguage(i18n.language)
  document.documentElement.lang = language

  ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
      <ErrorBoundary>
        <RouterProvider router={router} />
      </ErrorBoundary>
    </React.StrictMode>,
  )
}

void bootstrap()

if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    cleanup?.()
  })
}
