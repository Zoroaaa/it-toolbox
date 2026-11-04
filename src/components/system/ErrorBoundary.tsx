import { Component, type ErrorInfo, type ReactNode } from 'react'
import { AlertTriangle, RotateCcw } from 'lucide-react'

interface ErrorBoundaryProps {
  children: ReactNode
  fallback?: (error: Error, reset: () => void) => ReactNode
  resetKeys?: unknown[]
  onReset?: () => void
}

interface ErrorBoundaryState {
  error: Error | null
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { error: null }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[ErrorBoundary]', error, info.componentStack)
  }

  componentDidUpdate(previous: ErrorBoundaryProps) {
    if (!this.state.error) return
    const changed = (previous.resetKeys ?? []).some(
      (value, index) => value !== (this.props.resetKeys ?? [])[index],
    )
    if (changed) this.reset()
  }

  private reset = () => {
    this.setState({ error: null })
    this.props.onReset?.()
  }

  render() {
    const { error } = this.state
    if (!error) return this.props.children
    if (this.props.fallback) return this.props.fallback(error, this.reset)

    return (
      <div className="p-4 rounded-xl border border-rose-500/30 bg-rose-500/10">
        <div className="flex items-center gap-2 mb-2">
          <AlertTriangle className="w-4 h-4 text-rose-400" />
          <span className="text-sm font-medium text-text-primary">此工具运行出错</span>
        </div>
        <p className="text-xs text-text-secondary break-all">{error.message || '未知错误'}</p>
        <button onClick={this.reset} className="btn-secondary mt-3 gap-1.5 text-xs">
          <RotateCcw className="w-3.5 h-3.5" />
          重试
        </button>
      </div>
    )
  }
}
