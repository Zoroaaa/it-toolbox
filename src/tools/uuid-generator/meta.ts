import type { ToolMeta } from '@toolbox/types/tool'

export const meta: ToolMeta = {
  id: 'uuid-generator',
  name: 'UUID 生成器',
  nameEn: 'UUID Generator',
  description: 'UUID v4 批量生成（最多1000），大写/小写/带连字符可选',
  category: 'generator',
  tags: ['uuid', 'generate', 'unique', 'id', 'guid', 'v4'],
  keywords: ['唯一', '标识符', 'GUID'],
  icon: 'Fingerprint',
}
