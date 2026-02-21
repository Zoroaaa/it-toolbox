import type { ToolMeta } from '@toolbox/types/tool'

export const meta: ToolMeta = {
  id: 'svg-to-data-uri',
  name: 'SVG → Data URI',
  nameEn: 'SVG to Data URI',
  description: 'SVG 文件转 Data URI/Base64，可内联到 CSS/HTML 中使用',
  category: 'image',
  tags: ['svg', 'data-uri', 'base64', 'inline', 'css', 'html'],
  keywords: ['内联', '转换', '嵌入'],
  icon: 'FileCode',
  isNew: true,
}
