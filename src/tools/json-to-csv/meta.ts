import type { ToolMeta } from '@toolbox/types/tool'

export const meta: ToolMeta = {
  id: 'json-to-csv',
  name: 'JSON 转 CSV',
  nameEn: 'JSON to CSV',
  description: '将 JSON 数组转换为 CSV 格式，支持自定义分隔符',
  category: 'format',
  tags: ['json', 'csv', 'convert', 'transform', 'export'],
  keywords: ['JSON', 'CSV', '转换', '导出', '表格'],
  icon: 'Table',
}
