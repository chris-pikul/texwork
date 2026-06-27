export function applyTint(
  data: Uint8ClampedArray<ArrayBuffer>,
  color: [number, number, number],
  strength: number,
): Uint8ClampedArray<ArrayBuffer> {
  const r = color[0] * 255
  const g = color[1] * 255
  const b = color[2] * 255
  for (let i = 0; i < data.length; i += 4) {
    data[i]     = Math.round(data[i]     + (r - data[i])     * strength)
    data[i + 1] = Math.round(data[i + 1] + (g - data[i + 1]) * strength)
    data[i + 2] = Math.round(data[i + 2] + (b - data[i + 2]) * strength)
    // alpha untouched
  }
  return data
}
