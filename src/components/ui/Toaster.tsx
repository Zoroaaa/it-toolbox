import { X, CheckCircle2, AlertCircle, Info } from 'lucide-react'
import { dismissToast, useToasts, type ToastVariant } from '@/lib/toast'

const ICONS: Record<ToastVariant, typeof Info> = {
  success: CheckCircle2,
  error: AlertCircle,
  info: Info,
}

const STYLES: Record<ToastVariant, string> = {
  success: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-500',
  error: 'border-rose-500/30 bg-rose-500/10 text-rose-400',
  info: 'border-border-strong bg-bg-surface text-text-secondary',
}

export function Toaster() {
  const toasts = useToasts()
  if (toasts.length === 0) return null

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-5 right-5 z-[60] flex flex-col gap-2 max-w-[calc(100vw-2.5rem)]"
    >
      {toasts.map((item) => {
        const Icon = ICONS[item.variant]
        return (
          <div
            key={item.id}
            className={`flex items-start gap-2 rounded-lg border px-3 py-2 text-sm shadow-theme-lg backdrop-blur-sm ${STYLES[item.variant]}`}
          >
            <Icon className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <span className="flex-1 break-all">{item.message}</span>
            <button
              onClick={() => dismissToast(item.id)}
              className="opacity-60 hover:opacity-100 transition-opacity"
              aria-label="关闭提示"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )
      })}
    </div>
  )
}
