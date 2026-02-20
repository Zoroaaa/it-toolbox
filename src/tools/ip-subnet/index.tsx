import { useState } from 'react'
import { ToolLayout } from '@/components/tool/ToolLayout'
import { meta } from './meta'
import { calculateSubnet, type SubnetResult } from '@it-toolbox/core'

export default function IpSubnetTool() {
  const [ip, setIp] = useState('192.168.1.100')
  const [cidr, setCidr] = useState(24)
  const [result, setResult] = useState<SubnetResult | null>(null)
  const [error, setError] = useState('')

  const handleCalculate = () => {
    setError('')
    const calcResult = calculateSubnet(ip, cidr)
    if (calcResult.ok) {
      setResult(calcResult.value)
    } else {
      setError(calcResult.error)
      setResult(null)
    }
  }

  return (
    <ToolLayout meta={meta}>
      <div className="space-y-4">
        <div className="flex gap-4 flex-wrap">
          <div className="flex-1 min-w-48">
            <label className="block text-sm text-text-secondary mb-1">IP 地址</label>
            <input
              type="text"
              value={ip}
              onChange={(e) => setIp(e.target.value)}
              placeholder="192.168.1.100"
              className="w-full px-3 py-2 bg-bg-secondary border border-border-primary rounded-lg text-text-primary placeholder-text-tertiary focus:outline-none focus:ring-2 focus:ring-accent-primary font-mono text-sm"
            />
          </div>

          <div className="w-32">
            <label className="block text-sm text-text-secondary mb-1">CIDR</label>
            <input
              type="number"
              value={cidr}
              onChange={(e) => setCidr(Number(e.target.value))}
              min={0}
              max={32}
              className="w-full px-3 py-2 bg-bg-secondary border border-border-primary rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-accent-primary font-mono text-sm"
            />
          </div>

          <div className="flex items-end">
            <button
              onClick={handleCalculate}
              className="px-4 py-2 bg-accent-primary text-white rounded-lg text-sm font-medium hover:bg-accent-secondary transition-colors"
            >
              计算
            </button>
          </div>
        </div>

        {error && (
          <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
            {error}
          </div>
        )}

        {result && (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div className="p-4 bg-bg-secondary border border-border-primary rounded-lg">
              <div className="text-sm text-text-secondary mb-1">网络地址</div>
              <div className="font-mono text-text-primary">{result.networkAddress}</div>
            </div>

            <div className="p-4 bg-bg-secondary border border-border-primary rounded-lg">
              <div className="text-sm text-text-secondary mb-1">广播地址</div>
              <div className="font-mono text-text-primary">{result.broadcastAddress}</div>
            </div>

            <div className="p-4 bg-bg-secondary border border-border-primary rounded-lg">
              <div className="text-sm text-text-secondary mb-1">子网掩码</div>
              <div className="font-mono text-text-primary">{result.subnetMask}</div>
            </div>

            <div className="p-4 bg-bg-secondary border border-border-primary rounded-lg">
              <div className="text-sm text-text-secondary mb-1">第一个可用主机</div>
              <div className="font-mono text-text-primary">{result.firstHost}</div>
            </div>

            <div className="p-4 bg-bg-secondary border border-border-primary rounded-lg">
              <div className="text-sm text-text-secondary mb-1">最后一个可用主机</div>
              <div className="font-mono text-text-primary">{result.lastHost}</div>
            </div>

            <div className="p-4 bg-bg-secondary border border-border-primary rounded-lg">
              <div className="text-sm text-text-secondary mb-1">可用主机数</div>
              <div className="font-mono text-text-primary">{result.usableHosts.toLocaleString()}</div>
            </div>

            <div className="p-4 bg-bg-secondary border border-border-primary rounded-lg">
              <div className="text-sm text-text-secondary mb-1">总主机数</div>
              <div className="font-mono text-text-primary">{result.totalHosts.toLocaleString()}</div>
            </div>

            <div className="p-4 bg-bg-secondary border border-border-primary rounded-lg">
              <div className="text-sm text-text-secondary mb-1">CIDR 表示</div>
              <div className="font-mono text-text-primary">/{result.cidr}</div>
            </div>
          </div>
        )}

        <div className="p-4 bg-bg-secondary border border-border-primary rounded-lg">
          <div className="text-sm text-text-secondary mb-2">常用 CIDR 参考</div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
            <div className="flex justify-between">
              <span className="text-text-tertiary">/24</span>
              <span className="text-text-primary">256 个地址</span>
            </div>
            <div className="flex justify-between">
              <span className="text-text-tertiary">/25</span>
              <span className="text-text-primary">128 个地址</span>
            </div>
            <div className="flex justify-between">
              <span className="text-text-tertiary">/26</span>
              <span className="text-text-primary">64 个地址</span>
            </div>
            <div className="flex justify-between">
              <span className="text-text-tertiary">/27</span>
              <span className="text-text-primary">32 个地址</span>
            </div>
            <div className="flex justify-between">
              <span className="text-text-tertiary">/28</span>
              <span className="text-text-primary">16 个地址</span>
            </div>
            <div className="flex justify-between">
              <span className="text-text-tertiary">/29</span>
              <span className="text-text-primary">8 个地址</span>
            </div>
            <div className="flex justify-between">
              <span className="text-text-tertiary">/30</span>
              <span className="text-text-primary">4 个地址</span>
            </div>
            <div className="flex justify-between">
              <span className="text-text-tertiary">/16</span>
              <span className="text-text-primary">65536 个地址</span>
            </div>
          </div>
        </div>
      </div>
    </ToolLayout>
  )
}
