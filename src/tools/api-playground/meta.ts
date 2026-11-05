import type { ToolMeta } from '@toolbox/types/tool'

export const meta: ToolMeta = {
  id: 'api-playground',
  name: 'HTTP API 测试',
  nameEn: 'HTTP API Playground',
  description: '类 Postman 界面，发送 GET/POST/PUT/DELETE 请求，查看响应',
  category: 'network',
  tags: ['http', 'api', 'test', 'request', 'postman', 'rest'],
  keywords: ['API', 'HTTP', '请求', '测试', '接口'],
  icon: 'Send',
  requiresApi: true,
}
