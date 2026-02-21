import { useState, useCallback } from 'react'
import { GitBranch, Copy, Check, Download, Plus, X } from 'lucide-react'
import { ToolLayout } from '@/components/tool/ToolLayout'
import { useAppStore } from '@/store/app'
import { useClipboard } from '@/hooks/useClipboard'
import { meta } from './meta'

const TEMPLATES: Record<string, { label: string; category: string; content: string }> = {
  node: {
    label: 'Node.js',
    category: '语言',
    content: `# Node.js
node_modules/
npm-debug.log*
yarn-debug.log*
yarn-error.log*
pnpm-debug.log*
lerna-debug.log*
dist/
dist-ssr/
*.local
.env
.env.local
.env.*.local
package-lock.json
yarn.lock
pnpm-lock.yaml`,
  },
  python: {
    label: 'Python',
    category: '语言',
    content: `# Python
__pycache__/
*.py[cod]
*$py.class
*.so
.Python
build/
develop-eggs/
dist/
downloads/
eggs/
.eggs/
lib/
lib64/
parts/
sdist/
var/
wheels/
share/python-wheels/
*.egg-info/
.installed.cfg
*.egg
MANIFEST
.env
.venv
env/
venv/
ENV/
.pytest_cache/
.coverage
htmlcov/
.mypy_cache/
.ruff_cache/`,
  },
  java: {
    label: 'Java',
    category: '语言',
    content: `# Java
*.class
*.log
*.jar
*.war
*.nar
*.ear
*.zip
*.tar.gz
*.rar
hs_err_pid*
replay_pid*
target/
.mtj.tmp/
*.classpath
*.project
.settings/`,
  },
  go: {
    label: 'Go',
    category: '语言',
    content: `# Go
*.exe
*.exe~
*.dll
*.so
*.dylib
*.test
*.out
vendor/
go.sum`,
  },
  rust: {
    label: 'Rust',
    category: '语言',
    content: `# Rust
debug/
target/
Cargo.lock
**/*.rs.bk
*.pdb`,
  },
  react: {
    label: 'React',
    category: '框架',
    content: `# React
node_modules/
.pnp
.pnp.js
coverage/
build/
dist/
.env
.env.local
.env.development.local
.env.test.local
.env.production.local
npm-debug.log*
yarn-debug.log*
yarn-error.log*`,
  },
  nextjs: {
    label: 'Next.js',
    category: '框架',
    content: `# Next.js
node_modules/
.next/
out/
build/
.env
.env.local
.env.development.local
.env.test.local
.env.production.local
npm-debug.log*
yarn-debug.log*
yarn-error.log*
*.tsbuildinfo
next-env.d.ts`,
  },
  vite: {
    label: 'Vite',
    category: '框架',
    content: `# Vite
node_modules/
dist/
dist-ssr/
*.local
.env
.env.local
.env.*.local`,
  },
  django: {
    label: 'Django',
    category: '框架',
    content: `# Django
*.log
*.pot
*.pyc
__pycache__/
local_settings.py
db.sqlite3
db.sqlite3-journal
media/
.env
venv/
.venv/`,
  },
  laravel: {
    label: 'Laravel',
    category: '框架',
    content: `/node_modules
/public/hot
/public/storage
/storage/*.key
/vendor
.env
.env.backup
.env.production
.phpunit.result.cache
Homestead.json
Homestead.yaml
auth.json
npm-debug.log
yarn-error.log`,
  },
  vscode: {
    label: 'VS Code',
    category: 'IDE',
    content: `# VS Code
.vscode/*
!.vscode/settings.json
!.vscode/tasks.json
!.vscode/launch.json
!.vscode/extensions.json
!.vscode/*.code-snippets
.history/
*.vsix`,
  },
  intellij: {
    label: 'IntelliJ',
    category: 'IDE',
    content: `# IntelliJ
.idea/
*.iws
*.iml
*.ipr
out/
!**/src/main/**/out/
!**/src/test/**/out/`,
  },
  macos: {
    label: 'macOS',
    category: 'OS',
    content: `# macOS
.DS_Store
.AppleDouble
.LSOverride
._*
.DocumentRevisions-V100
.fseventsd
.Spotlight-V100
.TemporaryItems
.Trashes
.VolumeIcon.icns
.com.apple.timemachine.donotpresent
.AppleDB
.AppleDesktop
Network Trash Folder
Temporary Items
.apdisk`,
  },
  windows: {
    label: 'Windows',
    category: 'OS',
    content: `# Windows
Thumbs.db
Thumbs.db:encryptable
ehthumbs.db
ehthumbs_vista.db
*.stackdump
[Dd]esktop.ini
$RECYCLE.BIN/
*.cab
*.msi
*.msix
*.msm
*.msp
*.lnk`,
  },
  linux: {
    label: 'Linux',
    category: 'OS',
    content: `# Linux
*~
.fuse_hidden*
.directory
.Trash-*
.nfs*`,
  },
  docker: {
    label: 'Docker',
    category: '工具',
    content: `# Docker
.dockerignore
docker-compose.override.yml
.docker/`,
  },
  terraform: {
    label: 'Terraform',
    category: '工具',
    content: `# Terraform
.terraform/
*.tfstate
*.tfstate.*
crash.log
crash.*.log
*.tfvars
*.tfvars.json
override.tf
override.tf.json
*_override.tf
*_override.tf.json
.terraformrc
terraform.rc`,
  },
}

const CATEGORIES = ['语言', '框架', 'IDE', 'OS', '工具']

export default function GitignoreGenerator() {
  const [selected, setSelected] = useState<string[]>(['node', 'vscode', 'macos'])
  const [search, setSearch] = useState('')
  const { addRecentTool } = useAppStore()
  const { copy, copied } = useClipboard()

  const toggleTemplate = (key: string) => {
    setSelected(prev =>
      prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]
    )
    addRecentTool(meta.id)
  }

  const getOutput = useCallback((): string => {
    if (selected.length === 0) return ''
    return selected
      .map(key => TEMPLATES[key]?.content || '')
      .filter(Boolean)
      .join('\n\n')
  }, [selected])

  const output = getOutput()

  const handleDownload = () => {
    const blob = new Blob([output], { type: 'text/plain' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = '.gitignore'
    a.click()
  }

  const filteredTemplates = Object.entries(TEMPLATES).filter(([, v]) =>
    v.label.toLowerCase().includes(search.toLowerCase())
  )

  const reset = () => setSelected([])

  return (
    <ToolLayout meta={meta} onReset={reset} outputValue={output}>
      <div className="grid grid-cols-2 gap-4 h-[calc(100vh-12rem)]">
        {/* Left: Selector */}
        <div className="flex flex-col gap-3 min-h-0">
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="搜索模板..."
              className="flex-1 px-3 py-2 rounded-lg bg-bg-surface border border-border-base text-sm text-text-primary focus:outline-none focus:border-accent"
            />
            {selected.length > 0 && (
              <span className="text-xs text-text-muted">{selected.length} 已选</span>
            )}
          </div>

          {/* Selected tags */}
          {selected.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {selected.map(key => (
                <span key={key} className="flex items-center gap-1 px-2 py-1 rounded-md bg-accent/10 border border-accent/20 text-xs text-accent">
                  {TEMPLATES[key]?.label}
                  <button onClick={() => toggleTemplate(key)}>
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          )}

          {/* Template list by category */}
          <div className="flex-1 overflow-y-auto space-y-3">
            {CATEGORIES.map(cat => {
              const items = filteredTemplates.filter(([, v]) => v.category === cat)
              if (items.length === 0) return null
              return (
                <div key={cat}>
                  <p className="text-xs font-medium text-text-muted uppercase tracking-wider mb-2">{cat}</p>
                  <div className="flex flex-wrap gap-2">
                    {items.map(([key, tpl]) => (
                      <button
                        key={key}
                        onClick={() => toggleTemplate(key)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-colors ${
                          selected.includes(key)
                            ? 'bg-accent/10 border border-accent/30 text-accent'
                            : 'bg-bg-surface border border-border-base text-text-secondary hover:text-text-primary'
                        }`}
                      >
                        {selected.includes(key)
                          ? <X className="w-3 h-3" />
                          : <Plus className="w-3 h-3" />
                        }
                        {tpl.label}
                      </button>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Right: Output */}
        <div className="flex flex-col gap-2 min-h-0">
          <div className="flex items-center justify-between">
            <label className="text-xs font-medium text-text-muted uppercase tracking-wider">.gitignore 输出</label>
            <div className="flex gap-1">
              {output && (
                <>
                  <button
                    onClick={() => copy(output)}
                    className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-bg-raised hover:bg-bg-surface text-xs text-text-secondary transition-colors"
                  >
                    {copied ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3" />}
                    复制
                  </button>
                  <button
                    onClick={handleDownload}
                    className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-bg-raised hover:bg-bg-surface text-xs text-text-secondary transition-colors"
                  >
                    <Download className="w-3 h-3" />
                    下载
                  </button>
                </>
              )}
            </div>
          </div>
          <textarea
            value={output}
            readOnly
            placeholder="选择模板后自动生成 .gitignore..."
            className="flex-1 px-3 py-2.5 rounded-lg bg-bg-surface border border-border-base text-sm font-mono text-text-secondary resize-none"
          />
          {output && (
            <p className="text-xs text-text-muted">{output.split('\n').length} 行 · {new Blob([output]).size} B</p>
          )}
        </div>
      </div>
    </ToolLayout>
  )
}
