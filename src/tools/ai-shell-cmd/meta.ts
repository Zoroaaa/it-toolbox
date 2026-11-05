import type { ToolMeta } from '@toolbox/types/tool'

export const meta: ToolMeta = {
  id: 'ai-shell-cmd',
  name: 'AI Shell命令生成',
  nameEn: 'AI Shell Command Generator',
  description: '自然语言→bash/PowerShell命令，含说明和风险提示',
  category: 'ai',
  tags: ['ai', 'shell', 'bash', 'powershell', 'command', 'cli'],
  keywords: ['Shell', '命令', 'Bash', 'PowerShell', 'CLI'],
  icon: 'Terminal',
  requiresApi: true,
}
