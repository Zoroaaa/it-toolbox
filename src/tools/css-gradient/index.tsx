import { useState, useMemo, useCallback } from 'react'
import { Plus, Copy, Check } from 'lucide-react'
import { ToolLayout } from '@/components/tool/ToolLayout'
import { meta } from './meta'
import { generateCssGradient, GradientStop } from '@core/color'
import { useAppStore } from '@/store/app'
import { useClipboard } from '@/hooks/useClipboard'
import { useTranslation } from 'react-i18next'

export default function CssGradientTool() {
  const { t } = useTranslation()
  const [type, setType] = useState<'linear' | 'radial' | 'conic'>('linear')
  const [angle, setAngle] = useState(90)
  const [stops, setStops] = useState<GradientStop[]>([
    { color: '#3b82f6', position: 0 },
    { color: '#8b5cf6', position: 100 },
  ])
  const addRecentTool = useAppStore((s) => s.addRecentTool)
  const { copy, copied } = useClipboard()

  const addStop = useCallback(() => {
    const newPosition = stops.length > 0 ? (stops[stops.length - 1].position + 50) % 100 : 50
    setStops([...stops, { color: '#000000', position: newPosition }])
  }, [stops])

  const removeStop = useCallback((index: number) => {
    if (stops.length > 2) {
      setStops(stops.filter((_, i) => i !== index))
    }
  }, [stops])

  const updateStop = useCallback((index: number, field: 'color' | 'position', value: string | number) => {
    const newStops = [...stops]
    newStops[index] = { ...newStops[index], [field]: value }
    setStops(newStops)
  }, [stops])

  const css = useMemo(() => {
    return generateCssGradient({ type, angle, stops })
  }, [type, angle, stops])

  const previewStyle = useMemo(() => ({
    background: css,
  }), [css])

  const handleCopy = useCallback(() => {
    addRecentTool(meta.id)
    copy(`background: ${css};`)
  }, [css, copy, addRecentTool])

  const reset = () => {
    setType('linear')
    setAngle(90)
    setStops([
      { color: '#3b82f6', position: 0 },
      { color: '#8b5cf6', position: 100 },
    ])
  }

  return (
    <ToolLayout meta={meta} onReset={reset}>
      <div className="flex items-center gap-2 mb-4 flex-wrap">
        <div className="flex items-center gap-1 bg-bg-raised rounded-lg p-1">
          {(['linear', 'radial', 'conic'] as const).map(typeKey => (
            <button
              key={typeKey}
              onClick={() => setType(typeKey)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors
                ${type === typeKey ? 'bg-accent text-bg-base' : 'text-text-muted hover:text-text-primary'}`}
            >
              {typeKey === 'linear' ? t('tools.cssGradient.linear') : typeKey === 'radial' ? t('tools.cssGradient.radial') : t('tools.cssGradient.conic')}
            </button>
          ))}
        </div>

        {type === 'linear' && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-text-muted">{t('tools.cssGradient.angle')}</span>
            <input
              type="number"
              value={angle}
              onChange={(e) => setAngle(Number(e.target.value))}
              min={0}
              max={360}
              className="tool-input w-20"
            />
            <span className="text-text-muted">°</span>
          </div>
        )}
      </div>

      <div className="p-4 bg-bg-surface border border-border-base rounded-lg mb-4">
        <div className="flex items-center justify-between mb-3">
          <label className="text-xs font-medium text-text-muted uppercase tracking-wider">{t('tools.cssGradient.colorStops')}</label>
          <button onClick={addStop} className="btn-primary">
            <Plus className="w-4 h-4" />
            {t('tools.cssGradient.addStop')}
          </button>
        </div>

        <div className="space-y-2">
          {stops.map((stop, index) => (
            <div key={index} className="flex items-center gap-3">
              <input
                type="color"
                value={stop.color}
                onChange={(e) => updateStop(index, 'color', e.target.value)}
                className="w-10 h-10 rounded cursor-pointer border border-border-base"
              />
              <input
                type="number"
                value={stop.position}
                onChange={(e) => updateStop(index, 'position', Number(e.target.value))}
                min={0}
                max={100}
                className="tool-input w-20"
              />
              <span className="text-text-muted">%</span>
              {stops.length > 2 && (
                <button
                  onClick={() => removeStop(index)}
                  className="text-rose-400 hover:text-rose-300 text-sm"
                >
                  {t('common.remove')}
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      <div
        className="w-full h-48 rounded-lg border border-border-base mb-4"
        style={previewStyle}
      />

      <div className="p-4 bg-bg-surface border border-border-base rounded-lg">
        <div className="flex items-center justify-between mb-2">
          <label className="text-xs font-medium text-text-muted uppercase tracking-wider">{t('tools.cssGradient.cssCode')}</label>
          <button onClick={handleCopy} className="btn-ghost">
            {copied ? <Check className="w-4 h-4 text-accent" /> : <Copy className="w-4 h-4" />}
            {copied ? t('common.copied') : t('common.copy')}
          </button>
        </div>
        <code className="block text-sm font-mono text-text-primary break-all">
          background: {css};
        </code>
      </div>
    </ToolLayout>
  )
}
