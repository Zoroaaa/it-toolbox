import type { LucideIcon } from 'lucide-react'
import { ICON_MAP, type IconName } from './icon-map'

export function getIconComponent(iconName: string): LucideIcon {
  const icon = ICON_MAP[iconName as IconName]
  if (!icon && import.meta.env.DEV) {
    console.warn(`[icons] 未注册的图标名："${iconName}"，已回退为 Wrench`)
  }
  return icon ?? ICON_MAP.Wrench
}
