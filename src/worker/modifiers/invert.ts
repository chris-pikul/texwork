import type { Channel } from '../../store/types.ts'

const CHANNEL_OFFSET: Record<Channel, number> = { r: 0, g: 1, b: 2, a: 3 }

export function applyInvert(data: Uint8ClampedArray<ArrayBuffer>, channels: Channel[]): Uint8ClampedArray<ArrayBuffer> {
  for (let i = 0; i < data.length; i += 4)
    for (const ch of channels) data[i + CHANNEL_OFFSET[ch]] = 255 - data[i + CHANNEL_OFFSET[ch]]
  return data
}
