import type { ToolMeta } from '@toolbox/types/tool'

export const meta: ToolMeta = {
  id: 'bcrypt',
  name: 'Bcrypt 哈希',
  nameEn: 'Bcrypt Hash',
  description: 'Bcrypt 密码哈希与验证，rounds 可配置',
  category: 'crypto',
  tags: ['bcrypt', 'hash', 'password', 'verify'],
  keywords: ['密码', '哈希', '验证'],
  icon: 'LockKeyhole',
}
