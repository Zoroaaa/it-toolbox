import { useState, useCallback } from 'react'
import { BookOpen, Upload, ChevronDown, ChevronRight } from 'lucide-react'
import * as yaml from 'js-yaml'
import { ToolLayout } from '@/components/tool/ToolLayout'
import { useAppStore } from '@/store/app'
import { meta } from './meta'

interface OpenAPISpec {
  openapi?: string
  swagger?: string
  info?: { title: string; version: string; description?: string }
  paths?: Record<string, Record<string, OpenAPIOperation>>
  tags?: Array<{ name: string; description?: string }>
  components?: { schemas?: Record<string, unknown> }
}

interface OpenAPIOperation {
  summary?: string
  description?: string
  tags?: string[]
  operationId?: string
  parameters?: Array<{ name: string; in: string; required?: boolean; description?: string; schema?: { type?: string } }>
  requestBody?: { description?: string; required?: boolean; content?: Record<string, { schema?: unknown }> }
  responses?: Record<string, { description?: string }>
}

const METHOD_COLORS: Record<string, string> = {
  get: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  post: 'bg-green-500/20 text-green-400 border-green-500/30',
  put: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  patch: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
  delete: 'bg-red-500/20 text-red-400 border-red-500/30',
  options: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
  head: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
}

function EndpointCard({ method, path, op }: { method: string; path: string; op: OpenAPIOperation }) {
  const [expanded, setExpanded] = useState(false)
  const hasDetails = op.parameters?.length || op.requestBody || op.responses

  return (
    <div className="border border-border-base rounded-lg overflow-hidden">
      <button
        onClick={() => hasDetails && setExpanded(!expanded)}
        className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-bg-raised transition-colors text-left ${!hasDetails ? 'cursor-default' : ''}`}
      >
        <span className={`flex-shrink-0 px-2 py-0.5 rounded text-xs font-bold uppercase border ${METHOD_COLORS[method] || 'bg-bg-raised text-text-muted border-border-base'}`}>
          {method}
        </span>
        <span className="text-sm font-mono text-text-primary flex-1 truncate">{path}</span>
        {op.summary && <span className="text-xs text-text-muted truncate max-w-xs hidden md:block">{op.summary}</span>}
        {hasDetails && (
          <span className="flex-shrink-0 text-text-muted">
            {expanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          </span>
        )}
      </button>
      {expanded && hasDetails && (
        <div className="px-4 pb-4 pt-2 border-t border-border-base space-y-3 bg-bg-raised">
          {op.description && (
            <p className="text-sm text-text-secondary">{op.description}</p>
          )}
          {op.parameters && op.parameters.length > 0 && (
            <div>
              <p className="text-xs font-medium text-text-muted mb-1.5">Parameters</p>
              <div className="space-y-1">
                {op.parameters.map((p, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs">
                    <span className="font-mono text-text-primary">{p.name}</span>
                    <span className="text-text-muted bg-bg-surface px-1.5 py-0.5 rounded">{p.in}</span>
                    {p.schema?.type && <span className="text-blue-400">{p.schema.type}</span>}
                    {p.required && <span className="text-red-400">required</span>}
                    {p.description && <span className="text-text-muted truncate">{p.description}</span>}
                  </div>
                ))}
              </div>
            </div>
          )}
          {op.requestBody && (
            <div>
              <p className="text-xs font-medium text-text-muted mb-1">Request Body</p>
              <div className="flex gap-2 text-xs">
                {op.requestBody.required && <span className="text-red-400">required</span>}
                {op.requestBody.content && (
                  <span className="text-text-muted">{Object.keys(op.requestBody.content).join(', ')}</span>
                )}
                {op.requestBody.description && <span className="text-text-secondary">{op.requestBody.description}</span>}
              </div>
            </div>
          )}
          {op.responses && (
            <div>
              <p className="text-xs font-medium text-text-muted mb-1.5">Responses</p>
              <div className="space-y-1">
                {Object.entries(op.responses).map(([code, res]) => (
                  <div key={code} className="flex items-center gap-2 text-xs">
                    <span className={`font-mono font-bold ${
                      code.startsWith('2') ? 'text-green-400' :
                      code.startsWith('4') ? 'text-yellow-400' :
                      code.startsWith('5') ? 'text-red-400' : 'text-text-primary'
                    }`}>{code}</span>
                    <span className="text-text-secondary">{(res as { description?: string }).description || ''}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

const EXAMPLE_SPEC = `openapi: 3.0.0
info:
  title: Sample API
  version: 1.0.0
  description: A sample API to demonstrate OpenAPI viewer
paths:
  /users:
    get:
      summary: List users
      tags: [Users]
      parameters:
        - name: limit
          in: query
          schema:
            type: integer
      responses:
        '200':
          description: A list of users
    post:
      summary: Create user
      tags: [Users]
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
      responses:
        '201':
          description: User created
  /users/{id}:
    get:
      summary: Get user by ID
      tags: [Users]
      parameters:
        - name: id
          in: path
          required: true
          schema:
            type: string
      responses:
        '200':
          description: User found
        '404':
          description: User not found`

export default function OpenAPIViewer() {
  const [spec, setSpec] = useState<OpenAPISpec | null>(null)
  const [input, setInput] = useState('')
  const [error, setError] = useState('')
  const [selectedTag, setSelectedTag] = useState<string | null>(null)
  const { addRecentTool } = useAppStore()

  const parseSpec = useCallback((text: string) => {
    setError('')
    try {
      let parsed: OpenAPISpec
      if (text.trim().startsWith('{')) {
        parsed = JSON.parse(text)
      } else {
        parsed = yaml.load(text) as OpenAPISpec
      }
      if (!parsed.paths && !parsed.info) {
        throw new Error('不是有效的 OpenAPI 规范')
      }
      setSpec(parsed)
      addRecentTool(meta.id)
    } catch (e) {
      setError(e instanceof Error ? e.message : '解析失败')
      setSpec(null)
    }
  }, [addRecentTool])

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      const text = ev.target?.result as string
      setInput(text)
      parseSpec(text)
    }
    reader.readAsText(file)
    e.target.value = ''
  }

  const loadExample = () => {
    setInput(EXAMPLE_SPEC)
    parseSpec(EXAMPLE_SPEC)
  }

  const getAllTags = (): string[] => {
    if (!spec?.paths) return []
    const tags = new Set<string>()
    tags.add('All')
    Object.values(spec.paths).forEach(methods => {
      Object.values(methods).forEach(op => {
        op.tags?.forEach(t => tags.add(t))
      })
    })
    return Array.from(tags)
  }

  const getFilteredEndpoints = () => {
    if (!spec?.paths) return []
    const endpoints: Array<{ path: string; method: string; op: OpenAPIOperation }> = []
    Object.entries(spec.paths).forEach(([path, methods]) => {
      const httpMethods = ['get', 'post', 'put', 'patch', 'delete', 'options', 'head']
      httpMethods.forEach(method => {
        if (methods[method]) {
          const op = methods[method]
          if (!selectedTag || selectedTag === 'All' || op.tags?.includes(selectedTag)) {
            endpoints.push({ path, method, op })
          }
        }
      })
    })
    return endpoints
  }

  const tags = getAllTags()
  const endpoints = getFilteredEndpoints()

  const reset = () => {
    setSpec(null)
    setInput('')
    setError('')
    setSelectedTag(null)
  }

  return (
    <ToolLayout meta={meta} onReset={reset}>
      <div className="flex flex-col gap-4 h-[calc(100vh-12rem)]">
        {!spec ? (
          <div className="flex flex-col gap-4">
            {error && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 text-red-400 text-sm">{error}</div>
            )}
            <div className="flex gap-2">
              <label className="flex items-center gap-2 px-4 py-2 rounded-lg bg-bg-surface border border-border-base text-sm text-text-secondary hover:text-text-primary cursor-pointer transition-colors">
                <Upload className="w-4 h-4" />
                上传 swagger.json / openapi.yaml
                <input type="file" accept=".json,.yaml,.yml" className="hidden" onChange={handleFileUpload} />
              </label>
              <button
                onClick={loadExample}
                className="px-4 py-2 rounded-lg bg-accent/10 border border-accent/30 text-accent text-sm hover:bg-accent/20 transition-colors"
              >
                加载示例
              </button>
            </div>
            <textarea
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="粘贴 OpenAPI JSON 或 YAML..."
              className="flex-1 min-h-64 px-3 py-2.5 rounded-lg bg-bg-surface border border-border-base text-sm font-mono text-text-primary focus:outline-none focus:border-accent resize-none"
            />
            {input.trim() && (
              <button
                onClick={() => parseSpec(input)}
                className="px-6 py-2.5 rounded-lg bg-accent text-bg-base font-medium text-sm hover:bg-accent/90 transition-colors self-start"
              >
                解析 OpenAPI
              </button>
            )}
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-lg font-bold text-text-primary">{spec.info?.title}</h2>
                <div className="flex items-center gap-3 mt-1">
                  <span className="text-xs px-2 py-0.5 rounded bg-accent/10 text-accent border border-accent/20">
                    v{spec.info?.version}
                  </span>
                  <span className="text-xs px-2 py-0.5 rounded bg-bg-raised text-text-muted">
                    {spec.openapi || spec.swagger}
                  </span>
                  <span className="text-xs text-text-muted">{endpoints.length} 个接口</span>
                </div>
                {spec.info?.description && (
                  <p className="text-sm text-text-secondary mt-1">{spec.info.description}</p>
                )}
              </div>
              <button
                onClick={reset}
                className="text-xs text-text-muted hover:text-text-primary px-3 py-1.5 rounded-lg hover:bg-bg-raised transition-colors"
              >
                重新加载
              </button>
            </div>

            {/* Tag filter */}
            {tags.length > 1 && (
              <div className="flex flex-wrap gap-2">
                {tags.map(tag => (
                  <button
                    key={tag}
                    onClick={() => setSelectedTag(tag === 'All' ? null : tag)}
                    className={`px-3 py-1.5 rounded-lg text-xs transition-colors ${
                      (tag === 'All' && !selectedTag) || tag === selectedTag
                        ? 'bg-accent/10 border border-accent/30 text-accent'
                        : 'bg-bg-surface border border-border-base text-text-secondary hover:text-text-primary'
                    }`}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            )}

            {/* Endpoints */}
            <div className="flex-1 overflow-y-auto space-y-2">
              {endpoints.map((ep, i) => (
                <EndpointCard key={i} method={ep.method} path={ep.path} op={ep.op} />
              ))}
              {endpoints.length === 0 && (
                <div className="text-center text-text-muted py-12">没有找到接口</div>
              )}
            </div>
          </>
        )}
      </div>
    </ToolLayout>
  )
}
