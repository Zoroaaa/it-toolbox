import type { ToolMeta } from '@toolbox/types/tool'

export const meta: ToolMeta = {
  id: 'ai-sql',
  name: 'AI SQL 生成',
  nameEn: 'AI SQL Generator',
  description: '自然语言转 SQL，支持提供数据库 Schema 生成精准查询',
  category: 'ai',
  tags: ['ai', 'sql', 'database', 'query', 'generate'],
  keywords: ['数据库', '查询', '生成', 'select', 'insert'],
  icon: 'Database',
  requiresApi: true,
}
