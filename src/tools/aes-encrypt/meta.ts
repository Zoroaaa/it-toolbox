import type { ToolMeta } from '@toolbox/types/tool'

export const meta: ToolMeta = {
  id: 'aes-encrypt',
  name: 'AES 加密解密',
  nameEn: 'AES Encrypt/Decrypt',
  description: 'AES-GCM 对称加密与解密，密钥由密码派生',
  category: 'crypto',
  tags: ['aes', 'encrypt', 'decrypt', 'crypto', 'symmetric'],
  keywords: ['加密', '解密', '密码'],
  icon: 'Lock',
}
