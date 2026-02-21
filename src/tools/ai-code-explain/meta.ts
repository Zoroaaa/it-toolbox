import type { ToolMeta } from '@toolbox/types/tool'

export const meta: ToolMeta = {
  id: 'ai-code-explain',
  name: 'AI 代码解释',
  nameEn: 'AI Code Explainer',
  description: '粘贴任意代码，AI 用中文为你详细解释逻辑和关键概念',
  category: 'ai',
  tags: ['ai', 'code', 'explain', 'review'],
  keywords: ['代码', '解释', '分析', '理解'],
  icon: 'BookOpen',
  requiresApi: true,
}
