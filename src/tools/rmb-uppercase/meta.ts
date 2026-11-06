import type { ToolMeta } from '@toolbox/types/tool'

export const meta: ToolMeta = {
  id: 'rmb-uppercase',
  name: '人民币大写',
  nameEn: 'RMB Amount in Words',
  description: '数字金额转中文大写，支持角分、零的合并、负数与万亿级金额，符合票据填写规范',
  category: 'converter',
  tags: ['rmb', 'cny', 'chinese', 'amount', 'invoice'],
  keywords: ['人民币大写', '金额大写', '财务', '发票', '大写金额', '壹贰叁'],
  icon: 'Banknote',
}
