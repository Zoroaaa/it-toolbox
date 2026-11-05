import type { ToolMeta } from '@toolbox/types/tool'

export const meta: ToolMeta = {
  id: 'sql-gen',
  name: 'SQL测试数据生成',
  nameEn: 'SQL Test Data Generator',
  description: '定义表结构，生成INSERT语句，支持多种数据类型',
  category: 'generator',
  tags: ['sql', 'generate', 'insert', 'test', 'data', 'mock'],
  keywords: ['SQL', '生成', 'INSERT', '测试数据', '数据库'],
  icon: 'Database',
}
