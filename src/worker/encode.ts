export async function encodeImageData(imageData: ImageData, format: 'png' | 'jpeg'): Promise<ArrayBuffer> {
  if (typeof OffscreenCanvas === 'undefined') {
    throw new Error('OffscreenCanvas is not available in this browser. Export requires a modern browser.')
  }
  const canvas = new OffscreenCanvas(imageData.width, imageData.height)
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Could not get 2D context from OffscreenCanvas.')
  ctx.putImageData(imageData, 0, 0)
  const blob = await canvas.convertToBlob({
    type: format === 'png' ? 'image/png' : 'image/jpeg',
    quality: 0.95,
  })
  return blob.arrayBuffer()
}
