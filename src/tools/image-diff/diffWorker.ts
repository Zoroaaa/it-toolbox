import { diffPixels } from '@core/pixel-diff'

interface DiffRequest {
  id: number
  a: Blob
  b: Blob
  threshold: number
}

export interface DiffResponse {
  id: number
  ok: boolean
  error?: string
  width: number
  height: number
  widthA: number
  heightA: number
  widthB: number
  heightB: number
  diffPixels: number
  ratio: number
  diffBlob?: Blob
}

const ctx = self as unknown as {
  onmessage: ((event: MessageEvent<DiffRequest>) => void) | null
  postMessage: (message: DiffResponse) => void
}

async function render(
  source: ImageBitmap,
  width: number,
  height: number,
): Promise<Uint8ClampedArray> {
  const canvas = new OffscreenCanvas(width, height)
  const context = canvas.getContext('2d')
  if (!context) throw new Error('当前环境不支持 OffscreenCanvas')
  context.drawImage(source, 0, 0)
  return context.getImageData(0, 0, width, height).data
}

async function buildDiffImage(
  width: number,
  height: number,
  mask: Uint8Array,
): Promise<Blob | undefined> {
  const canvas = new OffscreenCanvas(width, height)
  const context = canvas.getContext('2d')
  if (!context) return undefined

  const imageData = context.createImageData(width, height)
  for (let i = 0; i < mask.length; i++) {
    if (!mask[i]) continue
    const offset = i * 4
    imageData.data[offset] = 255
    imageData.data[offset + 1] = 38
    imageData.data[offset + 2] = 38
    imageData.data[offset + 3] = 255
  }
  context.putImageData(imageData, 0, 0)
  return canvas.convertToBlob({ type: 'image/png' })
}

ctx.onmessage = async (event) => {
  const { id, a, b, threshold } = event.data
  try {
    const [bitmapA, bitmapB] = await Promise.all([createImageBitmap(a), createImageBitmap(b)])
    const sizeA = { width: bitmapA.width, height: bitmapA.height }
    const sizeB = { width: bitmapB.width, height: bitmapB.height }

    // 不同尺寸时以较大画布为基准，左上对齐，空白处保持透明
    const width = Math.max(sizeA.width, sizeB.width)
    const height = Math.max(sizeA.height, sizeB.height)

    const [dataA, dataB] = await Promise.all([
      render(bitmapA, width, height),
      render(bitmapB, width, height),
    ])
    bitmapA.close()
    bitmapB.close()

    const result = diffPixels(dataA, dataB, width, height, threshold)
    const diffBlob = await buildDiffImage(width, height, result.mask)

    ctx.postMessage({
      id,
      ok: true,
      width,
      height,
      widthA: sizeA.width,
      heightA: sizeA.height,
      widthB: sizeB.width,
      heightB: sizeB.height,
      diffPixels: result.diffPixels,
      ratio: result.ratio,
      diffBlob,
    })
  } catch (error) {
    ctx.postMessage({
      id,
      ok: false,
      error: error instanceof Error ? error.message : '比对失败',
      width: 0,
      height: 0,
      widthA: 0,
      heightA: 0,
      widthB: 0,
      heightB: 0,
      diffPixels: 0,
      ratio: 0,
    })
  }
}
