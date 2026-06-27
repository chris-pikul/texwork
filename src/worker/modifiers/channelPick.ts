import type { Channel } from '../../store/types.ts'

const CHANNEL_OFFSET: Record<Channel, number> = { r: 0, g: 1, b: 2, a: 3 }

export function applyChannelPick(data: Uint8ClampedArray<ArrayBuffer>, channel: Channel): Uint8ClampedArray<ArrayBuffer> {
  const offset = CHANNEL_OFFSET[channel]
  for (let i = 0; i < data.length; i += 4) {
    const v = data[i + offset]
    data[i] = data[i + 1] = data[i + 2] = data[i + 3] = v
  }
  return data
}
