export function applyScaleRepeat(
  src: Uint8ClampedArray<ArrayBuffer>,
  width: number,
  height: number,
  scaleX: number,
  scaleY: number,
): Uint8ClampedArray<ArrayBuffer> {
  const out = new Uint8ClampedArray(src.length) as Uint8ClampedArray<ArrayBuffer>
  const sx = scaleX || 1
  const sy = scaleY || 1
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const srcX = ((x * sx) % width + width) % width | 0
      const srcY = ((y * sy) % height + height) % height | 0
      const si = (srcY * width + srcX) * 4
      const di = (y * width + x) * 4
      out[di]     = src[si]
      out[di + 1] = src[si + 1]
      out[di + 2] = src[si + 2]
      out[di + 3] = src[si + 3]
    }
  }
  return out
}
