import { useState, useCallback, useEffect } from 'react'
import { QrCode, Download, Copy, Check, Wifi } from 'lucide-react'
import QRCode from 'qrcode'
import { ToolLayout } from '@/components/tool/ToolLayout'
import { useAppStore } from '@/store/app'
import { useClipboard } from '@/hooks/useClipboard'
import { meta } from './meta'

type ContentType = 'text' | 'url' | 'wifi' | 'vcard'
type ErrorCorrectionLevel = 'L' | 'M' | 'Q' | 'H'

interface WifiConfig {
  ssid: string
  password: string
  security: 'WPA' | 'WEP' | 'nopass'
  hidden: boolean
}

interface VCardConfig {
  name: string
  phone: string
  email: string
  organization: string
  url: string
}

export default function QRCodeGenerator() {
  const [contentType, setContentType] = useState<ContentType>('text')
  const [text, setText] = useState('')
  const [wifiConfig, setWifiConfig] = useState<WifiConfig>({
    ssid: '',
    password: '',
    security: 'WPA',
    hidden: false,
  })
  const [vcardConfig, setVCardConfig] = useState<VCardConfig>({
    name: '',
    phone: '',
    email: '',
    organization: '',
    url: '',
  })
  const [qrDataUrl, setQrDataUrl] = useState('')
  const [error, setError] = useState('')
  const [size, setSize] = useState(256)
  const [errorCorrection, setErrorCorrection] = useState<ErrorCorrectionLevel>('M')
  const [fgColor, setFgColor] = useState('#000000')
  const [bgColor, setBgColor] = useState('#ffffff')
  const { addHistory, addRecentTool } = useAppStore()
  const { copied } = useClipboard()

  const generateWifiString = useCallback((config: WifiConfig): string => {
    const hidden = config.hidden ? 'H:true;' : ''
    return `WIFI:T:${config.security};S:${config.ssid};P:${config.password};${hidden};`
  }, [])

  const generateVCardString = useCallback((config: VCardConfig): string => {
    const lines = [
      'BEGIN:VCARD',
      'VERSION:3.0',
      config.name && `FN:${config.name}`,
      config.phone && `TEL:${config.phone}`,
      config.email && `EMAIL:${config.email}`,
      config.organization && `ORG:${config.organization}`,
      config.url && `URL:${config.url}`,
      'END:VCARD',
    ].filter(Boolean)
    return lines.join('\n')
  }, [])

  const getContent = useCallback((): string => {
    switch (contentType) {
      case 'wifi':
        return generateWifiString(wifiConfig)
      case 'vcard':
        return generateVCardString(vcardConfig)
      default:
        return text
    }
  }, [contentType, text, wifiConfig, vcardConfig, generateWifiString, generateVCardString])

  const generateQRCode = useCallback(async () => {
    const content = getContent()
    if (!content.trim()) {
      setQrDataUrl('')
      return
    }

    addRecentTool(meta.id)
    setError('')

    try {
      const dataUrl = await QRCode.toDataURL(content, {
        width: size,
        margin: 2,
        color: {
          dark: fgColor,
          light: bgColor,
        },
        errorCorrectionLevel: errorCorrection,
      })
      setQrDataUrl(dataUrl)
      addHistory(meta.id, content.slice(0, 100))
    } catch (e) {
      setError((e as Error).message)
      setQrDataUrl('')
    }
  }, [getContent, size, fgColor, bgColor, errorCorrection, addHistory, addRecentTool])

  useEffect(() => {
    const timer = setTimeout(() => {
      generateQRCode()
    }, 300)
    return () => clearTimeout(timer)
  }, [generateQRCode])

  const downloadQRCode = useCallback(() => {
    if (!qrDataUrl) return
    const link = document.createElement('a')
    link.download = `qrcode-${Date.now()}.png`
    link.href = qrDataUrl
    link.click()
  }, [qrDataUrl])

  const copyQRCode = useCallback(async () => {
    if (!qrDataUrl) return
    try {
      const response = await fetch(qrDataUrl)
      const blob = await response.blob()
      await navigator.clipboard.write([
        new ClipboardItem({ 'image/png': blob }),
      ])
    } catch (e) {
      console.error('Failed to copy QR code:', e)
    }
  }, [qrDataUrl])

  const reset = () => {
    setText('')
    setWifiConfig({ ssid: '', password: '', security: 'WPA', hidden: false })
    setVCardConfig({ name: '', phone: '', email: '', organization: '', url: '' })
    setQrDataUrl('')
    setError('')
  }

  const renderContentInput = () => {
    switch (contentType) {
      case 'wifi':
        return (
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-text-muted uppercase tracking-wider mb-1">
                WiFi 名称 (SSID)
              </label>
              <input
                type="text"
                value={wifiConfig.ssid}
                onChange={(e) => setWifiConfig({ ...wifiConfig, ssid: e.target.value })}
                placeholder="输入 WiFi 名称..."
                className="w-full px-3 py-2 rounded-lg bg-bg-raised border border-border-base text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-text-muted uppercase tracking-wider mb-1">
                密码
              </label>
              <input
                type="password"
                value={wifiConfig.password}
                onChange={(e) => setWifiConfig({ ...wifiConfig, password: e.target.value })}
                placeholder="输入 WiFi 密码..."
                className="w-full px-3 py-2 rounded-lg bg-bg-raised border border-border-base text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent"
              />
            </div>
            <div className="flex gap-4">
              <div className="flex-1">
                <label className="block text-xs font-medium text-text-muted uppercase tracking-wider mb-1">
                  加密类型
                </label>
                <select
                  value={wifiConfig.security}
                  onChange={(e) => setWifiConfig({ ...wifiConfig, security: e.target.value as 'WPA' | 'WEP' | 'nopass' })}
                  className="w-full px-3 py-2 rounded-lg bg-bg-raised border border-border-base text-sm text-text-primary focus:outline-none focus:border-accent"
                >
                  <option value="WPA">WPA/WPA2</option>
                  <option value="WEP">WEP</option>
                  <option value="nopass">无密码</option>
                </select>
              </div>
              <div className="flex items-end">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={wifiConfig.hidden}
                    onChange={(e) => setWifiConfig({ ...wifiConfig, hidden: e.target.checked })}
                    className="w-4 h-4 rounded border-border-base bg-bg-raised text-accent focus:ring-accent"
                  />
                  <span className="text-sm text-text-secondary">隐藏网络</span>
                </label>
              </div>
            </div>
          </div>
        )
      case 'vcard':
        return (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-text-muted uppercase tracking-wider mb-1">
                  姓名
                </label>
                <input
                  type="text"
                  value={vcardConfig.name}
                  onChange={(e) => setVCardConfig({ ...vcardConfig, name: e.target.value })}
                  placeholder="张三"
                  className="w-full px-3 py-2 rounded-lg bg-bg-raised border border-border-base text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-text-muted uppercase tracking-wider mb-1">
                  电话
                </label>
                <input
                  type="tel"
                  value={vcardConfig.phone}
                  onChange={(e) => setVCardConfig({ ...vcardConfig, phone: e.target.value })}
                  placeholder="13800138000"
                  className="w-full px-3 py-2 rounded-lg bg-bg-raised border border-border-base text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-text-muted uppercase tracking-wider mb-1">
                邮箱
              </label>
              <input
                type="email"
                value={vcardConfig.email}
                onChange={(e) => setVCardConfig({ ...vcardConfig, email: e.target.value })}
                placeholder="example@email.com"
                className="w-full px-3 py-2 rounded-lg bg-bg-raised border border-border-base text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-text-muted uppercase tracking-wider mb-1">
                  公司
                </label>
                <input
                  type="text"
                  value={vcardConfig.organization}
                  onChange={(e) => setVCardConfig({ ...vcardConfig, organization: e.target.value })}
                  placeholder="公司名称"
                  className="w-full px-3 py-2 rounded-lg bg-bg-raised border border-border-base text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-text-muted uppercase tracking-wider mb-1">
                  网站
                </label>
                <input
                  type="url"
                  value={vcardConfig.url}
                  onChange={(e) => setVCardConfig({ ...vcardConfig, url: e.target.value })}
                  placeholder="https://example.com"
                  className="w-full px-3 py-2 rounded-lg bg-bg-raised border border-border-base text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent"
                />
              </div>
            </div>
          </div>
        )
      default:
        return (
          <div className="flex flex-col gap-2 flex-1">
            <label className="text-xs font-medium text-text-muted uppercase tracking-wider">
              {contentType === 'url' ? 'URL 地址' : '文本内容'}
            </label>
            <textarea
              className="tool-input flex-1 font-mono text-xs leading-relaxed min-h-[120px]"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder={contentType === 'url' ? 'https://example.com' : '输入要编码的文本...'}
              spellCheck={false}
            />
          </div>
        )
    }
  }

  return (
    <ToolLayout meta={meta} onReset={reset} outputValue={qrDataUrl}>
      <div className="flex items-center gap-2 mb-4 flex-wrap">
        <div className="flex items-center gap-1 bg-bg-raised rounded-lg p-1">
          {[
            { type: 'text' as ContentType, label: '文本', icon: null },
            { type: 'url' as ContentType, label: 'URL', icon: null },
            { type: 'wifi' as ContentType, label: 'WiFi', icon: Wifi },
            { type: 'vcard' as ContentType, label: '名片', icon: null },
          ].map(({ type, label, icon: Icon }) => (
            <button
              key={type}
              onClick={() => { setContentType(type); setQrDataUrl('') }}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors flex items-center gap-1
                ${contentType === type ? 'bg-accent text-bg-base' : 'text-text-muted hover:text-text-primary'}`}
            >
              {Icon && <Icon className="w-3.5 h-3.5" />}
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-4">
          {renderContentInput()}

          <div className="border-t border-border-base pt-4 space-y-3">
            <h3 className="text-xs font-medium text-text-muted uppercase tracking-wider">样式设置</h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-text-secondary mb-1">尺寸: {size}px</label>
                <input
                  type="range"
                  min="128"
                  max="512"
                  step="32"
                  value={size}
                  onChange={(e) => setSize(Number(e.target.value))}
                  className="w-full"
                />
              </div>
              <div>
                <label className="block text-xs text-text-secondary mb-1">容错级别</label>
                <select
                  value={errorCorrection}
                  onChange={(e) => setErrorCorrection(e.target.value as ErrorCorrectionLevel)}
                  className="w-full px-2 py-1 rounded bg-bg-raised border border-border-base text-xs text-text-primary focus:outline-none focus:border-accent"
                >
                  <option value="L">L - 7%</option>
                  <option value="M">M - 15%</option>
                  <option value="Q">Q - 25%</option>
                  <option value="H">H - 30%</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-text-secondary mb-1">前景色</label>
                <div className="flex gap-2">
                  <input
                    type="color"
                    value={fgColor}
                    onChange={(e) => setFgColor(e.target.value)}
                    className="w-10 h-8 rounded cursor-pointer"
                  />
                  <input
                    type="text"
                    value={fgColor}
                    onChange={(e) => setFgColor(e.target.value)}
                    className="flex-1 px-2 py-1 rounded bg-bg-raised border border-border-base text-xs text-text-primary font-mono"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs text-text-secondary mb-1">背景色</label>
                <div className="flex gap-2">
                  <input
                    type="color"
                    value={bgColor}
                    onChange={(e) => setBgColor(e.target.value)}
                    className="w-10 h-8 rounded cursor-pointer"
                  />
                  <input
                    type="text"
                    value={bgColor}
                    onChange={(e) => setBgColor(e.target.value)}
                    className="flex-1 px-2 py-1 rounded bg-bg-raised border border-border-base text-xs text-text-primary font-mono"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col items-center justify-center">
          {error ? (
            <div className="w-full rounded-lg bg-rose-500/10 border border-rose-500/30 p-4">
              <p className="text-xs text-rose-400/80">{error}</p>
            </div>
          ) : qrDataUrl ? (
            <div className="space-y-4">
              <div className="bg-white rounded-lg p-4 shadow-lg">
                <img src={qrDataUrl} alt="QR Code" className="max-w-full" style={{ width: Math.min(size, 300) }} />
              </div>
              <div className="flex gap-2 justify-center">
                <button onClick={downloadQRCode} className="btn-primary flex items-center gap-1">
                  <Download className="w-4 h-4" />
                  下载
                </button>
                <button onClick={copyQRCode} className="btn-ghost flex items-center gap-1">
                  {copied ? <Check className="w-4 h-4 text-accent" /> : <Copy className="w-4 h-4" />}
                  复制图片
                </button>
              </div>
            </div>
          ) : (
            <div className="w-64 h-64 rounded-lg bg-bg-raised border border-border-base flex items-center justify-center">
              <div className="text-center text-text-muted">
                <QrCode className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p className="text-xs">输入内容生成二维码</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </ToolLayout>
  )
}
