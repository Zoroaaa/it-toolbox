import type { ToolMeta } from '@toolbox/types/tool'

export const meta: ToolMeta = {
  id: 'ai-json-schema',
  name: 'AI生成Schema',
  nameEn: 'AI JSON Schema Generator',
  description: '粘贴JSON样本，AI生成带注释的JSON Schema',
  category: 'ai',
  tags: ['ai', 'json', 'schema', 'generate', 'validate'],
  keywords: ['AI', 'JSON', 'Schema', '生成', '验证'],
  icon: 'Sparkles',
  requiresApi: true,
}
