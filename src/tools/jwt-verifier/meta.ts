import type { ToolMeta } from '@toolbox/types/tool'

export const meta: ToolMeta = {
  id: 'jwt-verifier',
  name: 'JWT 签名验证',
  nameEn: 'JWT Signature Verifier',
  description: '输入HMAC秘钥或RSA公钥，验证JWT签名有效性',
  category: 'crypto',
  tags: ['jwt', 'verify', 'signature', 'hmac', 'rsa', 'token'],
  keywords: ['验证', '签名', '令牌', '认证'],
  icon: 'ShieldCheck',
}
