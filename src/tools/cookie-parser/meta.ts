import type { ToolMeta } from '@toolbox/types/tool'

export const meta: ToolMeta = {
  id: 'cookie-parser',
  name: 'Cookie 解析',
  nameEn: 'Cookie Parser',
  description: '解析 Cookie / Set-Cookie，查看 Domain、Path、Expires、SameSite、HttpOnly、Secure，编辑后生成请求头',
  category: 'network',
  tags: ['cookie', 'set-cookie', 'header', 'http', 'session'],
  keywords: ['Cookie 解析', 'Set-Cookie', '会话', '请求头', 'SameSite', 'HttpOnly'],
  icon: 'Cookie',
}
