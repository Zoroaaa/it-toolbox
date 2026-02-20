import type { ToolMeta } from '@toolbox/types/tool'

export const meta: ToolMeta = {
  id: 'ip-lookup',
  name: 'IP 地址查询',
  nameEn: 'IP Lookup',
  description: '查询 IP 地址的地理位置、ASN 等信息',
  category: 'network',
  tags: ['ip', 'lookup', 'geo', 'asn', 'location'],
  keywords: ['IP', '地址', '位置', '查询'],
  icon: 'Globe',
  requiresApi: true,
}
