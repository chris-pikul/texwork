import { useStore } from '../../store/index.ts'
import { Preview } from '../../preview/Preview.tsx'
import type { PreviewWiring } from '../../store/types.ts'

const MODELS: PreviewWiring['model'][] = ['sphere', 'cube', 'plane', 'cylinder']
const PRESETS: PreviewWiring['preset'][] = ['orm', 'diffuse', 'normal', 'pbr-full', 'custom']
const SLOTS: (keyof PreviewWiring['slots'])[] = ['albedo', 'orm', 'normal', 'emissive']

export function PreviewPanel() {
  const outputs = useStore(s => s.outputs)
  const previewWiring = useStore(s => s.previewWiring)
  const setModel = useStore(s => s.setPreviewModel)
  const applyPreset = useStore(s => s.applyPreset)
  const setSlot = useStore(s => s.setSlot)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      {/* Controls bar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 10px', borderBottom: '1px solid var(--border)', flexShrink: 0, flexWrap: 'wrap' }}>
        <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-h)', textTransform: 'uppercase', letterSpacing: 1 }}>
          Preview
        </span>
        <select
          value={previewWiring.model}
          onChange={e => setModel(e.target.value as PreviewWiring['model'])}
          style={{ fontSize: 12 }}
        >
          {MODELS.map(m => <option key={m} value={m}>{m}</option>)}
        </select>
        <select
          value={previewWiring.preset}
          onChange={e => applyPreset(e.target.value as PreviewWiring['preset'])}
          style={{ fontSize: 12 }}
        >
          {PRESETS.map(p => <option key={p} value={p}>{p}</option>)}
        </select>
      </div>

      {/* Slot wiring (custom preset shows editable selects; others show read-only) */}
      <div style={{ padding: '6px 10px', borderBottom: '1px solid var(--border)', flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 4 }}>
        {SLOTS.map(slot => (
          <div key={slot} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 11, color: 'var(--text)', width: 56, flexShrink: 0, textTransform: 'capitalize' }}>{slot}</span>
            {previewWiring.preset === 'custom' ? (
              <select
                value={previewWiring.slots[slot] ?? ''}
                onChange={e => setSlot(slot, e.target.value || undefined)}
                style={{ flex: 1, fontSize: 12 }}
              >
                <option value="">— none —</option>
                {outputs.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
              </select>
            ) : (
              <span style={{ fontSize: 12, color: previewWiring.slots[slot] ? 'var(--text-h)' : 'var(--border)' }}>
                {previewWiring.slots[slot]
                  ? (outputs.find(o => o.id === previewWiring.slots[slot])?.name ?? '—')
                  : '—'
                }
              </span>
            )}
          </div>
        ))}
      </div>

      {/* Three.js canvas */}
      <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
        <Preview />
      </div>
    </div>
  )
}
