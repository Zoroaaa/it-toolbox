import type { ToolMeta } from '@toolbox/types/tool'

export const meta: ToolMeta = {
  id: 'cert-decoder',
  name: 'TLS 证书解析',
  nameEn: 'TLS Certificate Decoder',
  description: '解析 PEM 证书，显示域名/有效期/指纹/SAN',
  category: 'crypto',
  tags: ['certificate', 'tls', 'ssl', 'pem', 'x509'],
  keywords: ['证书', 'TLS', 'SSL', '解析'],
  icon: 'Shield',
}
