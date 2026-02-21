import type { ToolMeta } from '@toolbox/types/tool'

export const meta: ToolMeta = {
  id: 'ai-regex',
  name: 'AI 正则生成',
  nameEn: 'AI Regex Generator',
  description: '用自然语言描述，AI 自动生成正则表达式并附上解释',
  category: 'ai',
  tags: ['ai', 'regex', 'regexp', 'generate', 'nlp'],
  keywords: ['正则', '自然语言', '生成', '匹配'],
  icon: 'Sparkles',
  requiresApi: true,
}
