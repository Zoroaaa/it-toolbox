import { lazy, Suspense } from 'react'
import { useParams } from '@tanstack/react-router'
import { Loader2 } from 'lucide-react'

const toolComponents: Record<string, React.LazyExoticComponent<() => JSX.Element>> = {
  'json-formatter': lazy(() => import('@/tools/json-formatter/index')),
  'base64': lazy(() => import('@/tools/base64/index')),
  'url-encode': lazy(() => import('@/tools/url-encode/index')),
  'jwt-decoder': lazy(() => import('@/tools/jwt-decoder/index')),
  'uuid-generator': lazy(() => import('@/tools/uuid-generator/index')),
  'hash-calculator': lazy(() => import('@/tools/hash-calculator/index')),
  'password-gen': lazy(() => import('@/tools/password-gen/index')),
  'timestamp': lazy(() => import('@/tools/timestamp/index')),
  'case-converter': lazy(() => import('@/tools/case-converter/index')),
  'lorem-ipsum': lazy(() => import('@/tools/lorem-ipsum/index')),
  'color-picker': lazy(() => import('@/tools/color-picker/index')),
  'markdown-preview': lazy(() => import('@/tools/markdown-preview/index')),
  'regex-tester': lazy(() => import('@/tools/regex-tester/index')),
  'number-base': lazy(() => import('@/tools/number-base/index')),
  'text-counter': lazy(() => import('@/tools/text-counter/index')),
}

function ToolSkeleton() {
  return (
    <div className="flex flex-col gap-4 animate-pulse">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-bg-raised" />
        <div className="space-y-2">
          <div className="h-4 w-32 bg-bg-raised rounded" />
          <div className="h-3 w-48 bg-bg-raised rounded" />
        </div>
      </div>
      <div className="h-10 bg-bg-raised rounded-lg w-64" />
      <div className="grid grid-cols-2 gap-4">
        <div className="h-64 bg-bg-raised rounded-lg" />
        <div className="h-64 bg-bg-raised rounded-lg" />
      </div>
    </div>
  )
}

function ComingSoon({ id }: { id: string }) {
  return (
    <div className="flex flex-col items-center justify-center h-64 gap-3 text-center">
      <div className="w-12 h-12 rounded-xl bg-bg-raised flex items-center justify-center">
        <Loader2 className="w-6 h-6 text-text-muted" />
      </div>
      <div>
        <p className="text-text-secondary font-medium">即将上线</p>
        <p className="text-text-muted text-sm mt-1">
          工具 <code className="font-mono text-xs bg-bg-raised px-1.5 py-0.5 rounded">{id}</code> 正在开发中
        </p>
      </div>
    </div>
  )
}

export function ToolPage() {
  const { id } = useParams({ from: '/tool/$id' })
  const Component = toolComponents[id]

  if (!Component) return <ComingSoon id={id} />

  return (
    <Suspense fallback={<ToolSkeleton />}>
      <Component />
    </Suspense>
  )
}
