import type { ToolMeta } from '@toolbox/types/tool'

export const meta: ToolMeta = {
  id: 'batch-process',
  name: '批量处理模式',
  nameEn: 'Batch Process Mode',
  description: '多工具批量处理，输入一次数据，依次通过多个工具转换',
  category: 'text',
  tags: ['batch', 'process', 'multiple', 'transform', 'workflow'],
  keywords: ['批量', '处理', '多工具', '工作流'],
  icon: 'Workflow',
}
