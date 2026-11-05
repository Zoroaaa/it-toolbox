import type { ToolMeta } from '@toolbox/types/tool'

export const meta: ToolMeta = {
  id: 'password-strength',
  name: '密码强度分析',
  nameEn: 'Password Strength Analyzer',
  description: '实时分析密码强度，破解时间估算，改进建议',
  category: 'crypto',
  tags: ['password', 'strength', 'security', 'analyze', 'zxcvbn'],
  keywords: ['密码', '强度', '安全', '破解'],
  icon: 'Shield',
}
