import type { ToolMeta } from '@toolbox/types/tool'

export const meta: ToolMeta = {
  id: 'exchange-rate',
  name: '汇率换算',
  nameEn: 'Exchange Rate',
  description: '实时汇率换算，支持 150+ 货币，历史趋势图表',
  category: 'converter',
  tags: ['exchange', 'rate', 'currency', 'money', 'convert'],
  keywords: ['汇率', '货币', '换算', '美元', '人民币'],
  icon: 'Coins',
  requiresApi: true,
}
