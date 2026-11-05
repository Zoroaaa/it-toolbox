import type { ToolMeta } from '@toolbox/types/tool'

export const meta: ToolMeta = {
  id: 'env-diff',
  name: '环境变量 Diff',
  nameEn: 'Environment Variables Diff',
  description: '两段.env文件对比，高亮差异，安全脱敏显示',
  category: 'text',
  tags: ['env', 'diff', 'compare', 'environment', 'variables'],
  keywords: ['环境变量', '对比', '差异', '配置'],
  icon: 'GitCompare',
}
