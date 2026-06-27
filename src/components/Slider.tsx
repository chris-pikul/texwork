import styles from './Slider.module.css'

interface Props {
  value: number
  onChange: (value: number) => void
  label?: string
  min?: number
  max?: number
  step?: number
  className?: string
}

export function Slider({ value, onChange, label, min = 0, max = 1, step = 0.01, className }: Props) {
  return (
    <label className={`${styles.slider}${className ? ` ${className}` : ''}`}>
      {label && <span className={styles.label}>{label}</span>}
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={e => onChange(parseFloat(e.target.value))}
        className={styles.track}
      />
      <span className={styles.value}>{value.toFixed(2)}</span>
    </label>
  )
}
