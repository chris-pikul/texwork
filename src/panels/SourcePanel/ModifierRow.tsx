import { useStore } from '../../store/index.ts'
import type { Modifier } from '../../store/types.ts'
import { Slider } from '../../components/Slider.tsx'
import { ColorPicker } from '../../components/ColorPicker.tsx'

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
    <div style={{
      background: 'var(--bg)',
      border: '1px solid var(--border)',
      borderRadius: 6,
      padding: '6px 8px',
      opacity: modifier.enabled ? 1 : 0.45,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
        <input
          type="checkbox"
          checked={modifier.enabled}
          onChange={() => toggle(sourceId, modifier.id)}
          style={{ accentColor: 'var(--accent)', cursor: 'pointer' }}
        />
        <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-h)', flex: 1 }}>
          {modifier.type}
        </span>
        <button
          onClick={() => remove(sourceId, modifier.id)}
          style={{ background: 'none', border: 'none', color: 'var(--text)', fontSize: 14, padding: '0 2px', lineHeight: 1 }}
          title="Remove modifier"
        >
          ×
        </button>
      </div>

      {modifier.type === 'invert' && (
        <div style={{ display: 'flex', gap: 8 }}>
          {CHANNELS.map((ch, i) => (
            <label key={ch} style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 12, cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={((p['channels'] as string[]) ?? []).includes(ch)}
                onChange={e => {
                  const channels = ((p['channels'] as string[]) ?? []).filter(c => c !== ch)
                  if (e.target.checked) channels.push(ch)
                  set('channels', channels)
                }}
                style={{ accentColor: 'var(--accent)' }}
              />
              {CHANNEL_LABELS[i]}
            </label>
          ))}
        </div>
      )}

      {modifier.type === 'tint' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <ColorPicker
            value={(p['color'] as [number, number, number]) ?? [1, 0, 0]}
            onChange={color => set('color', color)}
          />
          <Slider label="Strength" value={(p['strength'] as number) ?? 0.5} onChange={v => set('strength', v)} />
        </div>
      )}

      {modifier.type === 'channel-pick' && (
        <div style={{ display: 'flex', gap: 8 }}>
          {CHANNELS.map((ch, i) => (
            <label key={ch} style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 12, cursor: 'pointer' }}>
              <input
                type="radio"
                name={`ch-pick-${modifier.id}`}
                value={ch}
                checked={(p['channel'] as string) === ch}
                onChange={() => set('channel', ch)}
                style={{ accentColor: 'var(--accent)' }}
              />
              {CHANNEL_LABELS[i]}
            </label>
          ))}
        </div>
      )}

      {modifier.type === 'scale-repeat' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <Slider label="Scale X" value={(p['scaleX'] as number) ?? 1} onChange={v => set('scaleX', v)} min={0.1} max={8} step={0.1} />
          <Slider label="Scale Y" value={(p['scaleY'] as number) ?? 1} onChange={v => set('scaleY', v)} min={0.1} max={8} step={0.1} />
        </div>
      )}
    </div>
  )
}
