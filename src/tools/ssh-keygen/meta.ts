import type { ToolMeta } from '@toolbox/types/tool'

export const meta: ToolMeta = {
  id: 'ssh-keygen',
  name: 'SSH 密钥生成',
  nameEn: 'SSH Key Generator',
  description: 'Ed25519/RSA SSH 密钥对生成，OpenSSH 格式',
  category: 'crypto',
  tags: ['ssh', 'key', 'generate', 'ed25519', 'rsa', 'openssh'],
  keywords: ['密钥', 'SSH', '服务器'],
  icon: 'Terminal',
}
