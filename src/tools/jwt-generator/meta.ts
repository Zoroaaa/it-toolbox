import type { ToolMeta } from '@toolbox/types/tool'

export const meta: ToolMeta = {
  id: 'jwt-generator',
  name: 'JWT 生成',
  nameEn: 'JWT Generator',
  description: '填写 Payload/Header，选择算法生成 Token',
  category: 'crypto',
  tags: ['jwt', 'token', 'generate', 'hs256', 'rs256'],
  keywords: ['令牌', '认证', '签名'],
  icon: 'KeyRound',
}
