import { useState, useCallback } from 'react'
import { KeyRound, Copy, Check, Download } from 'lucide-react'
import { ToolLayout } from '@/components/tool/ToolLayout'
import { generateRsaKeyPair, type RsaKeyPair } from '@core/index'
import { useAppStore } from '@/store/app'
import { useClipboard } from '@/hooks/useClipboard'
import { meta } from './meta'

type KeySize = 2048 | 4096

export default function RsaKeygen() {
  const [keyPair, setKeyPair] = useState<RsaKeyPair | null>(null)
  const [keySize, setKeySize] = useState<KeySize>(2048)
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState('')
  const [activeTab, setActiveTab] = useState<'public' | 'private' | 'jwk'>('public')
  const { addRecentTool } = useAppStore()
  const { copy, copied } = useClipboard()

  const generate = useCallback(async () => {
    setIsGenerating(true)
    setError('')
    addRecentTool(meta.id)

    const result = await generateRsaKeyPair(keySize)
    if (result.ok) {
      setKeyPair(result.value)
    } else {
      setError(result.error)
    }
    setIsGenerating(false)
  }, [keySize, addRecentTool])

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
    ? (activeTab === 'public' ? keyPair.publicKey 
       : activeTab === 'private' ? keyPair.privateKey 
       : JSON.stringify(keyPair.publicKeyJwk, null, 2))
    : ''

  return (
    <ToolLayout meta={meta} onReset={reset} outputValue={outputValue}>
      <div className="flex items-center gap-2 mb-4 flex-wrap">
        <button onClick={generate} disabled={isGenerating} className="btn-primary">
          <KeyRound className="w-4 h-4" />
          {isGenerating ? '生成中...' : '生成密钥对'}
        </button>

        <div className="flex items-center gap-1 bg-bg-raised rounded-lg p-1">
          {([2048, 4096] as KeySize[]).map(size => (
            <button
              key={size}
              onClick={() => setKeySize(size)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors
                ${keySize === size ? 'bg-accent text-bg-base' : 'text-text-muted hover:text-text-primary'}`}
            >
              {size} 位
            </button>
          ))}
        </div>

        {keyPair && (
          <div className="flex items-center gap-1 bg-bg-raised rounded-lg p-1 ml-4">
            {(['public', 'private', 'jwk'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors
                  ${activeTab === tab ? 'bg-accent text-bg-base' : 'text-text-muted hover:text-text-primary'}`}
              >
                {tab === 'public' ? '公钥' : tab === 'private' ? '私钥' : 'JWK'}
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

      <div className="flex-1 min-h-0">
        {keyPair ? (
          <div className="h-full flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-medium text-text-muted uppercase tracking-wider">
                {activeTab === 'public' ? '公钥 (PEM)' : activeTab === 'private' ? '私钥 (PEM)' : '公钥 (JWK)'}
              </label>
              <div className="flex items-center gap-1">
                <button onClick={() => copy(outputValue)} className="btn-ghost text-xs">
                  {copied ? <Check className="w-3.5 h-3.5 text-accent" /> : <Copy className="w-3.5 h-3.5" />}
                  复制
                </button>
                <button 
                  onClick={() => downloadKey(outputValue, activeTab === 'public' ? 'public.pem' : activeTab === 'private' ? 'private.pem' : 'public.jwk')} 
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
            <p className="text-text-muted text-sm">点击「生成密钥对」按钮生成 RSA 密钥</p>
          </div>
        )}
      </div>
    </ToolLayout>
  )
}
