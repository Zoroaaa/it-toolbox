import type { ToolMeta } from '@toolbox/types/tool'

export const meta: ToolMeta = {
  id: 'hash-verify',
  name: '文件完整性校验',
  nameEn: 'File Integrity Verify',
  description: '上传文件计算MD5/SHA256，与预期值对比，支持批量校验',
  category: 'crypto',
  tags: ['hash', 'verify', 'checksum', 'md5', 'sha256', 'integrity'],
  keywords: ['校验', '完整性', '文件', '哈希'],
  icon: 'FileCheck',
}
