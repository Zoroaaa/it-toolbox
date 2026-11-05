import type { ToolMeta } from '@toolbox/types/tool'

export const meta: ToolMeta = {
  id: 'ai-text-extract',
  name: 'AI结构化提取',
  nameEn: 'AI Text Extractor',
  description: '非结构化文本→指定字段JSON，智能提取关键信息',
  category: 'ai',
  tags: ['ai', 'extract', 'text', 'json', 'nlp', 'parse'],
  keywords: ['提取', '结构化', 'JSON', '信息提取', '文本分析'],
  icon: 'FileSearch',
  requiresApi: true,
}
