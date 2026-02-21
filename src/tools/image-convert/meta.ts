import type { ToolMeta } from '@toolbox/types/tool'

export const meta: ToolMeta = {
  id: 'image-convert',
  name: '图片格式转换',
  nameEn: 'Image Converter',
  description: 'PNG/JPEG/WebP/GIF 格式转换，含透明通道处理，批量处理',
  category: 'image',
  tags: ['image', 'convert', 'png', 'jpeg', 'webp', 'format'],
  keywords: ['格式转换', '图片', '批量'],
  icon: 'RefreshCw',
  isNew: true,
}
