import type { ToolMeta } from '@toolbox/types/tool'

export const meta: ToolMeta = {
  id: 'ai-commit-msg',
  name: 'AI生成提交信息',
  nameEn: 'AI Commit Message Generator',
  description: '粘贴diff内容，AI生成Conventional Commit消息',
  category: 'ai',
  tags: ['ai', 'git', 'commit', 'conventional', 'message'],
  keywords: ['AI', 'Git', '提交', 'Commit', 'Conventional'],
  icon: 'GitCommit',
  requiresApi: true,
}
