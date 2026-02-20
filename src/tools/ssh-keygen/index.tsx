import { useState, useCallback } from 'react'
import { Terminal, Copy, Check, Download } from 'lucide-react'
import { ToolLayout } from '@/components/tool/ToolLayout'
import { generateSshKeyPair, type SshKeyPair } from '@core/index'
import { useAppStore } from '@/store/app'
import { useClipboard } from '@/hooks/useClipboard'
import { meta } from './meta'

type KeyType = 'ed25519' | 'rsa'

export default function SshKeygen() {
  const [keyPair, setKeyPair] = useState<SshKeyPair | null>(null)
  const [keyType, setKeyType] = useState<KeyType>('ed25519')
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState('')
  const [activeTab, setActiveTab] = useState<'public' | 'private'>('public')
  const { addRecentTool } = useAppStore()
  const { copy, copied } = useClipboard()

  const generate = useCallback(async () => {
    setIsGenerating(true)
    setError('')
    addRecentTool(meta.id)

    const result = await generateSshKeyPair(keyType)
    if (result.ok) {
      setKeyPair(result.value)
    } else {
      setError(result.error)
    }
    setIsGenerating(false)
  }, [keyType, addRecentTool])

  const downloadKey = (content: string, filename: string) => {
    const blob = new Blob([content], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.click()
    URL.revokeObjectURL(url)
  }

  const reset = () => {
    setKeyPair(null)
    setError('')
  }

  const outputValue = keyPair 
    ? (activeTab === 'public' ? keyPair.publicKey : keyPair.privateKey)
    : ''

  return (
    <ToolLayout meta={meta} onReset={reset} outputValue={outputValue}>
      <div className="flex items-center gap-2 mb-4 flex-wrap">
        <button onClick={generate} disabled={isGenerating} className="btn-primary">
          <Terminal className="w-4 h-4" />
          {isGenerating ? '生成中...' : '生成 SSH 密钥'}
        </button>

        <div className="flex items-center gap-1 bg-bg-raised rounded-lg p-1">
          {(['ed25519', 'rsa'] as KeyType[]).map(type => (
            <button
              key={type}
              onClick={() => setKeyType(type)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors
                ${keyType === type ? 'bg-accent text-bg-base' : 'text-text-muted hover:text-text-primary'}`}
            >
              {type.toUpperCase()}
            </button>
          ))}
        </div>

        {keyPair && (
          <div className="flex items-center gap-1 bg-bg-raised rounded-lg p-1 ml-4">
            {(['public', 'private'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors
                  ${activeTab === tab ? 'bg-accent text-bg-base' : 'text-text-muted hover:text-text-primary'}`}
              >
                {tab === 'public' ? '公钥' : '私钥'}
              </button>
            ))}
          </div>
        )}
      </div>

      {error && (
        <div className="mb-4 rounded-lg bg-rose-500/10 border border-rose-500/30 p-4">
          <p className="text-xs text-rose-400/80">{error}</p>
        </div>
      )}

      {keyPair && (
        <div className="mb-4 p-3 rounded-lg bg-bg-surface border border-border-base">
          <span className="text-xs text-text-muted">指纹: </span>
          <span className="font-mono text-xs text-text-primary">{keyPair.fingerprint}</span>
        </div>
      )}

      <div className="flex-1 min-h-0">
        {keyPair ? (
          <div className="h-full flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-medium text-text-muted uppercase tracking-wider">
                {activeTab === 'public' ? '公钥 (id_' + keyType + '.pub)' : '私钥 (id_' + keyType + ')'}
              </label>
              <div className="flex items-center gap-1">
                <button onClick={() => copy(outputValue)} className="btn-ghost text-xs">
                  {copied ? <Check className="w-3.5 h-3.5 text-accent" /> : <Copy className="w-3.5 h-3.5" />}
                  复制
                </button>
                <button 
                  onClick={() => downloadKey(outputValue, activeTab === 'public' ? `id_${keyType}.pub` : `id_${keyType}`)} 
                  className="btn-ghost text-xs"
                >
                  <Download className="w-3.5 h-3.5" />
                  下载
                </button>
              </div>
            </div>
            <textarea
              className="tool-input flex-1 font-mono text-xs leading-relaxed"
              value={outputValue}
              readOnly
              spellCheck={false}
            />
          </div>
        ) : (
          <div className="h-full rounded-lg bg-bg-raised border border-border-base flex items-center justify-center">
            <p className="text-text-muted text-sm">点击「生成 SSH 密钥」按钮生成密钥对</p>
          </div>
        )}
      </div>
    </ToolLayout>
  )
}
