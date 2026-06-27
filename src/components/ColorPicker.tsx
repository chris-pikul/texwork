import { Slider } from './Slider.tsx'

interface Props {
  value: [number, number, number]
  onChange: (color: [number, number, number]) => void
}

export function ColorPicker({ value, onChange }: Props) {
  const [r, g, b] = value
  const swatch = `rgb(${Math.round(r * 255)},${Math.round(g * 255)},${Math.round(b * 255)})`

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
        <div style={{ width: 20, height: 20, borderRadius: 3, background: swatch, border: '1px solid var(--border)', flexShrink: 0 }} />
        <span style={{ fontSize: 11, color: 'var(--text)' }}>{swatch}</span>
      </div>
      <Slider label="R" value={r} onChange={v => onChange([v, g, b])} />
      <Slider label="G" value={g} onChange={v => onChange([r, v, b])} />
      <Slider label="B" value={b} onChange={v => onChange([r, g, v])} />
    </div>
  )
}
