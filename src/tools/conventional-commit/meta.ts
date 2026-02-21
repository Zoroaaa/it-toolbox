import type { ToolMeta } from '@toolbox/types/tool'

export const meta: ToolMeta = {
  id: 'conventional-commit',
  name: '提交信息生成',
  nameEn: 'Conventional Commit',
  description: 'Conventional Commits 格式提交信息生成器，选择类型/scope/描述',
  category: 'devops',
  tags: ['git', 'commit', 'conventional', 'message', 'changelog'],
  keywords: ['提交', 'commit message', 'git提交'],
  icon: 'GitCommit',
  isNew: true,
}
