import type { ToolMeta } from '@toolbox/types/tool'

export const meta: ToolMeta = {
  id: 'image-convert',
  name: '图片格式转换',
  nameEn: 'Image Converter',
  description: 'PNG/JPEG/WebP 格式转换，支持倍率放大、透明背景与 SVG 代码导出位图',
  category: 'image',
  tags: ['image', 'convert', 'png', 'jpeg', 'webp', 'svg', 'format'],
  keywords: ['格式转换', '图片', '批量', 'SVG转PNG', '2x', '透明背景'],
  icon: 'RefreshCw',
}
