import { useStore } from '../../store/index.ts'
import { OutputCard } from './OutputCard.tsx'

export function OutputPanel() {
  const outputs = useStore(s => s.outputs)
  const addOutput = useStore(s => s.addOutput)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 10px', borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
        <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-h)', textTransform: 'uppercase', letterSpacing: 1, flex: 1 }}>
          Outputs
        </span>
        <button
          onClick={addOutput}
          style={{ fontSize: 11, padding: '3px 8px', background: 'var(--accent-bg)', border: '1px solid var(--accent-border)', borderRadius: 4, color: 'var(--accent)' }}
        >
          + Add
        </button>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: 8, display: 'flex', flexDirection: 'column', gap: 6 }}>
        {outputs.length === 0 && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text)', fontSize: 12, textAlign: 'center' }}>
            Add an output to start<br />packing channels
          </div>
        )}
        {outputs.map(out => <OutputCard key={out.id} output={out} />)}
      </div>
    </div>
  )
}
