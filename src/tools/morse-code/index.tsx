import { useState, useCallback, useRef } from 'react'
import { ArrowRightLeft, Play, Pause } from 'lucide-react'
import { ToolLayout } from '@/components/tool/ToolLayout'
import { textToMorse, morseToText } from '@core/index'
import { useAppStore } from '@/store/app'
import { meta } from './meta'

type Mode = 'encode' | 'decode'

export default function MorseCode() {
  const [input, setInput] = useState('')
  const [output, setOutput] = useState('')
  const [error, setError] = useState('')
  const [mode, setMode] = useState<Mode>('encode')
  const [isPlaying, setIsPlaying] = useState(false)
  const [speed, setSpeed] = useState(150)
  const audioContextRef = useRef<AudioContext | null>(null)
  const { addHistory, addRecentTool } = useAppStore()

  const runTransform = useCallback(() => {
    if (!input.trim()) return
    addRecentTool(meta.id)

    const result = mode === 'encode' ? textToMorse(input) : morseToText(input)

    if (result.ok) {
      setOutput(result.value)
      setError('')
      addHistory(meta.id, input)
    } else {
      setError(result.error)
      setOutput('')
    }
  }, [input, mode, addHistory, addRecentTool])

  const playMorse = useCallback(async () => {
    if (!output || mode !== 'encode') return

    if (isPlaying) {
      audioContextRef.current?.close()
      audioContextRef.current = null
      setIsPlaying(false)
      return
    }

    const ctx = new AudioContext()
    audioContextRef.current = ctx
    setIsPlaying(true)

    const dotDuration = speed
    const dashDuration = speed * 3
    const symbolGap = speed
    const letterGap = speed * 3
    const wordGap = speed * 7

    let time = ctx.currentTime

    for (const char of output) {
      if (!isPlaying) break

      const oscillator = ctx.createOscillator()
      const gainNode = ctx.createGain()

      oscillator.connect(gainNode)
      gainNode.connect(ctx.destination)

      oscillator.frequency.value = 600
      oscillator.type = 'sine'

      if (char === '.') {
        gainNode.gain.setValueAtTime(0.5, time)
        gainNode.gain.setValueAtTime(0, time + dotDuration / 1000)
        oscillator.start(time)
        oscillator.stop(time + dotDuration / 1000)
        time += (dotDuration + symbolGap) / 1000
      } else if (char === '-') {
        gainNode.gain.setValueAtTime(0.5, time)
        gainNode.gain.setValueAtTime(0, time + dashDuration / 1000)
        oscillator.start(time)
        oscillator.stop(time + dashDuration / 1000)
        time += (dashDuration + symbolGap) / 1000
      } else if (char === ' ') {
        time += letterGap / 1000
      } else if (char === '/') {
        time += wordGap / 1000
      }
    }

    setTimeout(() => {
      setIsPlaying(false)
    }, time * 1000 - ctx.currentTime * 1000)
  }, [output, mode, speed, isPlaying])

  const reset = () => {
    setInput('')
    setOutput('')
    setError('')
  }

  return (
    <ToolLayout meta={meta} onReset={reset} outputValue={output}>
      <div className="flex items-center gap-2 mb-4 flex-wrap">
        <button onClick={runTransform} className="btn-primary">
          <ArrowRightLeft className="w-4 h-4" />
          {mode === 'encode' ? '编码' : '解码'}
        </button>

        <div className="flex items-center gap-1 bg-bg-raised rounded-lg p-1">
          {(['encode', 'decode'] as Mode[]).map(m => (
            <button
              key={m}
              onClick={() => { setMode(m); setOutput(''); setError('') }}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors
                ${mode === m ? 'bg-accent text-bg-base' : 'text-text-muted hover:text-text-primary'}`}
            >
              {m === 'encode' ? '编码' : '解码'}
            </button>
          ))}
        </div>

        {mode === 'encode' && output && (
          <>
            <button onClick={playMorse} className="btn-ghost">
              {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              {isPlaying ? '停止' : '播放'}
            </button>
            <div className="flex items-center gap-2 ml-2">
              <span className="text-xs text-text-muted">速度:</span>
              <input
                type="range"
                min="50"
                max="300"
                value={speed}
                onChange={e => setSpeed(parseInt(e.target.value))}
                className="w-24"
              />
              <span className="text-xs text-text-muted">{speed}ms</span>
            </div>
          </>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 h-[calc(100vh-16rem)]">
        <div className="flex flex-col gap-2">
          <label className="text-xs font-medium text-text-muted uppercase tracking-wider">输入</label>
          <textarea
            className="tool-input flex-1 font-mono text-xs leading-relaxed"
            value={input}
            onChange={e => { setInput(e.target.value); setError('') }}
            placeholder={mode === 'encode' ? '输入文本 (支持英文字母和数字)...' : '输入摩斯电码 (. 和 -)...'}
            spellCheck={false}
          />
          <div className="text-xs text-text-muted">{input.length} 字符</div>
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-xs font-medium text-text-muted uppercase tracking-wider">输出</label>
          {error ? (
            <div className="flex-1 rounded-lg bg-rose-500/10 border border-rose-500/30 p-4">
              <p className="text-xs text-rose-400/80">{error}</p>
            </div>
          ) : (
            <textarea
              className="tool-input flex-1 font-mono text-xs leading-relaxed"
              value={output}
              readOnly
              placeholder="结果将在这里显示..."
              spellCheck={false}
            />
          )}
          {output && !error && <div className="text-xs text-text-muted">{output.length} 字符</div>}
        </div>
      </div>
    </ToolLayout>
  )
}
