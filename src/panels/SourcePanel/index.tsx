import { useStore } from '../../store/index.ts'
import { DropZone } from '../../components/DropZone.tsx'
import { SourceCard } from './SourceCard.tsx'

export function SourcePanel() {
  const sources = useStore(s => s.sources)
  const addSource = useStore(s => s.addSource)
  const loadFile = useStore(s => s.loadSourceFile)

  async function handleDroppedFiles(files: File[]) {
    for (const file of files) {
      const id = addSource('texture')
      await loadFile(id, file)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 10px', borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
        <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-h)', textTransform: 'uppercase', letterSpacing: 1, flex: 1 }}>
          Sources
        </span>
        <button
          onClick={() => addSource('texture')}
          style={{ fontSize: 11, padding: '3px 8px', background: 'var(--accent-bg)', border: '1px solid var(--accent-border)', borderRadius: 4, color: 'var(--accent)' }}
        >
          + Texture
        </button>
        <button
          onClick={() => addSource('flat')}
          style={{ fontSize: 11, padding: '3px 8px', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 4, color: 'var(--text)' }}
        >
          + Flat
        </button>
      </div>

      <DropZone
        onFiles={files => void handleDroppedFiles(files)}
        style={{ flex: 1, overflow: 'hidden' } as React.CSSProperties}
      >
        <div
          onClick={e => e.stopPropagation()}
          style={{ height: '100%', overflowY: 'auto', padding: 8, display: 'flex', flexDirection: 'column', gap: 6 }}
        >
          {sources.length === 0 && (
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              height: '100%', color: 'var(--text)', fontSize: 12, textAlign: 'center',
              pointerEvents: 'none',
            }}>
              Drop images here or<br />use the buttons above
            </div>
          )}
          {sources.map(src => <SourceCard key={src.id} source={src} />)}
        </div>
      </DropZone>
    </div>
  )
}
