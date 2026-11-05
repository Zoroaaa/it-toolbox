import type { ToolMeta } from '@toolbox/types/tool'

export const meta: ToolMeta = {
  id: 'ssl-checker',
  name: 'SSL证书检测',
  nameEn: 'SSL Certificate Checker',
  description: '检测域名SSL有效期/颁发机构/SANs',
  category: 'network',
  tags: ['ssl', 'tls', 'certificate', 'https', 'security'],
  keywords: ['SSL', '证书', 'HTTPS', '安全', '加密'],
  icon: 'Shield',
  requiresApi: true,
}
