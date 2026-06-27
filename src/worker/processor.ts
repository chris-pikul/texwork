import type { Output, Source, Channel } from '../store/types.ts'
import { applyInvert } from './modifiers/invert.ts'
import { applyTint } from './modifiers/tint.ts'
import { applyChannelPick } from './modifiers/channelPick.ts'
import { applyScaleRepeat } from './modifiers/scaleRepeat.ts'

const CHANNEL_OFFSET: Record<Channel, number> = { r: 0, g: 1, b: 2, a: 3 }

export function resampleNearest(src: ImageData, targetW: number, targetH: number): ImageData {
  const out = new Uint8ClampedArray(targetW * targetH * 4)
  const xRatio = src.width / targetW
  const yRatio = src.height / targetH
  for (let y = 0; y < targetH; y++) {
    for (let x = 0; x < targetW; x++) {
      const srcX = Math.min(Math.floor(x * xRatio), src.width - 1)
      const srcY = Math.min(Math.floor(y * yRatio), src.height - 1)
      const si = (srcY * src.width + srcX) * 4
      const di = (y * targetW + x) * 4
      out[di]     = src.data[si]
      out[di + 1] = src.data[si + 1]
      out[di + 2] = src.data[si + 2]
      out[di + 3] = src.data[si + 3]
    }
  }
  return new ImageData(out, targetW, targetH)
}

function applyModifiers(src: ImageData, source: Source): Uint8ClampedArray<ArrayBuffer> {
  // .slice(0) gives Uint8ClampedArray<ArrayBuffer> (not ArrayBufferLike) — required for TS6 strict generics
  let buf: Uint8ClampedArray<ArrayBuffer> = src.data.slice(0)
  const w = src.width
  const h = src.height
  for (const mod of source.modifiers) {
    if (!mod.enabled) continue
    const p = mod.params
    switch (mod.type) {
      case 'invert':
        buf = applyInvert(buf, (p['channels'] as Channel[]) ?? ['r', 'g', 'b', 'a'])
        break
      case 'tint':
        buf = applyTint(
          buf,
          (p['color'] as [number, number, number]) ?? [1, 1, 1],
          (p['strength'] as number) ?? 0.5,
        )
        break
      case 'channel-pick':
        buf = applyChannelPick(buf, (p['channel'] as Channel) ?? 'r')
        break
      case 'scale-repeat':
        buf = applyScaleRepeat(buf, w, h, (p['scaleX'] as number) ?? 1, (p['scaleY'] as number) ?? 1)
        break
    }
  }
  return buf
}

function resolveOutputDimensions(
  output: Output,
  sourcesMap: Map<string, { preview: ImageData; original: ImageData }>,
  resolution: 'preview' | 'full',
): [number, number] {
  if (output.size === 'match-source') {
    for (const ch of [output.channels.r, output.channels.g, output.channels.b, output.channels.a]) {
      if (ch.sourceId) {
        const entry = sourcesMap.get(ch.sourceId)
        if (entry) {
          const buf = resolution === 'preview' ? entry.preview : entry.original
          return [buf.width, buf.height]
        }
      }
    }
    return [512, 512]
  }
  return [output.size, output.size]
}

export function processOutput(
  output: Output,
  sourcesMap: Map<string, { preview: ImageData; original: ImageData }>,
  sourceMeta: Map<string, Source>,
  resolution: 'preview' | 'full',
): ImageData {
  const [outW, outH] = resolveOutputDimensions(output, sourcesMap, resolution)
  const outBuf = new Uint8ClampedArray(outW * outH * 4)

  // cache processed source buffers — each unique source is processed once
  const processedCache = new Map<string, Uint8ClampedArray>()

  const getProcessed = (sourceId: string): Uint8ClampedArray | null => {
    if (processedCache.has(sourceId)) return processedCache.get(sourceId)!
    const entry = sourcesMap.get(sourceId)
    if (!entry) return null
    const raw = resolution === 'preview' ? entry.preview : entry.original
    // resample to output dimensions if needed
    const sized = (raw.width === outW && raw.height === outH)
      ? raw
      : resampleNearest(raw, outW, outH)
    const source = sourceMeta.get(sourceId)
    const processed = source ? applyModifiers(sized, source) : new Uint8ClampedArray(sized.data)
    processedCache.set(sourceId, processed)
    return processed
  }

  const channels: Channel[] = ['r', 'g', 'b', 'a']
  for (const ch of channels) {
    const outCh = output.channels[ch]
    const dstOffset = CHANNEL_OFFSET[ch]

    if (outCh.sourceId === null) {
      // fill with constant
      const value = Math.round(Math.max(0, Math.min(1, outCh.constant)) * 255)
      for (let i = dstOffset; i < outBuf.length; i += 4) outBuf[i] = value
    } else {
      const processed = getProcessed(outCh.sourceId)
      if (processed) {
        const srcOffset = CHANNEL_OFFSET[outCh.channel]
        for (let i = 0; i < outW * outH; i++) outBuf[i * 4 + dstOffset] = processed[i * 4 + srcOffset]
      }
    }
  }

  return new ImageData(outBuf, outW, outH)
}
