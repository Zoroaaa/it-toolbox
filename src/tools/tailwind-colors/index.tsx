import { useState } from 'react'
import { ToolLayout } from '@/components/tool/ToolLayout'
import { meta } from './meta'
import { TAILWIND_COLORS } from '@it-toolbox/core'

export default function TailwindColorsTool() {
  const [copiedKey, setCopiedKey] = useState<string | null>(null)

  const handleCopy = (colorName: string, shade: string, color: string) => {
    navigator.clipboard.writeText(color)
    const key = `${colorName}-${shade}`
    setCopiedKey(key)
    setTimeout(() => setCopiedKey(null), 1500)
  }

  return (
    <ToolLayout meta={meta}>
      <div className="space-y-6">
        {Object.entries(TAILWIND_COLORS).map(([colorName, shades]) => (
          <div key={colorName}>
            <h3 className="text-sm font-medium text-text-primary mb-2 capitalize">{colorName}</h3>
            <div className="flex gap-1">
              {Object.entries(shades).map(([shade, color]) => {
                const key = `${colorName}-${shade}`
                const isCopied = copiedKey === key
                return (
                  <div
                    key={shade}
                    className="flex-1 cursor-pointer group"
                    onClick={() => handleCopy(colorName, shade, color)}
                    title={`${colorName}-${shade}: ${color}`}
                  >
                    <div
                      className="h-12 rounded transition-all group-hover:ring-2 group-hover:ring-accent group-hover:scale-105"
                      style={{ backgroundColor: color }}
                    />
                    <div className="mt-1 text-xs text-center select-none" style={{ color: isCopied ? 'var(--accent)' : 'var(--text-muted)' }}>
                      {isCopied ? '✓' : shade}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        ))}

        <p className="text-sm text-text-muted">点击颜色块复制 HEX 值</p>
      </div>
    </ToolLayout>
  )
}
