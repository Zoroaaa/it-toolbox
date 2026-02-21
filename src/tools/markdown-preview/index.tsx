import { useState, useCallback, useEffect } from 'react'
import { Eye, Download } from 'lucide-react'
import { ToolLayout } from '@/components/tool/ToolLayout'
import { useAppStore } from '@/store/app'
import { meta } from './meta'

export default function MarkdownPreview() {
  const [input, setInput] = useState(`# Markdown 预览

这是一个 **Markdown** 预览工具。

## 功能特性

- 支持 GFM 语法
- 代码高亮
- 表格支持

### 代码示例

\`\`\`javascript
function hello() {
  console.log('Hello, World!')
}
\`\`\`

### 表格示例

| 功能 | 状态 |
|------|------|
| 基础语法 | ✅ |
| GFM | ✅ |
| 代码高亮 | ✅ |

> 这是一段引用文本

[访问 GitHub](https://github.com)
`)
  const [html, setHtml] = useState('')
  const { addHistory, addRecentTool } = useAppStore()

  const renderMarkdown = useCallback(async (text: string) => {
    try {
      const { marked } = await import('marked')
      const { markedHighlight } = await import('marked-highlight')
      const hljs = await import('highlight.js')
      marked.use(markedHighlight({
        langPrefix: 'hljs language-',
        highlight(code, lang) {
          const language = hljs.default.getLanguage(lang) ? lang : 'plaintext'
          return hljs.default.highlight(code, { language }).value
        },
      }))
      marked.setOptions({ gfm: true, breaks: true })
      const result = await marked(text)
      setHtml(result)
    } catch {
      setHtml('<p>渲染失败</p>')
    }
  }, [])

  useEffect(() => {
    renderMarkdown(input)
  }, [input, renderMarkdown])

  const downloadHtml = () => {
    const fullHtml = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Markdown Export</title>
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.10.0/styles/github.min.css">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 800px; margin: 0 auto; padding: 2rem; line-height: 1.6; }
    pre { background: #f5f5f5; padding: 1rem; border-radius: 8px; overflow-x: auto; }
    code { background: #f5f5f5; padding: 0.2rem 0.4rem; border-radius: 4px; }
    blockquote { border-left: 4px solid #ddd; margin: 0; padding-left: 1rem; color: #666; }
    table { border-collapse: collapse; width: 100%; }
    th, td { border: 1px solid #ddd; padding: 0.5rem; text-align: left; }
  </style>
</head>
<body>
${html}
</body>
</html>`
    const blob = new Blob([fullHtml], { type: 'text/html' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'markdown-export.html'
    a.click()
    URL.revokeObjectURL(url)
    addRecentTool(meta.id)
  }

  const reset = () => {
    setInput('')
    setHtml('')
  }

  return (
    <ToolLayout meta={meta} onReset={reset} outputValue={html}>
      <div className="flex items-center gap-2 mb-4">
        <button onClick={() => { addRecentTool(meta.id); addHistory(meta.id, input) }} className="btn-primary">
          <Eye className="w-4 h-4" />
          预览
        </button>
        <button onClick={downloadHtml} className="btn-ghost">
          <Download className="w-4 h-4" />
          导出 HTML
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 h-[calc(100vh-16rem)]">
        <div className="flex flex-col gap-2">
          <label className="text-xs font-medium text-text-muted uppercase tracking-wider">Markdown 输入</label>
          <textarea
            className="tool-input flex-1 font-mono text-xs leading-relaxed"
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="输入 Markdown 文本..."
            spellCheck={false}
          />
          <div className="text-xs text-text-muted">{input.length} 字符</div>
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-xs font-medium text-text-muted uppercase tracking-wider">预览</label>
          <div
            className="flex-1 overflow-y-auto rounded-lg bg-bg-surface border border-border-base p-4 prose prose-invert prose-sm max-w-none
              [&_h1]:text-2xl [&_h1]:font-bold [&_h1]:mb-4 [&_h1]:text-text-primary
              [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:mb-3 [&_h2]:mt-6 [&_h2]:text-text-primary
              [&_h3]:text-lg [&_h3]:font-medium [&_h3]:mb-2 [&_h3]:mt-4 [&_h3]:text-text-primary
              [&_p]:mb-4 [&_p]:text-text-secondary
              [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:mb-4
              [&_ol]:list-decimal [&_ol]:pl-6 [&_ol]:mb-4
              [&_li]:mb-1 [&_li]:text-text-secondary
              [&_code]:bg-bg-raised [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded [&_code]:text-accent [&_code]:font-mono
              [&_pre]:bg-bg-raised [&_pre]:p-4 [&_pre]:rounded-lg [&_pre]:overflow-x-auto [&_pre]:mb-4
              [&_pre_code]:bg-transparent [&_pre_code]:p-0
              [&_blockquote]:border-l-4 [&_blockquote]:border-accent [&_blockquote]:pl-4 [&_blockquote]:italic [&_blockquote]:text-text-muted
              [&_table]:w-full [&_table]:border-collapse [&_table]:mb-4
              [&_th]:border [&_th]:border-border-base [&_th]:px-3 [&_th]:py-2 [&_th]:text-left [&_th]:bg-bg-raised
              [&_td]:border [&_td]:border-border-base [&_td]:px-3 [&_td]:py-2
              [&_a]:text-accent [&_a]:underline
              [&_hr]:border-border-base [&_hr]:my-6
            "
            dangerouslySetInnerHTML={{ __html: html }}
          />
        </div>
      </div>
    </ToolLayout>
  )
}
