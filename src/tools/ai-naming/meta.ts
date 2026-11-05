import type { ToolMeta } from '@toolbox/types/tool'

export const meta: ToolMeta = {
  id: 'ai-naming',
  name: 'AI命名助手',
  nameEn: 'AI Naming Assistant',
  description: '描述功能→推荐变量/函数/类名，支持命名规范选择',
  category: 'ai',
  tags: ['ai', 'naming', 'variable', 'function', 'class', 'code'],
  keywords: ['命名', '变量名', '函数名', '类名', '代码命名'],
  icon: 'CaseSensitive',
  requiresApi: true,
}
