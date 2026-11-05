import type { ToolMeta } from '@toolbox/types/tool'

export const meta: ToolMeta = {
  id: 'headers-check',
  name: 'HTTP安全头检测',
  nameEn: 'HTTP Security Headers Checker',
  description: '检测目标URL的安全头覆盖情况',
  category: 'network',
  tags: ['http', 'headers', 'security', 'csp', 'hsts', 'xss'],
  keywords: ['HTTP', '安全头', 'Header', '安全', '检测'],
  icon: 'ShieldCheck',
  requiresApi: true,
}
