import type { ToolMeta } from '@toolbox/types/tool'

export const meta: ToolMeta = {
  id: 'dns-lookup',
  name: 'DNS 查询',
  nameEn: 'DNS Lookup',
  description: '查询域名的 A、AAAA、MX、TXT、CNAME 记录',
  category: 'network',
  tags: ['dns', 'lookup', 'domain', 'mx', 'txt', 'cname'],
  keywords: ['DNS', '域名', '记录', '查询'],
  icon: 'Search',
  requiresApi: true,
}
