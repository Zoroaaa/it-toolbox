import type { ToolMeta } from '@toolbox/types/tool'

export const meta: ToolMeta = {
  id: 'rsa-keygen',
  name: 'RSA 密钥生成',
  nameEn: 'RSA Key Generator',
  description: '生成 RSA 密钥对，导出 PEM 格式',
  category: 'crypto',
  tags: ['rsa', 'key', 'generate', 'pem', 'asymmetric'],
  keywords: ['密钥', '公钥', '私钥'],
  icon: 'ShieldCheck',
}
