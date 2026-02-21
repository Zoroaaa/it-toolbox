import { useState, useMemo } from 'react'
import chroma from 'chroma-js'
import { ToolLayout } from '@/components/tool/ToolLayout'
import { meta } from './meta'

const PRESET_PAIRS = [
  { fg: '#000000', bg: '#ffffff', label: '黑/白' },
  { fg: '#ffffff', bg: '#000000', label: '白/黑' },
  { fg: '#1e3a5f', bg: '#ffffff', label: '深蓝/白' },
  { fg: '#ffffff', bg: '#2563eb', label: '白/蓝' },
  { fg: '#374151', bg: '#f9fafb', label: '深灰/浅灰' },
  { fg: '#dc2626', bg: '#ffffff', label: '红/白' },
]

export default function ContrastChecker() {
  const [fg, setFg] = useState('#000000')
  const [bg, setBg] = useState('#ffffff')

  const result = useMemo(() => {
    try {
      const ratio = chroma.contrast(fg, bg)
      return {
        ratio,
        ratioStr: ratio.toFixed(2),
        aaLarge:  ratio >= 3,
        aaSmall:  ratio >= 4.5,
        aaaLarge: ratio >= 4.5,
        aaaSmall: ratio >= 7,
      }
    } catch {
      return null
    }
  }, [fg, bg])

  const grade = (pass: boolean) => pass
    ? <span className="text-green-400 font-semibold">✓ 通过</span>
    : <span className="text-red-400 font-semibold">✗ 不通过</span>

  const ratioColor = !result ? '' :
    result.ratio >= 7 ? 'text-green-400' :
    result.ratio >= 4.5 ? 'text-emerald-400' :
    result.ratio >= 3 ? 'text-yellow-400' : 'text-red-400'

  return (
    <ToolLayout meta={meta}>
      <div className="flex flex-col gap-5">
        {/* Preview */}
        <div className="rounded-xl border border-border-base overflow-hidden" style={{ backgroundColor: bg }}>
          <div className="p-8 text-center">
            <p className="text-2xl font-bold mb-2" style={{ color: fg }}>大号文本示例 (18pt+)</p>
            <p className="text-sm" style={{ color: fg }}>正文文本示例，14px / 1em 字号，这是实际显示效果预览。</p>
            <p className="text-xs mt-2" style={{ color: fg }}>Input text preview for WCAG contrast compliance testing</p>
          </div>
        </div>

        {/* Color pickers */}
        <div className="grid grid-cols-2 gap-4">
          {[
            { label: '前景色（文字）', color: fg, onChange: setFg },
            { label: '背景色',         color: bg, onChange: setBg },
          ].map(({ label, color, onChange }) => (
            <div key={label}>
              <label className="text-xs font-medium text-text-muted uppercase tracking-wider mb-2 block">{label}</label>
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-lg border border-border-base overflow-hidden shrink-0">
                  <input type="color" value={color} onChange={e => onChange(e.target.value)}
                    className="w-full h-full cursor-pointer border-0 p-0" style={{ margin: '-2px' }} />
                </div>
                <input type="text" value={color} onChange={e => onChange(e.target.value)}
                  className="flex-1 px-3 py-2 rounded-lg bg-bg-surface border border-border-base text-sm font-mono text-text-primary focus:outline-none focus:border-accent" />
              </div>
            </div>
          ))}
        </div>

        {/* Ratio display */}
        {result && (
          <div className="text-center py-4 bg-bg-surface border border-border-base rounded-xl">
            <div className={`text-5xl font-bold font-mono ${ratioColor}`}>{result.ratioStr}:1</div>
            <div className="text-sm text-text-muted mt-1">对比度比值</div>
          </div>
        )}

        {/* WCAG grades */}
        {result && (
          <div className="grid grid-cols-2 gap-3">
            {[
              { level: 'AA',  size: '大文本 (18pt+)', pass: result.aaLarge,  min: '3:1' },
              { level: 'AA',  size: '正文文本',       pass: result.aaSmall,  min: '4.5:1' },
              { level: 'AAA', size: '大文本 (18pt+)', pass: result.aaaLarge, min: '4.5:1' },
              { level: 'AAA', size: '正文文本',       pass: result.aaaSmall, min: '7:1' },
            ].map(({ level, size, pass, min }) => (
              <div key={level + size} className={`p-4 rounded-xl border ${pass ? 'border-green-500/30 bg-green-500/5' : 'border-red-500/20 bg-red-500/5'}`}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-bold text-text-primary">WCAG {level}</span>
                  {grade(pass)}
                </div>
                <div className="text-xs text-text-muted">{size}</div>
                <div className="text-xs text-text-muted mt-0.5">最低要求: {min}</div>
              </div>
            ))}
          </div>
        )}

        {/* Presets */}
        <div>
          <p className="text-xs text-text-muted mb-2">常用配色组合</p>
          <div className="flex flex-wrap gap-2">
            {PRESET_PAIRS.map(p => (
              <button key={p.label}
                onClick={() => { setFg(p.fg); setBg(p.bg) }}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-bg-surface border border-border-base hover:bg-bg-raised text-xs transition-colors"
              >
                <div className="flex">
                  <div className="w-3 h-4 rounded-l" style={{ backgroundColor: p.fg }} />
                  <div className="w-3 h-4 rounded-r" style={{ backgroundColor: p.bg }} />
                </div>
                {p.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </ToolLayout>
  )
}
