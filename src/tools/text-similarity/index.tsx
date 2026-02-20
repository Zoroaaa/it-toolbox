import { useState, useMemo } from 'react'
import { ToolLayout } from '@/components/tool/ToolLayout'
import { meta } from './meta'
import { textSimilarity, levenshteinDistance } from '@it-toolbox/core'

export default function TextSimilarity() {
  const [textA, setTextA] = useState('')
  const [textB, setTextB] = useState('')

  const result = useMemo(() => {
    if (!textA || !textB) return null
    const similarity = textSimilarity(textA, textB)
    const distance = levenshteinDistance(textA, textB)
    return { similarity, distance }
  }, [textA, textB])

  const reset = () => {
    setTextA('')
    setTextB('')
  }

  const getSimilarityColor = (sim: number) => {
    if (sim >= 0.8) return 'text-green-400'
    if (sim >= 0.6) return 'text-yellow-400'
    if (sim >= 0.4) return 'text-orange-400'
    return 'text-red-400'
  }

  const getSimilarityLabel = (sim: number) => {
    if (sim >= 0.9) return '非常相似'
    if (sim >= 0.7) return '比较相似'
    if (sim >= 0.5) return '部分相似'
    if (sim >= 0.3) return '不太相似'
    return '差异很大'
  }

  return (
    <ToolLayout meta={meta} onReset={reset}>
      <div className="space-y-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="flex flex-col gap-2">
            <label className="text-xs font-medium text-text-muted uppercase tracking-wider">
              文本 A
            </label>
            <textarea
              className="tool-input flex-1 font-mono text-xs leading-relaxed min-h-[200px]"
              value={textA}
              onChange={(e) => setTextA(e.target.value)}
              placeholder="输入第一段文本..."
              spellCheck={false}
            />
            <div className="text-xs text-text-muted">{textA.length} 字符</div>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-xs font-medium text-text-muted uppercase tracking-wider">
              文本 B
            </label>
            <textarea
              className="tool-input flex-1 font-mono text-xs leading-relaxed min-h-[200px]"
              value={textB}
              onChange={(e) => setTextB(e.target.value)}
              placeholder="输入第二段文本..."
              spellCheck={false}
            />
            <div className="text-xs text-text-muted">{textB.length} 字符</div>
          </div>
        </div>

        {result && (
          <div className="bg-bg-raised border border-border-base rounded-lg p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="text-xs font-medium text-text-muted uppercase tracking-wider mb-2">
                  相似度
                </div>
                <div className={`text-4xl font-bold ${getSimilarityColor(result.similarity)}`}>
                  {(result.similarity * 100).toFixed(1)}%
                </div>
                <div className="text-sm text-text-muted mt-1">
                  {getSimilarityLabel(result.similarity)}
                </div>
              </div>

              <div className="text-center">
                <div className="text-xs font-medium text-text-muted uppercase tracking-wider mb-2">
                  Levenshtein 距离
                </div>
                <div className="text-4xl font-bold text-text-primary">
                  {result.distance}
                </div>
                <div className="text-sm text-text-muted mt-1">
                  编辑操作次数
                </div>
              </div>

              <div className="text-center">
                <div className="text-xs font-medium text-text-muted uppercase tracking-wider mb-2">
                  相似度条
                </div>
                <div className="w-full bg-bg-base rounded-full h-4 mt-4">
                  <div
                    className={`h-4 rounded-full transition-all duration-300 ${
                      result.similarity >= 0.8
                        ? 'bg-green-500'
                        : result.similarity >= 0.6
                        ? 'bg-yellow-500'
                        : result.similarity >= 0.4
                        ? 'bg-orange-500'
                        : 'bg-red-500'
                    }`}
                    style={{ width: `${result.similarity * 100}%` }}
                  />
                </div>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-border-base">
              <div className="text-xs text-text-muted">
                <strong>说明:</strong> Levenshtein 距离表示将一个字符串转换为另一个字符串所需的最少单字符编辑操作次数（插入、删除或替换）。相似度 = 1 - (距离 / 最大长度)。
              </div>
            </div>
          </div>
        )}

        {!result && (
          <div className="bg-bg-raised border border-border-base rounded-lg p-6 text-center text-text-muted">
            请输入两段文本以计算相似度
          </div>
        )}
      </div>
    </ToolLayout>
  )
}
