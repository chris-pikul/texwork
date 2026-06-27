interface Props {
  value: number
  onChange: (value: number) => void
  label?: string
  min?: number
  max?: number
  step?: number
  style?: React.CSSProperties
}

export function Slider({ value, onChange, label, min = 0, max = 1, step = 0.01, style }: Props) {
  return (
    <label style={{ display: 'flex', alignItems: 'center', gap: 6, width: '100%', ...style }}>
      {label && <span style={{ fontSize: 12, color: 'var(--text)', minWidth: 0, flexShrink: 0 }}>{label}</span>}
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={e => onChange(parseFloat(e.target.value))}
        style={{ flex: 1, accentColor: 'var(--accent)', cursor: 'pointer' }}
      />
      <span style={{ fontSize: 11, color: 'var(--text)', width: 36, textAlign: 'right', flexShrink: 0 }}>
        {value.toFixed(2)}
      </span>
    </label>
  )
}
