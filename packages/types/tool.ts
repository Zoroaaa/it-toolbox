export type Category =
  | 'encoding'
  | 'crypto'
  | 'format'
  | 'text'
  | 'color'
  | 'network'
  | 'datetime'
  | 'generator'
  | 'image'
  | 'devops'
  | 'converter'
  | 'ai'

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
  encoding:  '编码解码',
  crypto:    '加密安全',
  format:    '格式化',
  text:      '文本处理',
  color:     '颜色设计',
  network:   '网络HTTP',
  datetime:  '时间日期',
  generator: '生成器',
  image:     '图片媒体',
  devops:    '开发规范',
  converter: '单位换算',
  ai:        'AI增强',
}

export const CATEGORY_ICONS: Record<Category, string> = {
  encoding:  'Binary',
  crypto:    'Lock',
  format:    'Braces',
  text:      'Type',
  color:     'Palette',
  network:   'Globe',
  datetime:  'Clock',
  generator: 'Shuffle',
  image:     'Image',
  devops:    'GitBranch',
  converter: 'ArrowLeftRight',
  ai:        'Sparkles',
}

export const CATEGORY_ORDER: Category[] = [
  'format',
  'encoding',
  'crypto',
  'text',
  'color',
  'network',
  'datetime',
  'generator',
  'image',
  'devops',
  'converter',
  'ai',
]
