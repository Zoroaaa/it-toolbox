import type { ToolMeta } from '@toolbox/types/tool'

export const meta: ToolMeta = {
  id: 'json-schema-verify',
  name: 'JSON Schema验证',
  nameEn: 'JSON Schema Validator',
  description: '输入JSON+Schema，实时验证，错误定位',
  category: 'format',
  tags: ['json', 'schema', 'validate', 'ajv', 'verify'],
  keywords: ['JSON', 'Schema', '验证', '校验', 'ajv'],
  icon: 'FileCheck',
}
