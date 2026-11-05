import type { ToolMeta } from '@toolbox/types/tool'

export const meta: ToolMeta = {
  id: 'ai-error-explain',
  name: 'AI报错解释',
  nameEn: 'AI Error Explainer',
  description: '粘贴错误信息，AI解释原因和修复方案',
  category: 'ai',
  tags: ['ai', 'error', 'debug', 'explain', 'fix'],
  keywords: ['错误', '报错', '调试', '修复', '异常'],
  icon: 'Bug',
  requiresApi: true,
}
