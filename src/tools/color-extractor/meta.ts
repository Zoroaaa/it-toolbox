import type { ToolMeta } from '@toolbox/types/tool'

export const meta: ToolMeta = {
  id: 'color-extractor',
  name: '图片取色',
  nameEn: 'Color Extractor',
  description: '上传图片提取主色调，生成配色板，支持 Hex/RGB 复制',
  category: 'image',
  tags: ['color', 'extract', 'palette', 'dominant', 'image', 'picker'],
  keywords: ['取色', '配色', '主色调', '颜色提取'],
  icon: 'Pipette',
  isNew: true,
}
