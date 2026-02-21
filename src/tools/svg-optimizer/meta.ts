import type { ToolMeta } from '@toolbox/types/tool'

export const meta: ToolMeta = {
  id: 'svg-optimizer',
  name: 'SVG 优化',
  nameEn: 'SVG Optimizer',
  description: '优化 SVG 文件，去除冗余属性和元数据，显示压缩率',
  category: 'image',
  tags: ['svg', 'optimize', 'compress', 'minify', 'vector'],
  keywords: ['矢量', '优化', '压缩', 'svgo'],
  icon: 'Minimize2',
  isNew: true,
}
