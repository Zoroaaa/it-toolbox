import type { ToolMeta } from '@toolbox/types/tool'

export const meta: ToolMeta = {
  id: 'jwt-decoder',
  name: 'JWT 解析',
  nameEn: 'JWT Decoder',
  description: '解析 Header/Payload，时间戳转人类时间，高亮过期',
  category: 'encoding',
  tags: ['jwt', 'token', 'decode', 'auth', 'json web token'],
  keywords: ['令牌', '认证', '身份'],
  icon: 'KeyRound',
}
