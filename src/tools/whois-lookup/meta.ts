import type { ToolMeta } from '@toolbox/types/tool'

export const meta: ToolMeta = {
  id: 'whois-lookup',
  name: 'WHOIS查询',
  nameEn: 'WHOIS Lookup',
  description: '域名注册信息查询',
  category: 'network',
  tags: ['whois', 'domain', 'lookup', 'register', 'dns'],
  keywords: ['WHOIS', '域名', '查询', '注册', 'DNS'],
  icon: 'Search',
  requiresApi: true,
}
