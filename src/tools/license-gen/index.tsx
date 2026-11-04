import { useState } from 'react'
import { Scale, Copy, Check } from 'lucide-react'
import { ToolLayout } from '@/components/tool/ToolLayout'
import { useAppStore } from '@/store/app'
import { useClipboard } from '@/hooks/useClipboard'
import { meta } from './meta'

interface LicenseTemplate {
  name: string
  spdx: string
  description: string
  permissions: string[]
  conditions: string[]
  limitations: string[]
  template: (year: string, author: string) => string
}

const LICENSES: Record<string, LicenseTemplate> = {
  MIT: {
    name: 'MIT License',
    spdx: 'MIT',
    description: '最简洁宽松的协议，允许任何使用方式，只需保留版权声明',
    permissions: ['商业使用', '修改', '分发', '私人使用'],
    conditions: ['保留版权声明'],
    limitations: ['无担保', '无责任'],
    template: (year, author) => `MIT License

Copyright (c) ${year} ${author}

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.`,
  },
  Apache2: {
    name: 'Apache License 2.0',
    spdx: 'Apache-2.0',
    description: '宽松协议，允许商业使用，要求保留声明并说明修改，提供专利授权',
    permissions: ['商业使用', '修改', '分发', '私人使用', '专利使用'],
    conditions: ['保留版权声明', '说明修改内容', '保留 NOTICE 文件'],
    limitations: ['无担保', '无责任', '不授予商标权'],
    template: (year, author) => `                                 Apache License
                           Version 2.0, January 2004
                        http://www.apache.org/licenses/

   Copyright ${year} ${author}

   Licensed under the Apache License, Version 2.0 (the "License");
   you may not use this file except in compliance with the License.
   You may obtain a copy of the License at

       http://www.apache.org/licenses/LICENSE-2.0

   Unless required by applicable law or agreed to in writing, software
   distributed under the License is distributed on an "AS IS" BASIS,
   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   See the License for the specific language governing permissions and
   limitations under the License.`,
  },
  GPL3: {
    name: 'GNU GPL v3',
    spdx: 'GPL-3.0',
    description: 'Copyleft 协议，衍生作品必须使用相同协议开源，保护软件自由',
    permissions: ['商业使用', '修改', '分发', '私人使用', '专利使用'],
    conditions: ['开源衍生品', '保留版权声明', '说明修改内容', '使用相同协议'],
    limitations: ['无担保', '无责任'],
    template: (year, author) => `Copyright (C) ${year} ${author}

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License
along with this program.  If not, see <https://www.gnu.org/licenses/>.`,
  },
  BSD2: {
    name: 'BSD 2-Clause',
    spdx: 'BSD-2-Clause',
    description: '简单的宽松协议，要求保留版权声明和免责声明',
    permissions: ['商业使用', '修改', '分发', '私人使用'],
    conditions: ['保留版权声明'],
    limitations: ['无担保', '无责任'],
    template: (year, author) => `BSD 2-Clause License

Copyright (c) ${year}, ${author}

Redistribution and use in source and binary forms, with or without
modification, are permitted provided that the following conditions are met:

1. Redistributions of source code must retain the above copyright notice, this
   list of conditions and the following disclaimer.

2. Redistributions in binary form must reproduce the above copyright notice,
   this list of conditions and the following disclaimer in the documentation
   and/or other materials provided with the distribution.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE
FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL
DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR
SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER
CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY,
OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.`,
  },
  ISC: {
    name: 'ISC License',
    spdx: 'ISC',
    description: '功能上等同于 MIT，更简洁的写法，npm 默认推荐',
    permissions: ['商业使用', '修改', '分发', '私人使用'],
    conditions: ['保留版权声明'],
    limitations: ['无担保', '无责任'],
    template: (year, author) => `ISC License

Copyright (c) ${year} ${author}

Permission to use, copy, modify, and/or distribute this software for any
purpose with or without fee is hereby granted, provided that the above
copyright notice and this permission notice appear in all copies.

THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY
AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM
LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR
OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR
PERFORMANCE OF THIS SOFTWARE.`,
  },
  AGPL3: {
    name: 'GNU AGPL v3',
    spdx: 'AGPL-3.0',
    description: '类似 GPL3，网络服务也视为分发，强制开源网络应用',
    permissions: ['商业使用', '修改', '分发', '私人使用', '专利使用'],
    conditions: ['开源衍生品', '网络使用也须开源', '使用相同协议'],
    limitations: ['无担保', '无责任'],
    template: (year, author) => `Copyright (C) ${year} ${author}

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU Affero General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU Affero General Public License for more details.

You should have received a copy of the GNU Affero General Public License
along with this program.  If not, see <https://www.gnu.org/licenses/>.`,
  },
  Unlicense: {
    name: 'The Unlicense',
    spdx: 'Unlicense',
    description: '放弃所有版权，将作品贡献到公共域，任何人可以随意使用',
    permissions: ['商业使用', '修改', '分发', '私人使用'],
    conditions: [],
    limitations: ['无担保', '无责任'],
    template: () => `This is free and unencumbered software released into the public domain.

Anyone is free to copy, modify, publish, use, compile, sell, or
distribute this software, either in source code form or as a compiled
binary, for any purpose, commercial or non-commercial, and by any means.

In jurisdictions that recognize copyright laws, the author or authors
of this software dedicate any and all copyright interest in the
software to the public domain. We make this dedication for the benefit
of the public at large and to the detriment of our heirs and
successors. We intend this dedication to be an overt act of
relinquishment in perpetuity of all present and future rights to this
software under copyright law.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
IN NO EVENT SHALL THE AUTHORS BE LIABLE FOR ANY CLAIM, DAMAGES OR
OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE,
ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR
OTHER DEALINGS IN THE SOFTWARE.

For more information, please refer to <https://unlicense.org>`,
  },
}

const BADGE_COLORS: Record<string, string> = {
  '商业使用': 'bg-green-500/20 text-green-400 border-green-500/30',
  '修改': 'bg-green-500/20 text-green-400 border-green-500/30',
  '分发': 'bg-green-500/20 text-green-400 border-green-500/30',
  '私人使用': 'bg-green-500/20 text-green-400 border-green-500/30',
  '专利使用': 'bg-green-500/20 text-green-400 border-green-500/30',
  '保留版权声明': 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  '说明修改内容': 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  '保留 NOTICE 文件': 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  '开源衍生品': 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  '使用相同协议': 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  '网络使用也须开源': 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  '无担保': 'bg-red-500/20 text-red-400 border-red-500/30',
  '无责任': 'bg-red-500/20 text-red-400 border-red-500/30',
  '不授予商标权': 'bg-red-500/20 text-red-400 border-red-500/30',
}

export default function LicenseGenerator() {
  const [selectedLicense, setSelectedLicense] = useState('MIT')
  const [author, setAuthor] = useState('')
  const [year, setYear] = useState(new Date().getFullYear().toString())
  const addRecentTool = useAppStore((s) => s.addRecentTool)
  const { copy, copied } = useClipboard()

  const license = LICENSES[selectedLicense]
  const output = license.template(year, author || 'Your Name')

  const handleDownload = () => {
    const blob = new Blob([output], { type: 'text/plain' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = 'LICENSE'
    a.click()
    addRecentTool(meta.id)
  }

  const reset = () => {
    setAuthor('')
    setYear(new Date().getFullYear().toString())
    setSelectedLicense('MIT')
  }

  return (
    <ToolLayout meta={meta} onReset={reset} outputValue={output}>
      <div className="grid grid-cols-2 gap-4 h-[calc(100vh-12rem)]">
        {/* Left: Config */}
        <div className="flex flex-col gap-4 min-h-0 overflow-y-auto">
          {/* License selector */}
          <div>
            <label className="text-xs font-medium text-text-muted uppercase tracking-wider mb-2 block">选择协议</label>
            <div className="space-y-2">
              {Object.entries(LICENSES).map(([key, tpl]) => (
                <button
                  key={key}
                  onClick={() => { setSelectedLicense(key); addRecentTool(meta.id) }}
                  className={`w-full text-left p-3 rounded-lg border transition-colors ${
                    selectedLicense === key
                      ? 'border-accent/30 bg-accent/5'
                      : 'border-border-base bg-bg-surface hover:bg-bg-raised'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className={`text-sm font-medium ${selectedLicense === key ? 'text-accent' : 'text-text-primary'}`}>
                      {tpl.name}
                    </span>
                    <span className="text-xs text-text-muted font-mono">{tpl.spdx}</span>
                  </div>
                  <p className="text-xs text-text-muted mt-1 leading-relaxed">{tpl.description}</p>
                </button>
              ))}
            </div>
          </div>

          {/* License details */}
          {license && (
            <div className="space-y-3">
              {[
                { label: '✅ 允许', items: license.permissions },
                { label: '📋 条件', items: license.conditions },
                { label: '❌ 限制', items: license.limitations },
              ].map(({ label, items }) => items.length > 0 && (
                <div key={label}>
                  <p className="text-xs text-text-muted mb-1.5">{label}</p>
                  <div className="flex flex-wrap gap-1.5">
                    {items.map(item => (
                      <span key={item} className={`text-xs px-2 py-0.5 rounded border ${BADGE_COLORS[item] || 'bg-bg-raised text-text-muted border-border-base'}`}>
                        {item}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right: Output */}
        <div className="flex flex-col gap-3 min-h-0">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-text-muted uppercase tracking-wider mb-1 block">版权所有人</label>
              <input
                type="text"
                value={author}
                onChange={e => setAuthor(e.target.value)}
                placeholder="Your Name"
                className="w-full px-3 py-2 rounded-lg bg-bg-surface border border-border-base text-sm text-text-primary focus:outline-none focus:border-accent"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-text-muted uppercase tracking-wider mb-1 block">年份</label>
              <input
                type="text"
                value={year}
                onChange={e => setYear(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-bg-surface border border-border-base text-sm font-mono text-text-primary focus:outline-none focus:border-accent"
              />
            </div>
          </div>

          <div className="flex items-center justify-between">
            <label className="text-xs font-medium text-text-muted uppercase tracking-wider">LICENSE 文件内容</label>
            <div className="flex gap-1">
              <button
                onClick={() => { copy(output); addRecentTool(meta.id) }}
                className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-bg-raised hover:bg-bg-surface text-xs text-text-secondary transition-colors"
              >
                {copied ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3" />}
                复制
              </button>
              <button
                onClick={handleDownload}
                className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-accent text-bg-base text-xs font-medium hover:bg-accent/90 transition-colors"
              >
                <Scale className="w-3 h-3" />
                下载 LICENSE
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
