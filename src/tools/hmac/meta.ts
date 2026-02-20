import type { ToolMeta } from '@toolbox/types/tool'

export const meta: ToolMeta = {
  id: 'hmac',
  name: 'HMAC 计算',
  nameEn: 'HMAC Calculator',
  description: 'HMAC-SHA256/512 签名计算与验证',
  category: 'crypto',
  tags: ['hmac', 'sha256', 'sha512', 'signature', 'verify'],
  keywords: ['签名', '验证', '消息认证'],
  icon: 'Shield',
}
