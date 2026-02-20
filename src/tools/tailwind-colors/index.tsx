import { ToolLayout } from '@/components/tool/ToolLayout'
import { meta } from './meta'
import { TAILWIND_COLORS } from '@it-toolbox/core'

export default function TailwindColorsTool() {
  return (
    <ToolLayout meta={meta}>
      <div className="space-y-6">
        {Object.entries(TAILWIND_COLORS).map(([colorName, shades]) => (
          <div key={colorName}>
            <h3 className="text-sm font-medium text-text-primary mb-2 capitalize">{colorName}</h3>
            <div className="flex gap-1">
              {Object.entries(shades).map(([shade, color]) => (
                <div
                  key={shade}
                  className="flex-1 cursor-pointer group"
                  onClick={() => navigator.clipboard.writeText(color)}
                  title={`${colorName}-${shade}: ${color}`}
                >
                  <div
                    className="h-12 rounded group-hover:ring-2 group-hover:ring-accent-primary transition-all"
                    style={{ backgroundColor: color }}
                  />
                  <div className="mt-1 text-xs text-text-tertiary text-center">{shade}</div>
                </div>
              ))}
            </div>
          </div>
        ))}

        <p className="text-sm text-text-tertiary">点击颜色块可复制颜色值</p>
      </div>
    </ToolLayout>
  )
}
