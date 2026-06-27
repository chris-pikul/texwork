import { useEffect, useRef, useState } from 'react'
import { useStore } from '../../store/index.ts'
import type { Source, ModifierType } from '../../store/types.ts'
import { DropZone } from '../../components/DropZone.tsx'
import { Slider } from '../../components/Slider.tsx'
import { ModifierRow } from './ModifierRow.tsx'

const MODIFIER_TYPES: ModifierType[] = ['invert', 'tint', 'channel-pick', 'scale-repeat']

interface Props {
  source: Source
}

export function SourceCard({ source }: Props) {
  const updateName = useStore(s => s.updateSourceName)
  const removeSource = useStore(s => s.removeSource)
  const loadFile = useStore(s => s.loadSourceFile)
  const updateFlat = useStore(s => s.updateFlatValue)
  const addModifier = useStore(s => s.addModifier)

  const [collapsed, setCollapsed] = useState(false)
  const thumbRef = useRef<HTMLCanvasElement>(null)

  // Render preview thumbnail when previewBuffer changes
  useEffect(() => {
    if (!source.previewBuffer || !thumbRef.current) return
    const canvas = thumbRef.current
    canvas.width = source.previewBuffer.width
    canvas.height = source.previewBuffer.height
    const ctx = canvas.getContext('2d')
    ctx?.putImageData(source.previewBuffer, 0, 0)
  }, [source.previewBuffer])

  function handleFiles(files: File[]) {
    if (files[0]) void loadFile(source.id, files[0])
  }

  return (
    <div style={{
      background: 'var(--bg-card)',
      border: '1px solid var(--border)',
      borderRadius: 8,
      overflow: 'hidden',
    }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 8px', background: 'var(--bg-panel)' }}>
        <button
          onClick={() => setCollapsed(c => !c)}
          style={{ background: 'none', border: 'none', color: 'var(--text)', fontSize: 11, padding: 0, lineHeight: 1 }}
        >
          {collapsed ? '▶' : '▼'}
        </button>
        <input
          type="text"
          value={source.name}
          onChange={e => updateName(source.id, e.target.value)}
          style={{ flex: 1, background: 'transparent', border: 'none', color: 'var(--text-h)', fontSize: 13, fontWeight: 500, outline: 'none' }}
        />
        <span style={{ fontSize: 10, color: 'var(--text)', textTransform: 'uppercase', letterSpacing: 1 }}>
          {source.type}
        </span>
        <button
          onClick={() => removeSource(source.id)}
          style={{ background: 'none', border: 'none', color: 'var(--text)', fontSize: 15, padding: '0 2px', lineHeight: 1 }}
          title="Remove source"
        >
          ×
        </button>
      </div>

      {!collapsed && (
        <div style={{ padding: 8, display: 'flex', flexDirection: 'column', gap: 8 }}>
          {/* Texture source */}
          {source.type === 'texture' && (
            <DropZone onFiles={handleFiles} multiple={false}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '6px 8px',
                background: 'var(--bg)',
                border: '1px dashed var(--border)',
                borderRadius: 6,
                minHeight: 48,
              }}>
                {source.previewBuffer ? (
                  <canvas
                    ref={thumbRef}
                    style={{ width: 48, height: 48, objectFit: 'cover', borderRadius: 4, imageRendering: 'pixelated' }}
                  />
                ) : (
                  <div style={{ width: 48, height: 48, background: 'var(--border)', borderRadius: 4, flexShrink: 0 }} />
                )}
                <div style={{ fontSize: 12, color: 'var(--text)' }}>
                  {source.file
                    ? <span style={{ color: 'var(--text-h)' }}>{source.file.name}</span>
                    : 'Drop image or click to browse'
                  }
                </div>
              </div>
            </DropZone>
          )}

          {/* Flat source */}
          {source.type === 'flat' && (
            <Slider
              label="Value"
              value={source.value ?? 0}
              onChange={v => updateFlat(source.id, v)}
            />
          )}

          {/* Modifier stack */}
          {source.modifiers.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {source.modifiers.map(mod => (
                <ModifierRow key={mod.id} sourceId={source.id} modifier={mod} />
              ))}
            </div>
          )}

          {/* Add modifier */}
          <select
            value=""
            onChange={e => { if (e.target.value) addModifier(source.id, e.target.value as ModifierType) }}
            style={{ fontSize: 12, color: 'var(--text)' }}
          >
            <option value="" disabled>+ Add modifier…</option>
            {MODIFIER_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
      )}
    </div>
  )
}
