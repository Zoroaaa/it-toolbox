import type { ToolMeta } from '@toolbox/types/tool'

export const meta: ToolMeta = {
  id: 'exif-reader',
  name: 'EXIF 数据读取',
  nameEn: 'EXIF Reader',
  description: '读取图片 EXIF 信息：拍摄参数/GPS/设备型号，支持脱敏导出',
  category: 'image',
  tags: ['exif', 'metadata', 'photo', 'gps', 'camera', 'jpeg'],
  keywords: ['元数据', '拍摄信息', '照片', '相机'],
  icon: 'Camera',
  isNew: true,
}
