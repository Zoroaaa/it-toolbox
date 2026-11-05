import type { ToolMeta } from '@toolbox/types/tool'

export const meta: ToolMeta = {
  id: 'ai-code-review',
  name: 'AI 代码 Review',
  nameEn: 'AI Code Review',
  description: 'AI 进行 Code Review，安全漏洞、性能、可读性三维分析',
  category: 'ai',
  tags: ['ai', 'code', 'review', 'security', 'performance'],
  keywords: ['代码审查', '安全', '性能', '可读性'],
  icon: 'GitPullRequest',
  requiresApi: true,
}
