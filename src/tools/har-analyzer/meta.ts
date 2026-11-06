import type { ToolMeta } from '@toolbox/types/tool'

export const meta: ToolMeta = {
  id: 'har-analyzer',
  name: 'HAR 分析',
  nameEn: 'HAR Analyzer',
  description: '解析浏览器导出的 HAR，统计请求数、体积、耗时与状态码，按域名聚合并导出 CSV',
  category: 'network',
  tags: ['har', 'network', 'performance', 'waterfall', 'http'],
  keywords: ['HAR 分析', '性能分析', '请求瀑布', '慢请求', '抓包'],
  icon: 'Activity',
}
