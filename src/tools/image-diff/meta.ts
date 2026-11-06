import type { ToolMeta } from '@toolbox/types/tool'

export const meta: ToolMeta = {
  id: 'image-diff',
  name: '图片对比',
  nameEn: 'Image Diff',
  description: '两张图逐像素对比，滑块叠加查看差异，输出差异比例与高亮图',
  category: 'image',
  tags: ['image', 'diff', 'compare', 'pixel', 'visual-regression'],
  keywords: ['图片对比', '找不同', '像素差异', '视觉回归', '差异比例'],
  icon: 'Diff',
}
