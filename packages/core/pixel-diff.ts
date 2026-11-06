/**
 * 逐像素差异比对。
 *
 * 入参是 canvas `getImageData()` 得到的 RGBA 数组，两者尺寸必须一致。
 * 抽出成纯函数是为了能在 Node/happy-dom 里直接测，不依赖 Canvas。
 */

export interface PixelDiffResult {
  totalPixels: number
  diffPixels: number
  /** 差异像素 / 总像素，0~1 */
  ratio: number
  /** 长度 = totalPixels，1 表示该像素有差异 */
  mask: Uint8Array
}

/**
 * @param threshold 单通道允许的最大差值（0 表示完全相同）。JPEG 等有损格式
 *                  建议 8~16，否则压缩噪点会让整张图都被标成差异。
 */
export function diffPixels(
  a: Uint8ClampedArray,
  b: Uint8ClampedArray,
  width: number,
  height: number,
  threshold = 0,
): PixelDiffResult {
  const totalPixels = width * height
  const mask = new Uint8Array(totalPixels)
  let diffPixels = 0

  for (let i = 0; i < totalPixels; i++) {
    const offset = i * 4
    const aAlpha = a[offset + 3]
    const bAlpha = b[offset + 3]

    // 两边都全透明时，RGB 是任意值（导出器通常写 0），不应视为差异
    let differs: boolean
    if (aAlpha === 0 && bAlpha === 0) {
      differs = false
    } else {
      differs =
        Math.abs(a[offset] - b[offset]) > threshold ||
        Math.abs(a[offset + 1] - b[offset + 1]) > threshold ||
        Math.abs(a[offset + 2] - b[offset + 2]) > threshold ||
        Math.abs(aAlpha - bAlpha) > threshold
    }

    if (differs) {
      mask[i] = 1
      diffPixels++
    }
  }

  return {
    totalPixels,
    diffPixels,
    ratio: totalPixels === 0 ? 0 : diffPixels / totalPixels,
    mask,
  }
}
