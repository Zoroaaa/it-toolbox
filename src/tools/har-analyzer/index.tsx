import { useMemo, useState } from 'react'
import { Download, FileSearch, Upload } from 'lucide-react'
import { ToolLayout } from '@/components/tool/ToolLayout'
import { harEntriesToCsv, type HarEntrySummary } from '@core/har'
import { useAppStore } from '@/store/app'
import { useHarAnalyze } from './useHarAnalyze'
import { meta } from './meta'

type StatusFilter = 'all' | '2xx' | '3xx' | '4xx' | '5xx' | 'failed'
type SortKey = 'index' | 'time' | 'size'

const PAGE_SIZE = 100

const STATUS_TABS: { key: StatusFilter; label: string }[] = [
  { key: 'all', label: '全部' },
  { key: '2xx', label: '2xx' },
  { key: '3xx', label: '3xx' },
  { key: '4xx', label: '4xx' },
  { key: '5xx', label: '5xx' },
  { key: 'failed', label: '失败' },
]

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
}

function formatMs(ms: number): string {
  return ms >= 1000 ? `${(ms / 1000).toFixed(2)} s` : `${Math.round(ms)} ms`
}

function statusClass(status: number): string {
  if (status >= 200 && status < 300) return 'text-accent'
  if (status >= 300 && status < 400) return 'text-text-secondary'
  if (status >= 400 && status < 500) return 'text-amber-500'
  return 'text-red-400'
}

function matchesStatus(entry: HarEntrySummary, filter: StatusFilter): boolean {
  if (filter === 'all') return true
  if (filter === 'failed') return entry.status === 0 || entry.status >= 400
  const bucket = Number(filter[0])
  return entry.status >= bucket * 100 && entry.status < (bucket + 1) * 100
}

export default function HarAnalyzer() {
  const { running, error, report, analyze, reset } = useHarAnalyze()
  const [fileName, setFileName] = useState('')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [domainFilter, setDomainFilter] = useState('all')
  const [query, setQuery] = useState('')
  const [sortKey, setSortKey] = useState<SortKey>('index')
  const [page, setPage] = useState(0)
  const addRecentTool = useAppStore((s) => s.addRecentTool)

  const filtered = useMemo(() => {
    if (!report) return []
    const keyword = query.trim().toLowerCase()
    const rows = report.entries.filter((entry) => {
      if (!matchesStatus(entry, statusFilter)) return false
      if (domainFilter !== 'all' && entry.host !== domainFilter) return false
      if (keyword && !entry.url.toLowerCase().includes(keyword)) return false
      return true
    })
    if (sortKey === 'time') return [...rows].sort((a, b) => b.timeMs - a.timeMs)
    if (sortKey === 'size') return [...rows].sort((a, b) => b.sizeBytes - a.sizeBytes)
    return rows
  }, [report, statusFilter, domainFilter, query, sortKey])

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const currentPage = Math.min(page, pageCount - 1)
  const pageRows = filtered.slice(currentPage * PAGE_SIZE, currentPage * PAGE_SIZE + PAGE_SIZE)

  const handleFile = async (file: File) => {
    addRecentTool(meta.id)
    setFileName(file.name)
    setStatusFilter('all')
    setDomainFilter('all')
    setQuery('')
    setSortKey('index')
    setPage(0)
    analyze(await file.text())
  }

  const downloadCsv = () => {
    const csv = harEntriesToCsv(filtered)
    // 加 BOM，Excel 打开中文表头才不乱码
    const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `har-${Date.now()}.csv`
    a.click()
    setTimeout(() => URL.revokeObjectURL(url), 1000)
  }

  const handleReset = () => {
    reset()
    setFileName('')
    setQuery('')
    setStatusFilter('all')
    setDomainFilter('all')
    setPage(0)
  }

  return (
    <ToolLayout meta={meta} onReset={handleReset}>
      <div className="flex flex-col gap-4">
        <label
          className="border-2 border-dashed border-border-base rounded-xl p-6 text-center hover:border-accent transition-colors cursor-pointer"
          onDrop={(e) => {
            e.preventDefault()
            const file = e.dataTransfer.files[0]
            if (file) void handleFile(file)
          }}
          onDragOver={(e) => e.preventDefault()}
        >
          <Upload className="w-7 h-7 text-text-muted mx-auto mb-2" />
          <p className="text-text-secondary text-sm">
            {fileName || '拖入或选择浏览器导出的 .har 文件'}
          </p>
          <p className="text-xs text-text-muted mt-1">解析与统计在本地 Worker 完成，文件不会上传</p>
          <input
            type="file"
            accept=".har,application/json"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (file) void handleFile(file)
              e.target.value = ''
            }}
          />
        </label>

        {running && <p className="text-xs text-text-muted">解析中…大文件可能需要几秒</p>}
        {error && <p className="text-xs text-red-400">{error}</p>}

        {report && (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              {[
                { label: '请求数', value: report.entryCount.toLocaleString() },
                { label: '总大小', value: formatBytes(report.totalSizeBytes) },
                { label: '累计耗时', value: formatMs(report.totalTimeMs) },
                { label: '墙钟跨度', value: formatMs(report.wallTimeMs) },
                { label: '失败请求', value: report.failures.length.toLocaleString() },
              ].map((card) => (
                <div key={card.label} className="p-3 rounded-xl bg-bg-surface border border-border-base">
                  <div className="text-xs text-text-muted">{card.label}</div>
                  <div className="text-lg font-semibold text-text-primary">{card.value}</div>
                </div>
              ))}
            </div>

            <div className="p-4 rounded-xl bg-bg-surface border border-border-base">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-text-muted">域名聚合（按体积）</span>
                <span className="text-xs text-text-muted">{report.domains.length} 个域名</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {report.domains.slice(0, 8).map((domain) => (
                  <button
                    key={domain.host}
                    onClick={() =>
                      setDomainFilter((prev) => (prev === domain.host ? 'all' : domain.host))
                    }
                    className={`px-2 py-1 rounded-md border text-[11px] font-mono transition-colors ${
                      domainFilter === domain.host
                        ? 'border-accent bg-accent/10 text-accent'
                        : 'border-border-base bg-bg-raised text-text-secondary hover:border-accent'
                    }`}
                    title={`${domain.count} 个请求 / ${formatBytes(domain.sizeBytes)}`}
                  >
                    {domain.host || '(未知)'} · {domain.count} · {formatBytes(domain.sizeBytes)}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="flex gap-1">
                {STATUS_TABS.map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => {
                      setStatusFilter(tab.key)
                      setPage(0)
                    }}
                    className={`px-2.5 py-1 rounded-md border text-xs transition-colors ${
                      statusFilter === tab.key
                        ? 'border-accent bg-accent/10 text-accent'
                        : 'border-border-base text-text-secondary hover:bg-bg-raised'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              <select
                value={domainFilter}
                onChange={(e) => {
                  setDomainFilter(e.target.value)
                  setPage(0)
                }}
                className="px-2 py-1 rounded-md bg-bg-surface border border-border-base text-xs text-text-secondary"
                aria-label="域名筛选"
              >
                <option value="all">全部域名</option>
                {report.domains.map((domain) => (
                  <option key={domain.host} value={domain.host}>
                    {domain.host || '(未知)'}
                  </option>
                ))}
              </select>

              <input
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value)
                  setPage(0)
                }}
                placeholder="搜索 URL..."
                className="flex-1 min-w-[160px] px-2.5 py-1 rounded-md bg-bg-surface border border-border-base text-xs text-text-primary focus:outline-none focus:border-accent"
              />

              <select
                value={sortKey}
                onChange={(e) => setSortKey(e.target.value as SortKey)}
                className="px-2 py-1 rounded-md bg-bg-surface border border-border-base text-xs text-text-secondary"
                aria-label="排序"
              >
                <option value="index">按原始顺序</option>
                <option value="time">按耗时</option>
                <option value="size">按体积</option>
              </select>

              <button
                onClick={downloadCsv}
                disabled={!filtered.length}
                className="flex items-center gap-1.5 px-3 py-1 rounded-md border border-border-base text-xs text-text-secondary hover:text-accent hover:border-accent transition-colors disabled:opacity-40"
              >
                <Download className="w-3.5 h-3.5" />
                导出 CSV
              </button>
            </div>

            <div className="overflow-x-auto rounded-xl border border-border-base">
              <table className="w-full text-xs">
                <thead className="bg-bg-raised text-text-muted">
                  <tr>
                    <th className="px-3 py-2 text-left font-medium">方法</th>
                    <th className="px-3 py-2 text-left font-medium">状态</th>
                    <th className="px-3 py-2 text-left font-medium">域名</th>
                    <th className="px-3 py-2 text-left font-medium">路径</th>
                    <th className="px-3 py-2 text-right font-medium">大小</th>
                    <th className="px-3 py-2 text-right font-medium">耗时</th>
                  </tr>
                </thead>
                <tbody>
                  {pageRows.map((entry) => (
                    <tr key={entry.index} className="border-t border-border-base hover:bg-bg-surface">
                      <td className="px-3 py-1.5 font-mono text-text-secondary">{entry.method}</td>
                      <td className={`px-3 py-1.5 font-mono ${statusClass(entry.status)}`}>
                        {entry.status || '失败'}
                      </td>
                      <td className="px-3 py-1.5 text-text-muted max-w-[160px] truncate">
                        {entry.host}
                      </td>
                      <td className="px-3 py-1.5 text-text-primary max-w-[380px] truncate" title={entry.url}>
                        {entry.path || entry.url}
                      </td>
                      <td className="px-3 py-1.5 text-right font-mono text-text-secondary">
                        {formatBytes(entry.sizeBytes)}
                      </td>
                      <td className="px-3 py-1.5 text-right font-mono text-text-secondary">
                        {formatMs(entry.timeMs)}
                      </td>
                    </tr>
                  ))}
                  {!pageRows.length && (
                    <tr>
                      <td colSpan={6} className="px-3 py-6 text-center text-text-muted">
                        没有符合筛选条件的请求
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="flex items-center justify-between text-xs text-text-muted">
              <span>
                共 {filtered.length} 条 / 第 {currentPage + 1} 页，共 {pageCount} 页
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage(Math.max(0, currentPage - 1))}
                  disabled={currentPage === 0}
                  className="px-2 py-1 rounded-md border border-border-base disabled:opacity-40"
                >
                  上一页
                </button>
                <button
                  onClick={() => setPage(Math.min(pageCount - 1, currentPage + 1))}
                  disabled={currentPage >= pageCount - 1}
                  className="px-2 py-1 rounded-md border border-border-base disabled:opacity-40"
                >
                  下一页
                </button>
              </div>
            </div>
          </>
        )}

        {!report && !running && (
          <p className="text-xs text-text-muted flex items-center gap-1.5">
            <FileSearch className="w-3.5 h-3.5" />
            Chrome DevTools → Network → 右键任意请求 → Save all as HAR with content
          </p>
        )}
      </div>
    </ToolLayout>
  )
}
