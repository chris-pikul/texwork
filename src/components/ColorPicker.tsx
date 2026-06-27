import { Slider } from './Slider.tsx'
import styles from './ColorPicker.module.css'

interface Props {
  value: [number, number, number]
  onChange: (color: [number, number, number]) => void
}

export function ColorPicker({ value, onChange }: Props) {
  const [r, g, b] = value
  const swatch = `rgb(${Math.round(r * 255)},${Math.round(g * 255)},${Math.round(b * 255)})`

  return (
    <div className={styles.picker}>
      <div className={styles.swatchRow}>
        <div className={styles.swatch} style={{ background: swatch }} />
        <span className={styles.swatchHex}>{swatch}</span>
      </div>
      <Slider label="R" value={r} onChange={v => onChange([v, g, b])} />
      <Slider label="G" value={g} onChange={v => onChange([r, v, b])} />
      <Slider label="B" value={b} onChange={v => onChange([r, g, v])} />
    </div>
  )
}
