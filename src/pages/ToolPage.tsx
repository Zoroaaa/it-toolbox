import { lazy, Suspense, useEffect } from 'react'
import { useParams } from '@tanstack/react-router'
import { Loader2 } from 'lucide-react'
import { useAppStore } from '@/store/app'

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
  'aes-encrypt': lazy(() => import('@/tools/aes-encrypt/index')),
  'ascii-table': lazy(() => import('@/tools/ascii-table/index')),
  'bcrypt': lazy(() => import('@/tools/bcrypt/index')),
  'binary-text': lazy(() => import('@/tools/binary-text/index')),
  'box-shadow-gen': lazy(() => import('@/tools/box-shadow-gen/index')),
  'calendar-gen': lazy(() => import('@/tools/calendar-gen/index')),
  'cert-decoder': lazy(() => import('@/tools/cert-decoder/index')),
  'color-blindness': lazy(() => import('@/tools/color-blindness/index')),
  'color-palette': lazy(() => import('@/tools/color-palette/index')),
  'contrast-checker': lazy(() => import('@/tools/contrast-checker/index')),
  'cron-parser': lazy(() => import('@/tools/cron-parser/index')),
  'css-formatter': lazy(() => import('@/tools/css-formatter/index')),
  'css-gradient': lazy(() => import('@/tools/css-gradient/index')),
  'csv-viewer': lazy(() => import('@/tools/csv-viewer/index')),
  'curl-converter': lazy(() => import('@/tools/curl-converter/index')),
  'date-calc': lazy(() => import('@/tools/date-calc/index')),
  'duration-format': lazy(() => import('@/tools/duration-format/index')),
  'faker-data': lazy(() => import('@/tools/faker-data/index')),
  'hex-encode': lazy(() => import('@/tools/hex-encode/index')),
  'hmac': lazy(() => import('@/tools/hmac/index')),
  'html-entities': lazy(() => import('@/tools/html-entities/index')),
  'http-headers': lazy(() => import('@/tools/http-headers/index')),
  'http-status': lazy(() => import('@/tools/http-status/index')),
  'ip-subnet': lazy(() => import('@/tools/ip-subnet/index')),
  'js-formatter': lazy(() => import('@/tools/js-formatter/index')),
  'json-to-type': lazy(() => import('@/tools/json-to-type/index')),
  'jwt-generator': lazy(() => import('@/tools/jwt-generator/index')),
  'line-sorter': lazy(() => import('@/tools/line-sorter/index')),
  'mime-types': lazy(() => import('@/tools/mime-types/index')),
  'morse-code': lazy(() => import('@/tools/morse-code/index')),
  'nanoid-gen': lazy(() => import('@/tools/nanoid-gen/index')),
  'objectid-gen': lazy(() => import('@/tools/objectid-gen/index')),
  'placeholder-img': lazy(() => import('@/tools/placeholder-img/index')),
  'punycode': lazy(() => import('@/tools/punycode/index')),
  'qrcode': lazy(() => import('@/tools/qrcode/index')),
  'rot13': lazy(() => import('@/tools/rot13/index')),
  'rsa-keygen': lazy(() => import('@/tools/rsa-keygen/index')),
  'sql-formatter': lazy(() => import('@/tools/sql-formatter/index')),
  'ssh-keygen': lazy(() => import('@/tools/ssh-keygen/index')),
  'string-escape': lazy(() => import('@/tools/string-escape/index')),
  'tailwind-colors': lazy(() => import('@/tools/tailwind-colors/index')),
  'text-diff': lazy(() => import('@/tools/text-diff/index')),
  'text-similarity': lazy(() => import('@/tools/text-similarity/index')),
  'text-transform': lazy(() => import('@/tools/text-transform/index')),
  'timezone-convert': lazy(() => import('@/tools/timezone-convert/index')),
  'toml-json': lazy(() => import('@/tools/toml-json/index')),
  'ulid-gen': lazy(() => import('@/tools/ulid-gen/index')),
  'unicode-convert': lazy(() => import('@/tools/unicode-convert/index')),
  'url-parser': lazy(() => import('@/tools/url-parser/index')),
  'user-agent': lazy(() => import('@/tools/user-agent/index')),
  'xml-formatter': lazy(() => import('@/tools/xml-formatter/index')),
  'yaml-json': lazy(() => import('@/tools/yaml-json/index')),
  'ip-lookup': lazy(() => import('@/tools/ip-lookup/index')),
  'dns-lookup': lazy(() => import('@/tools/dns-lookup/index')),
  'ai-regex': lazy(() => import('@/tools/ai-regex/index')),
  'ai-sql': lazy(() => import('@/tools/ai-sql/index')),
  'ai-code-explain': lazy(() => import('@/tools/ai-code-explain/index')),
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
  const { addRecentTool } = useAppStore()
  const Component = toolComponents[id]

  useEffect(() => {
    if (Component) addRecentTool(id)
  }, [id, Component, addRecentTool])

  if (!Component) return <div className="p-6"><ComingSoon id={id} /></div>

  return (
    <div className="p-6 h-full">
      <Suspense fallback={<ToolSkeleton />}>
        <Component />
      </Suspense>
    </div>
  )
}
