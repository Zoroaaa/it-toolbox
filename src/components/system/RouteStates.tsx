import { AlertTriangle, RotateCcw, Home } from 'lucide-react'
import { Link } from '@tanstack/react-router'

export function RoutePending() {
  return (
    <div className="p-6 max-w-5xl mx-auto animate-pulse">
      <div className="h-7 w-40 bg-bg-raised rounded mb-3" />
      <div className="h-4 w-64 bg-bg-raised rounded mb-8" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {Array.from({ length: 6 }).map((_, index) => (
          <div key={index} className="h-24 bg-bg-raised rounded-lg" />
        ))}
      </div>
    </div>
  )
}

export function RouteError({ error, reset }: { error: Error; reset?: () => void }) {
  return (
    <div className="p-6 max-w-xl mx-auto">
      <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-5">
        <div className="flex items-center gap-2 mb-2">
          <AlertTriangle className="w-5 h-5 text-rose-400" />
          <h1 className="text-base font-semibold text-text-primary">页面加载失败</h1>
        </div>
        <p className="text-sm text-text-secondary break-all">{error.message || '未知错误'}</p>
        <div className="flex gap-2 mt-4">
          <button onClick={() => (reset ? reset() : window.location.reload())} className="btn-primary gap-1.5">
            <RotateCcw className="w-4 h-4" />
            重试
          </button>
          <Link to="/" className="btn-secondary gap-1.5">
            <Home className="w-4 h-4" />
            返回首页
          </Link>
        </div>
      </div>
    </div>
  )
}

export function RouteNotFound() {
  return (
    <div className="flex flex-col items-center justify-center h-64 gap-3 text-center">
      <p className="text-lg font-medium text-text-primary">页面不存在</p>
      <p className="text-sm text-text-muted">链接可能已失效，或工具已下线</p>
      <Link to="/" className="btn-primary mt-2">
        返回首页
      </Link>
    </div>
  )
}
