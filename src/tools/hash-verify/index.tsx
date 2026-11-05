import { useState, useCallback, useRef } from 'react'
import { Upload, FileCheck, CheckCircle, XCircle, Trash2, Copy, Check } from 'lucide-react'
import { ToolLayout } from '@/components/tool/ToolLayout'
import { useAppStore } from '@/store/app'
import { useClipboard } from '@/hooks/useClipboard'
import { meta } from './meta'

interface FileHashResult {
  id: string
  fileName: string
  fileSize: number
  md5: string
  sha256: string
  expectedHash: string
  matchResult: 'match' | 'mismatch' | 'pending' | null
  isProcessing: boolean
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`
}

async function calculateMd5(file: File): Promise<string> {
  const buffer = await file.arrayBuffer()
  const bytes = new Uint8Array(buffer)
  
  const K = new Uint32Array([
    0xd76aa478, 0xe8c7b756, 0x242070db, 0xc1bdceee,
    0xf57c0faf, 0x4787c62a, 0xa8304613, 0xfd469501,
    0x698098d8, 0x8b44f7af, 0xffff5bb1, 0x895cd7be,
    0x6b901122, 0xfd987193, 0xa679438e, 0x49b40821,
    0xf61e2562, 0xc040b340, 0x265e5a51, 0xe9b6c7aa,
    0xd62f105d, 0x02441453, 0xd8a1e681, 0xe7d3fbc8,
    0x21e1cde6, 0xc33707d6, 0xf4d50d87, 0x455a14ed,
    0xa9e3e905, 0xfcefa3f8, 0x676f02d9, 0x8d2a4c8a,
    0xfffa3942, 0x8771f681, 0x6d9d6122, 0xfde5380c,
    0xa4beea44, 0x4bdecfa9, 0xf6bb4b60, 0xbebfbc70,
    0x289b7ec6, 0xeaa127fa, 0xd4ef3085, 0x04881d05,
    0xd9d4d039, 0xe6db99e5, 0x1fa27cf8, 0xc4ac5665,
    0xf4292244, 0x432aff97, 0xab9423a7, 0xfc93a039,
    0x655b59c3, 0x8f0ccc92, 0xffeff47d, 0x85845dd1,
    0x6fa87e4f, 0xfe2ce6e0, 0xa3014314, 0x4e0811a1,
    0xf7537e82, 0xbd3af235, 0x2ad7d2bb, 0xeb86d391,
  ])

  const S = new Uint8Array([
    7, 12, 17, 22, 7, 12, 17, 22, 7, 12, 17, 22, 7, 12, 17, 22,
    5, 9, 14, 20, 5, 9, 14, 20, 5, 9, 14, 20, 5, 9, 14, 20,
    4, 11, 16, 23, 4, 11, 16, 23, 4, 11, 16, 23, 4, 11, 16, 23,
    6, 10, 15, 21, 6, 10, 15, 21, 6, 10, 15, 21, 6, 10, 15, 21,
  ])

  // MD5 填充后总长度必须是 64 的整数倍：原文 + 1 字节 0x80 + 补零 + 8 字节长度
  const totalLen = Math.ceil((bytes.length + 9) / 64) * 64
  const data = new Uint8Array(totalLen)
  data.set(bytes)
  data[bytes.length] = 0x80
  const view = new DataView(data.buffer)
  view.setUint32(totalLen - 8, bytes.length * 8, true)

  let a0 = 0x67452301
  let b0 = 0xefcdab89
  let c0 = 0x98badcfe
  let d0 = 0x10325476

  for (let offset = 0; offset < totalLen; offset += 64) {
    const M = new Uint32Array(16)
    for (let i = 0; i < 16; i++) {
      M[i] = view.getUint32(offset + i * 4, true)
    }

    let A = a0, B = b0, C = c0, D = d0

    for (let i = 0; i < 64; i++) {
      let F: number, g: number
      if (i < 16) {
        F = (B & C) | (~B & D)
        g = i
      } else if (i < 32) {
        F = (D & B) | (~D & C)
        g = (5 * i + 1) % 16
      } else if (i < 48) {
        F = B ^ C ^ D
        g = (3 * i + 5) % 16
      } else {
        F = C ^ (B | ~D)
        g = (7 * i) % 16
      }
      F = (F + A + K[i] + M[g]) >>> 0
      A = D
      D = C
      C = B
      B = (B + leftRotate(F, S[i])) >>> 0
    }

    a0 = (a0 + A) >>> 0
    b0 = (b0 + B) >>> 0
    c0 = (c0 + C) >>> 0
    d0 = (d0 + D) >>> 0
  }

  const result = new Uint8Array(16)
  const resultView = new DataView(result.buffer)
  resultView.setUint32(0, a0, true)
  resultView.setUint32(4, b0, true)
  resultView.setUint32(8, c0, true)
  resultView.setUint32(12, d0, true)

  return Array.from(result).map(b => b.toString(16).padStart(2, '0')).join('')
}

function leftRotate(x: number, c: number): number {
  return ((x << c) | (x >>> (32 - c))) >>> 0
}

async function calculateSha256(file: File): Promise<string> {
  const buffer = await file.arrayBuffer()
  const hashBuffer = await crypto.subtle.digest('SHA-256', buffer)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
}

export default function HashVerify() {
  const [files, setFiles] = useState<FileHashResult[]>([])
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const addRecentTool = useAppStore((s) => s.addRecentTool)
  const { copy } = useClipboard()
  const [copiedId, setCopiedId] = useState<string | null>(null)

  const processFile = useCallback(async (file: File): Promise<FileHashResult> => {
    const id = `${file.name}-${Date.now()}`
    const initial: FileHashResult = {
      id,
      fileName: file.name,
      fileSize: file.size,
      md5: '',
      sha256: '',
      expectedHash: '',
      matchResult: 'pending',
      isProcessing: true,
    }

    return new Promise((resolve) => {
      Promise.all([calculateMd5(file), calculateSha256(file)])
        .then(([md5, sha256]) => {
          resolve({
            ...initial,
            md5,
            sha256,
            isProcessing: false,
          })
        })
        .catch(() => {
          resolve({
            ...initial,
            md5: '计算失败',
            sha256: '计算失败',
            isProcessing: false,
          })
        })
    })
  }, [])

  const handleFiles = useCallback(async (fileList: FileList) => {
    addRecentTool(meta.id)
    const newFiles: FileHashResult[] = []

    for (let i = 0; i < fileList.length; i++) {
      const file = fileList[i]
      const result = await processFile(file)
      newFiles.push(result)
    }

    setFiles(prev => [...prev, ...newFiles])
  }, [addRecentTool, processFile])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    if (e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files)
    }
  }, [handleFiles])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  const updateExpectedHash = (id: string, expectedHash: string) => {
    setFiles(prev => prev.map(f => {
      if (f.id !== id) return f
      const normalizedExpected = expectedHash.toLowerCase().trim()
      const normalizedMd5 = f.md5.toLowerCase()
      const normalizedSha256 = f.sha256.toLowerCase()
      
      let matchResult: FileHashResult['matchResult'] = 'pending'
      if (normalizedExpected) {
        if (normalizedExpected === normalizedMd5 || normalizedExpected === normalizedSha256) {
          matchResult = 'match'
        } else {
          matchResult = 'mismatch'
        }
      }
      
      return { ...f, expectedHash, matchResult }
    }))
  }

  const removeFile = (id: string) => {
    setFiles(prev => prev.filter(f => f.id !== id))
  }

  const clearAll = () => {
    setFiles([])
  }

  const handleCopy = (text: string, id: string) => {
    copy(text)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  const reset = () => {
    setFiles([])
  }

  return (
    <ToolLayout meta={meta} onReset={reset}>
      <div className="flex items-center gap-2 mb-4">
        <button onClick={() => fileInputRef.current?.click()} className="btn-primary">
          <Upload className="w-4 h-4" />
          选择文件
        </button>
        {files.length > 0 && (
          <button onClick={clearAll} className="btn-ghost text-rose-400 hover:text-rose-300">
            <Trash2 className="w-4 h-4" />
            清空
          </button>
        )}
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          multiple
          onChange={e => e.target.files && handleFiles(e.target.files)}
        />
      </div>

      <div
        className={`border-2 border-dashed rounded-xl p-8 text-center mb-4 transition-colors ${
          isDragging
            ? 'border-accent bg-accent/5'
            : 'border-border-base hover:border-accent/50'
        }`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
      >
        <FileCheck className="w-10 h-10 mx-auto mb-3 text-text-muted" />
        <p className="text-text-secondary mb-1">拖拽文件到此处或点击上方按钮选择</p>
        <p className="text-xs text-text-muted">支持批量上传，自动计算 MD5 和 SHA-256</p>
      </div>

      {files.length > 0 ? (
        <div className="space-y-3 overflow-y-auto max-h-[calc(100vh-26rem)]">
          {files.map(file => (
            <div
              key={file.id}
              className="p-4 rounded-xl bg-bg-surface border border-border-base"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2 min-w-0">
                  <FileCheck className="w-4 h-4 text-accent flex-shrink-0" />
                  <span className="font-medium text-text-primary truncate">{file.fileName}</span>
                  <span className="text-xs text-text-muted flex-shrink-0">({formatFileSize(file.fileSize)})</span>
                </div>
                <button
                  onClick={() => removeFile(file.id)}
                  className="p-1 rounded hover:bg-bg-raised text-text-muted hover:text-rose-400 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              {file.isProcessing ? (
                <div className="flex items-center gap-2 text-text-muted">
                  <div className="w-4 h-4 border-2 border-accent border-t-transparent rounded-full animate-spin" />
                  <span className="text-sm">计算中...</span>
                </div>
              ) : (
                <div className="space-y-3">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-medium text-text-muted">MD5</span>
                      <button
                        onClick={() => handleCopy(file.md5, `${file.id}-md5`)}
                        className="p-1 rounded hover:bg-bg-raised"
                      >
                        {copiedId === `${file.id}-md5` ? (
                          <Check className="w-3 h-3 text-accent" />
                        ) : (
                          <Copy className="w-3 h-3 text-text-muted" />
                        )}
                      </button>
                    </div>
                    <code className="block text-xs font-mono text-text-primary bg-bg-raised px-2 py-1.5 rounded break-all">
                      {file.md5}
                    </code>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-medium text-text-muted">SHA-256</span>
                      <button
                        onClick={() => handleCopy(file.sha256, `${file.id}-sha256`)}
                        className="p-1 rounded hover:bg-bg-raised"
                      >
                        {copiedId === `${file.id}-sha256` ? (
                          <Check className="w-3 h-3 text-accent" />
                        ) : (
                          <Copy className="w-3 h-3 text-text-muted" />
                        )}
                      </button>
                    </div>
                    <code className="block text-xs font-mono text-text-primary bg-bg-raised px-2 py-1.5 rounded break-all">
                      {file.sha256}
                    </code>
                  </div>

                  <div>
                    <label className="text-xs font-medium text-text-muted block mb-1">
                      预期哈希值（用于校验）
                    </label>
                    <input
                      type="text"
                      value={file.expectedHash}
                      onChange={e => updateExpectedHash(file.id, e.target.value)}
                      placeholder="输入预期的 MD5 或 SHA-256 值进行对比"
                      className="w-full px-3 py-2 rounded-lg bg-bg-raised border border-border-base text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent font-mono"
                    />
                  </div>

                  {file.matchResult && file.matchResult !== 'pending' && (
                    <div className={`flex items-center gap-2 p-2 rounded-lg ${
                      file.matchResult === 'match'
                        ? 'bg-green-500/10 text-green-400'
                        : 'bg-rose-500/10 text-rose-400'
                    }`}>
                      {file.matchResult === 'match' ? (
                        <>
                          <CheckCircle className="w-4 h-4" />
                          <span className="text-sm font-medium">校验通过，哈希值匹配</span>
                        </>
                      ) : (
                        <>
                          <XCircle className="w-4 h-4" />
                          <span className="text-sm font-medium">校验失败，哈希值不匹配</span>
                        </>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="h-32 rounded-xl bg-bg-raised border border-border-base flex items-center justify-center">
          <p className="text-text-muted text-sm">上传文件以计算和校验哈希值</p>
        </div>
      )}
    </ToolLayout>
  )
}
