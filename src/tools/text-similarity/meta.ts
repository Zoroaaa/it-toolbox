import type { ToolMeta } from '@toolbox/types/tool'

export const meta: ToolMeta = {
  id: 'text-similarity',
  name: '文本相似度',
  nameEn: 'Text Similarity',
  description: '计算两段文本的相似度，基于 Levenshtein 距离',
  category: 'text',
  tags: ['text', 'similarity', 'levenshtein', 'compare'],
  keywords: ['相似度', '比较', '距离', '差异'],
  icon: 'GitCompare',
}
