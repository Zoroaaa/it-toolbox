import { useState, useCallback } from 'react'
import { FileText, Copy, Check, Download, Eye, EyeOff } from 'lucide-react'
import { ToolLayout } from '@/components/tool/ToolLayout'
import { useAppStore } from '@/store/app'
import { useClipboard } from '@/hooks/useClipboard'
import { meta } from './meta'

interface ReadmeConfig {
  projectName: string
  description: string
  language: string
  license: string
  features: string
  install: string
  usage: string
  contributing: boolean
  acknowledgments: string
  sections: {
    badges: boolean
    demo: boolean
    features: boolean
    install: boolean
    usage: boolean
    contributing: boolean
    license: boolean
    acknowledgments: boolean
  }
  badges: string[]
}

const BADGE_OPTIONS = [
  { id: 'npm', label: 'npm version', url: 'https://img.shields.io/npm/v/{name}' },
  { id: 'license', label: 'License', url: 'https://img.shields.io/badge/license-MIT-blue.svg' },
  { id: 'build', label: 'Build Status', url: 'https://img.shields.io/github/actions/workflow/status/{user}/{name}/ci.yml' },
  { id: 'coverage', label: 'Coverage', url: 'https://img.shields.io/codecov/c/github/{user}/{name}' },
  { id: 'stars', label: 'GitHub Stars', url: 'https://img.shields.io/github/stars/{user}/{name}' },
  { id: 'downloads', label: 'Downloads', url: 'https://img.shields.io/npm/dm/{name}' },
  { id: 'ts', label: 'TypeScript', url: 'https://img.shields.io/badge/TypeScript-5.x-blue' },
  { id: 'node', label: 'Node Version', url: 'https://img.shields.io/node/v/{name}' },
]

const defaultConfig: ReadmeConfig = {
  projectName: '',
  description: '',
  language: 'bash',
  license: 'MIT',
  features: '- Feature 1\n- Feature 2\n- Feature 3',
  install: 'npm install {name}',
  usage: '```javascript\nimport { foo } from \'{name}\'\n\nfoo()\n```',
  contributing: true,
  acknowledgments: '',
  sections: {
    badges: true,
    demo: false,
    features: true,
    install: true,
    usage: true,
    contributing: true,
    license: true,
    acknowledgments: false,
  },
  badges: ['license', 'build'],
}

function generateReadme(config: ReadmeConfig): string {
  const name = config.projectName || 'My Project'
  const lines: string[] = []

  // Title
  lines.push(`# ${name}`)
  lines.push('')

  if (config.description) {
    lines.push(`> ${config.description}`)
    lines.push('')
  }

  // Badges
  if (config.sections.badges && config.badges.length > 0) {
    config.badges.forEach(id => {
      const badge = BADGE_OPTIONS.find(b => b.id === id)
      if (badge) {
        const url = badge.url.replace('{name}', name.toLowerCase().replace(/ /g, '-'))
        lines.push(`![${badge.label}](${url})`)
      }
    })
    lines.push('')
  }

  // Features
  if (config.sections.features && config.features) {
    lines.push('## ✨ Features')
    lines.push('')
    lines.push(config.features)
    lines.push('')
  }

  // Installation
  if (config.sections.install && config.install) {
    lines.push('## 📦 Installation')
    lines.push('')
    lines.push('```' + config.language)
    lines.push(config.install.replace('{name}', name.toLowerCase().replace(/ /g, '-')))
    lines.push('```')
    lines.push('')
  }

  // Usage
  if (config.sections.usage && config.usage) {
    lines.push('## 🚀 Usage')
    lines.push('')
    lines.push(config.usage.replace('{name}', name.toLowerCase().replace(/ /g, '-')))
    lines.push('')
  }

  // Contributing
  if (config.sections.contributing) {
    lines.push('## 🤝 Contributing')
    lines.push('')
    lines.push('Contributions are welcome! Please feel free to submit a Pull Request.')
    lines.push('')
    lines.push('1. Fork the project')
    lines.push('2. Create your feature branch (`git checkout -b feature/AmazingFeature`)')
    lines.push('3. Commit your changes (`git commit -m \'Add some AmazingFeature\'`)')
    lines.push('4. Push to the branch (`git push origin feature/AmazingFeature`)')
    lines.push('5. Open a Pull Request')
    lines.push('')
  }

  // Acknowledgments
  if (config.sections.acknowledgments && config.acknowledgments) {
    lines.push('## 🙏 Acknowledgments')
    lines.push('')
    lines.push(config.acknowledgments)
    lines.push('')
  }

  // License
  if (config.sections.license) {
    lines.push('## 📄 License')
    lines.push('')
    lines.push(`This project is licensed under the ${config.license} License — see the [LICENSE](LICENSE) file for details.`)
    lines.push('')
  }

  return lines.join('\n')
}

export default function ReadmeGenerator() {
  const [config, setConfig] = useState<ReadmeConfig>(defaultConfig)
  const [preview, setPreview] = useState(false)
  const { addRecentTool } = useAppStore()
  const { copy, copied } = useClipboard()

  const update = (key: keyof ReadmeConfig, value: unknown) => {
    setConfig(prev => ({ ...prev, [key]: value }))
    addRecentTool(meta.id)
  }

  const updateSection = (key: keyof ReadmeConfig['sections'], value: boolean) => {
    setConfig(prev => ({ ...prev, sections: { ...prev.sections, [key]: value } }))
  }

  const toggleBadge = (id: string) => {
    setConfig(prev => ({
      ...prev,
      badges: prev.badges.includes(id) ? prev.badges.filter(b => b !== id) : [...prev.badges, id],
    }))
  }

  const output = generateReadme(config)

  const handleDownload = () => {
    const blob = new Blob([output], { type: 'text/markdown' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = 'README.md'
    a.click()
  }

  const reset = () => setConfig(defaultConfig)

  return (
    <ToolLayout meta={meta} onReset={reset} outputValue={output}>
      <div className="grid grid-cols-2 gap-4 h-[calc(100vh-12rem)]">
        {/* Left: Form */}
        <div className="flex flex-col gap-4 overflow-y-auto pr-1">
          {/* Basic info */}
          <div className="p-4 bg-bg-surface border border-border-base rounded-xl space-y-3">
            <h3 className="text-xs font-medium text-text-muted uppercase tracking-wider">基本信息</h3>
            <div>
              <label className="text-xs text-text-muted mb-1 block">项目名称</label>
              <input
                type="text"
                value={config.projectName}
                onChange={e => update('projectName', e.target.value)}
                placeholder="My Awesome Project"
                className="w-full px-3 py-2 rounded-lg bg-bg-raised border border-border-base text-sm text-text-primary focus:outline-none focus:border-accent"
              />
            </div>
            <div>
              <label className="text-xs text-text-muted mb-1 block">项目描述</label>
              <textarea
                value={config.description}
                onChange={e => update('description', e.target.value)}
                placeholder="A brief description of your project"
                rows={2}
                className="w-full px-3 py-2 rounded-lg bg-bg-raised border border-border-base text-sm text-text-primary focus:outline-none focus:border-accent resize-none"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-text-muted mb-1 block">License</label>
                <select
                  value={config.license}
                  onChange={e => update('license', e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-bg-raised border border-border-base text-sm text-text-primary focus:outline-none focus:border-accent"
                >
                  {['MIT', 'Apache-2.0', 'GPL-3.0', 'BSD-2-Clause', 'ISC'].map(l => (
                    <option key={l} value={l}>{l}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs text-text-muted mb-1 block">安装命令语言</label>
                <select
                  value={config.language}
                  onChange={e => update('language', e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-bg-raised border border-border-base text-sm text-text-primary focus:outline-none focus:border-accent"
                >
                  {['bash', 'shell', 'powershell', 'sh'].map(l => (
                    <option key={l} value={l}>{l}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Sections */}
          <div className="p-4 bg-bg-surface border border-border-base rounded-xl space-y-2">
            <h3 className="text-xs font-medium text-text-muted uppercase tracking-wider mb-2">章节选择</h3>
            {(Object.keys(config.sections) as (keyof typeof config.sections)[]).map(key => (
              <label key={key} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={config.sections[key]}
                  onChange={e => updateSection(key, e.target.checked)}
                  className="rounded"
                />
                <span className="text-sm text-text-secondary capitalize">{key}</span>
              </label>
            ))}
          </div>

          {/* Badges */}
          {config.sections.badges && (
            <div className="p-4 bg-bg-surface border border-border-base rounded-xl space-y-2">
              <h3 className="text-xs font-medium text-text-muted uppercase tracking-wider mb-2">徽章选择</h3>
              <div className="flex flex-wrap gap-2">
                {BADGE_OPTIONS.map(b => (
                  <button
                    key={b.id}
                    onClick={() => toggleBadge(b.id)}
                    className={`px-2 py-1 rounded text-xs transition-colors ${
                      config.badges.includes(b.id)
                        ? 'bg-accent/10 border border-accent/30 text-accent'
                        : 'bg-bg-raised border border-border-base text-text-secondary'
                    }`}
                  >
                    {b.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Features */}
          {config.sections.features && (
            <div>
              <label className="text-xs text-text-muted mb-1 block">Features 内容</label>
              <textarea
                value={config.features}
                onChange={e => update('features', e.target.value)}
                rows={4}
                className="w-full px-3 py-2 rounded-lg bg-bg-surface border border-border-base text-sm font-mono text-text-primary focus:outline-none focus:border-accent resize-none"
              />
            </div>
          )}

          {/* Install */}
          {config.sections.install && (
            <div>
              <label className="text-xs text-text-muted mb-1 block">安装命令</label>
              <textarea
                value={config.install}
                onChange={e => update('install', e.target.value)}
                rows={2}
                className="w-full px-3 py-2 rounded-lg bg-bg-surface border border-border-base text-sm font-mono text-text-primary focus:outline-none focus:border-accent resize-none"
              />
            </div>
          )}

          {/* Usage */}
          {config.sections.usage && (
            <div>
              <label className="text-xs text-text-muted mb-1 block">使用示例</label>
              <textarea
                value={config.usage}
                onChange={e => update('usage', e.target.value)}
                rows={6}
                className="w-full px-3 py-2 rounded-lg bg-bg-surface border border-border-base text-sm font-mono text-text-primary focus:outline-none focus:border-accent resize-none"
              />
            </div>
          )}
        </div>

        {/* Right: Output */}
        <div className="flex flex-col gap-2 min-h-0">
          <div className="flex items-center justify-between">
            <label className="text-xs font-medium text-text-muted uppercase tracking-wider">README.md 输出</label>
            <div className="flex gap-1">
              <button
                onClick={() => setPreview(!preview)}
                className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-bg-raised hover:bg-bg-surface text-xs text-text-secondary transition-colors"
              >
                {preview ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                {preview ? '源码' : '预览'}
              </button>
              <button
                onClick={() => copy(output)}
                className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-bg-raised hover:bg-bg-surface text-xs text-text-secondary transition-colors"
              >
                {copied ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3" />}
                复制
              </button>
              <button
                onClick={handleDownload}
                className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-accent text-bg-base text-xs font-medium hover:bg-accent/90 transition-colors"
              >
                <FileText className="w-3 h-3" />
                下载
              </button>
            </div>
          </div>
          <textarea
            value={output}
            readOnly
            className="flex-1 px-3 py-2.5 rounded-lg bg-bg-surface border border-border-base text-sm font-mono text-text-secondary resize-none"
          />
        </div>
      </div>
    </ToolLayout>
  )
}
