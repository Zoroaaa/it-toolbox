import type { ToolMeta } from '@toolbox/types/tool'

export const meta: ToolMeta = {
  id: 'gitignore-gen',
  name: '.gitignore 生成',
  nameEn: '.gitignore Generator',
  description: '选择语言/框架/IDE，生成最佳实践 .gitignore 文件',
  category: 'devops',
  tags: ['gitignore', 'git', 'generate', 'template', 'node', 'python'],
  keywords: ['忽略文件', 'git', '模板'],
  icon: 'GitBranch',
  isNew: true,
}
