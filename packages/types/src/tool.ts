export type Category =
  | 'format'
  | 'encoding'
  | 'crypto'
  | 'network'
  | 'text'
  | 'image'
  | 'color'
  | 'generator'
  | 'converter'
  | 'datetime'
  | 'ai'
  | 'devops'

export interface ToolMeta {
  id: string
  name: string
  nameEn: string
  description: string
  category: Category
  tags: string[]
  keywords?: string[]
  icon: string
  requiresApi?: boolean
  isNew?: boolean
}

export const CATEGORY_LABELS: Record<Category, string> = {
  format:    '格式化',
  encoding:  '编码解码',
  crypto:    '加密哈希',
  network:   '网络 HTTP',
  text:      '文本处理',
  image:     '图片媒体',
  color:     '颜色设计',
  generator: '数据生成',
  converter: '单位转换',
  datetime:  '时间日期',
  ai:        'AI 增强',
  devops:    '开发规范',
}

export const CATEGORY_ICONS: Record<Category, string> = {
  format:    'Braces',
  encoding:  'Binary',
  crypto:    'Lock',
  network:   'Globe',
  text:      'Type',
  image:     'Image',
  color:     'Palette',
  generator: 'Shuffle',
  converter: 'ArrowLeftRight',
  datetime:  'Clock',
  ai:        'Sparkles',
  devops:    'GitBranch',
}
