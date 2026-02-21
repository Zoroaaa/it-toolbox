import type { ToolMeta } from '@toolbox/types/tool'

export const meta: ToolMeta = {
  id: 'openapi-viewer',
  name: 'OpenAPI 查看器',
  nameEn: 'OpenAPI Viewer',
  description: '上传 swagger.json/yaml，可视化展示 API 文档，支持 OpenAPI 3.x',
  category: 'devops',
  tags: ['openapi', 'swagger', 'api', 'docs', 'rest', 'yaml', 'json'],
  keywords: ['API文档', 'swagger', '接口文档'],
  icon: 'BookOpen',
  isNew: true,
}
