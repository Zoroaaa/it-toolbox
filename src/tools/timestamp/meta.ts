import type { ToolMeta } from '@toolbox/types/tool'

export const meta: ToolMeta = {
  id: 'timestamp',
  name: '时间戳转换',
  nameEn: 'Timestamp Converter',
  description: 'Unix 时间戳与日期时间互转，支持毫秒/秒，全球时区',
  category: 'datetime',
  tags: ['timestamp', 'unix', 'datetime', 'timezone', 'convert'],
  keywords: ['时间', '日期', '时区'],
  icon: 'Clock',
}
