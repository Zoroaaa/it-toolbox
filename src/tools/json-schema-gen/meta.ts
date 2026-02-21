import type { ToolMeta } from '@toolbox/types/tool'

export const meta: ToolMeta = {
  id: 'json-schema-gen',
  name: 'JSON Schema 生成',
  nameEn: 'JSON Schema Generator',
  description: 'JSON 数据自动反推 JSON Schema，支持可选字段标注',
  category: 'devops',
  tags: ['json', 'schema', 'generate', 'validation', 'typescript'],
  keywords: ['模式推断', 'json验证', 'schema生成'],
  icon: 'FileJson',
  isNew: true,
}
