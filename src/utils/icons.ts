import * as Icons from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

const iconMap: Record<string, LucideIcon> = Icons as unknown as Record<string, LucideIcon>

export function getIconComponent(iconName: string): LucideIcon | undefined {
  return iconMap[iconName]
}
