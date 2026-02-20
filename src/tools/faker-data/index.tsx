import { useState } from 'react'
import { ToolLayout } from '@/components/tool/ToolLayout'
import { meta } from './meta'
import { generateFakeData } from '@it-toolbox/core'

const DATA_TYPES = [
  { id: 'name', label: '姓名' },
  { id: 'firstName', label: '名' },
  { id: 'lastName', label: '姓' },
  { id: 'email', label: '邮箱' },
  { id: 'phone', label: '电话' },
  { id: 'address', label: '地址' },
  { id: 'city', label: '城市' },
  { id: 'country', label: '国家' },
  { id: 'company', label: '公司' },
  { id: 'jobTitle', label: '职位' },
  { id: 'username', label: '用户名' },
  { id: 'password', label: '密码' },
  { id: 'url', label: 'URL' },
  { id: 'ip', label: 'IP 地址' },
  { id: 'ipv6', label: 'IPv6 地址' },
  { id: 'mac', label: 'MAC 地址' },
  { id: 'uuid', label: 'UUID' },
  { id: 'date', label: '日期' },
  { id: 'number', label: '数字' },
  { id: 'float', label: '浮点数' },
  { id: 'boolean', label: '布尔值' },
  { id: 'word', label: '单词' },
  { id: 'sentence', label: '句子' },
  { id: 'paragraph', label: '段落' },
  { id: 'creditCard', label: '信用卡号' },
  { id: 'currency', label: '货币代码' },
  { id: 'color', label: '颜色' },
  { id: 'emoji', label: 'Emoji' },
  { id: 'avatar', label: '头像 URL' },
  { id: 'imageUrl', label: '图片 URL' },
]

export default function FakerDataTool() {
  const [selectedType, setSelectedType] = useState('name')
  const [count, setCount] = useState(10)
  const [results, setResults] = useState<unknown[]>([])
  const [outputFormat, setOutputFormat] = useState<'list' | 'json'>('list')

  const handleGenerate = () => {
    setResults(generateFakeData(selectedType, count))
  }

  const copyResults = () => {
    const text = outputFormat === 'json' 
      ? JSON.stringify(results, null, 2) 
      : results.join('\n')
    navigator.clipboard.writeText(text)
  }

  return (
    <ToolLayout meta={meta}>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-text-primary mb-2">数据类型</label>
          <div className="flex flex-wrap gap-2">
            {DATA_TYPES.map((type) => (
              <button
                key={type.id}
                onClick={() => setSelectedType(type.id)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  selectedType === type.id
                    ? 'bg-accent-primary text-white'
                    : 'bg-bg-secondary text-text-secondary hover:bg-bg-tertiary'
                }`}
              >
                {type.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <label className="text-sm text-text-secondary">数量:</label>
            <input
              type="number"
              value={count}
              onChange={(e) => setCount(Math.max(1, Math.min(1000, Number(e.target.value))))}
              min={1}
              max={1000}
              className="w-20 px-3 py-1.5 bg-bg-secondary border border-border-primary rounded-lg text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-accent-primary"
            />
          </div>

          <div className="flex items-center gap-2">
            <label className="text-sm text-text-secondary">格式:</label>
            <select
              value={outputFormat}
              onChange={(e) => setOutputFormat(e.target.value as 'list' | 'json')}
              className="px-3 py-1.5 bg-bg-secondary border border-border-primary rounded-lg text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-accent-primary"
            >
              <option value="list">列表</option>
              <option value="json">JSON</option>
            </select>
          </div>

          <button
            onClick={handleGenerate}
            className="px-4 py-2 bg-accent-primary text-white rounded-lg text-sm font-medium hover:bg-accent-secondary transition-colors"
          >
            生成
          </button>
        </div>

        {results.length > 0 && (
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <label className="text-sm font-medium text-text-primary">生成结果</label>
              <button
                onClick={copyResults}
                className="px-3 py-1 bg-bg-secondary text-text-secondary rounded text-sm hover:bg-bg-tertiary transition-colors"
              >
                复制
              </button>
            </div>

            <div className="p-3 bg-bg-secondary border border-border-primary rounded-lg max-h-80 overflow-auto">
              {outputFormat === 'json' ? (
                <pre className="font-mono text-sm text-text-primary whitespace-pre-wrap">
                  {JSON.stringify(results, null, 2)}
                </pre>
              ) : (
                <div className="space-y-1">
                  {results.map((item, i) => (
                    <div key={i} className="font-mono text-sm text-text-primary">
                      {String(item)}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </ToolLayout>
  )
}
