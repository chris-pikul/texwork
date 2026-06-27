import { useEffect, useRef, useState } from 'react'
import { useStore } from '../../store/index.ts'
import type { Source, ModifierType } from '../../store/types.ts'
import { DropZone } from '../../components/DropZone.tsx'
import { Slider } from '../../components/Slider.tsx'
import { ModifierRow } from './ModifierRow.tsx'
import type { OutputMode } from '../../store/index.ts'
import styles from './SourceCard.module.css'

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
  const addOutputFromSource = useStore(s => s.addOutputFromSource)

  const [collapsed, setCollapsed] = useState(false)
  const thumbRef = useRef<HTMLCanvasElement>(null)

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
    <div className={styles.card}>
      <div className={styles.header}>
        <button className="btn-ghost" onClick={() => setCollapsed(c => !c)}>
          {collapsed ? '▶' : '▼'}
        </button>
        <input
          type="text"
          value={source.name}
          onChange={e => updateName(source.id, e.target.value)}
          className={styles.name}
        />
        <span className={styles.typeBadge}>{source.type}</span>
        <button className="btn-ghost" onClick={() => removeSource(source.id)} title="Remove source">×</button>
      </div>

      {!collapsed && (
        <div className={styles.body}>
          {source.type === 'texture' && (
            <DropZone onFiles={handleFiles} multiple={false}>
              <div className={styles.textureZone}>
                {source.previewBuffer
                  ? <canvas ref={thumbRef} className={styles.thumb} />
                  : <div className={styles.thumbPlaceholder} />
                }
                <div className={styles.dropInfo}>
                  {source.file
                    ? <span className={styles.fileName}>{source.file.name}</span>
                    : <span className={styles.dropHint}>Drop image or click to browse</span>
                  }
                </div>
              </div>
            </DropZone>
          )}

          {source.type === 'flat' && (
            <Slider
              label="Value"
              value={source.value ?? 0}
              onChange={v => updateFlat(source.id, v)}
            />
          )}

          {source.modifiers.length > 0 && (
            <div className={styles.modifiers}>
              {source.modifiers.map(mod => (
                <ModifierRow key={mod.id} sourceId={source.id} modifier={mod} />
              ))}
            </div>
          )}

          <select
            value=""
            onChange={e => { if (e.target.value) addModifier(source.id, e.target.value as ModifierType) }}
            className={styles.addSelect}
          >
            <option value="" disabled>+ Add modifier…</option>
            {MODIFIER_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
          </select>

          <select
            value=""
            onChange={e => {
              if (e.target.value) {
                addOutputFromSource(source.id, e.target.value as OutputMode)
                e.currentTarget.value = ''
              }
            }}
            className={styles.addSelect}
          >
            <option value="" disabled>→ Add as output…</option>
            <option value="passthrough">Passthrough — RGB + A=1</option>
            <option value="greyscale">Greyscale — R→RGB, A=1</option>
            <option value="composite">New composite</option>
          </select>
        </div>
      )}
    </div>
  )
}
