import type { ToolMeta } from '@toolbox/types/tool'

export const meta: ToolMeta = {
  id: 'changelog-gen',
  name: 'Changelog 生成',
  nameEn: 'Changelog Generator',
  description: 'Git log粘贴→格式化CHANGELOG.md',
  category: 'devops',
  tags: ['changelog', 'git', 'release', 'version', 'history'],
  keywords: ['变更日志', '版本历史', 'Git', '发布'],
  icon: 'FileText',
}
