import { testRegex, type RegexResult } from '@core/regex'

interface RegexRequest {
  id: number
  pattern: string
  input: string
  flags: string
}

const ctx = self as unknown as {
  onmessage: ((event: MessageEvent<RegexRequest>) => void) | null
  postMessage: (message: { id: number } & RegexResult) => void
}

ctx.onmessage = (event) => {
  const { id, pattern, input, flags } = event.data
  ctx.postMessage({ id, ...testRegex(pattern, input, flags) })
}
