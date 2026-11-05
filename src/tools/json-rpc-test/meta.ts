import type { ToolMeta } from '@toolbox/types/tool'

export const meta: ToolMeta = {
  id: 'json-rpc-test',
  name: 'JSON-RPC 测试',
  nameEn: 'JSON-RPC Tester',
  description: '构造JSON-RPC请求，查看响应，历史记录',
  category: 'network',
  tags: ['json-rpc', 'api', 'test', 'rpc', 'request'],
  keywords: ['JSON-RPC', 'API', '测试', 'RPC', '请求'],
  icon: 'Send',
  requiresApi: true,
}
