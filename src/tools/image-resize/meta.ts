import type { ToolMeta } from '@toolbox/types/tool'

export const meta: ToolMeta = {
  id: 'image-resize',
  name: '图片裁剪缩放',
  nameEn: 'Image Resize',
  description: '指定尺寸/比例，填充/裁剪/拉伸模式，批量处理',
  category: 'image',
  tags: ['image', 'resize', 'crop', 'scale', 'batch'],
  keywords: ['缩放', '裁剪', '调整尺寸'],
  icon: 'Crop',
  isNew: true,
}
