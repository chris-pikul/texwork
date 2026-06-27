import { useStore } from '../../store/index.ts'
import type { Modifier } from '../../store/types.ts'
import { Slider } from '../../components/Slider.tsx'
import { ColorPicker } from '../../components/ColorPicker.tsx'
import styles from './ModifierRow.module.css'

interface Props {
  sourceId: string
  modifier: Modifier
}

const CHANNEL_LABELS = ['R', 'G', 'B', 'A'] as const
const CHANNELS = ['r', 'g', 'b', 'a'] as const

export function ModifierRow({ sourceId, modifier }: Props) {
  const toggle = useStore(s => s.toggleModifier)
  const remove = useStore(s => s.removeModifier)
  const update = useStore(s => s.updateModifierParams)
  const p = modifier.params

  function set(key: string, value: unknown) {
    update(sourceId, modifier.id, { ...p, [key]: value })
  }

  return (
    <div className={styles.row} data-disabled={!modifier.enabled}>
      <div className={styles.rowHeader}>
        <input
          type="checkbox"
          checked={modifier.enabled}
          onChange={() => toggle(sourceId, modifier.id)}
        />
        <span className={styles.typeLabel}>{modifier.type}</span>
        <button className="btn-ghost" onClick={() => remove(sourceId, modifier.id)} title="Remove modifier">×</button>
      </div>

      {modifier.type === 'invert' && (
        <div className={styles.channels}>
          {CHANNELS.map((ch, i) => (
            <label key={ch} className={styles.chLabel}>
              <input
                type="checkbox"
                checked={((p['channels'] as string[]) ?? []).includes(ch)}
                onChange={e => {
                  const channels = ((p['channels'] as string[]) ?? []).filter(c => c !== ch)
                  if (e.target.checked) channels.push(ch)
                  set('channels', channels)
                }}
              />
              {CHANNEL_LABELS[i]}
            </label>
          ))}
        </div>
      )}

      {modifier.type === 'tint' && (
        <div className={styles.stack}>
          <ColorPicker
            value={(p['color'] as [number, number, number]) ?? [1, 0, 0]}
            onChange={color => set('color', color)}
          />
          <Slider label="Strength" value={(p['strength'] as number) ?? 0.5} onChange={v => set('strength', v)} />
        </div>
      )}

      {modifier.type === 'channel-pick' && (
        <div className={styles.channels}>
          {CHANNELS.map((ch, i) => (
            <label key={ch} className={styles.chLabel}>
              <input
                type="radio"
                name={`ch-pick-${modifier.id}`}
                value={ch}
                checked={(p['channel'] as string) === ch}
                onChange={() => set('channel', ch)}
              />
              {CHANNEL_LABELS[i]}
            </label>
          ))}
        </div>
      )}

      {modifier.type === 'scale-repeat' && (
        <div className={styles.stack}>
          <Slider label="Scale X" value={(p['scaleX'] as number) ?? 1} onChange={v => set('scaleX', v)} min={0.1} max={8} step={0.1} />
          <Slider label="Scale Y" value={(p['scaleY'] as number) ?? 1} onChange={v => set('scaleY', v)} min={0.1} max={8} step={0.1} />
        </div>
      )}
    </div>
  )
}
