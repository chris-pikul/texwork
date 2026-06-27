import React from 'react'
import { useStore } from '../../store/index.ts'
import type { Channel } from '../../store/types.ts'
import { Preview } from '../../preview/Preview.tsx'
import styles from './PreviewPanel.module.css'

type RGBKey = 'albedo' | 'normal' | 'emissive'
type ChKey  = 'metallic' | 'roughness' | 'ao' | 'height'

const MODELS = ['sphere', 'cube', 'plane', 'cylinder'] as const
type ModelType = typeof MODELS[number]

const RGB_SLOTS: { key: RGBKey; label: string }[] = [
  { key: 'albedo',   label: 'Albedo'   },
  { key: 'normal',   label: 'Normal'   },
  { key: 'emissive', label: 'Emissive' },
]
const CH_SLOTS: { key: ChKey; label: string }[] = [
  { key: 'metallic',  label: 'Metallic'  },
  { key: 'roughness', label: 'Roughness' },
  { key: 'ao',        label: 'AO'        },
  { key: 'height',    label: 'Height'    },
]
const CHANNELS: Channel[] = ['r', 'g', 'b', 'a']

const ICONS: Record<ModelType, React.JSX.Element> = {
  sphere: (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round">
      <circle cx="8" cy="8" r="6.5"/>
      <ellipse cx="8" cy="8" rx="6.5" ry="2.5"/>
      <path d="M8 1.5 C11.5 4.5 11.5 11.5 8 14.5"/>
    </svg>
  ),
  cube: (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 8 L8 8 L8 14 L1 14 Z"/>
      <path d="M1 8 L5 3 L13 3 L8 8"/>
      <path d="M8 8 L13 3 L13 9 L8 14"/>
    </svg>
  ),
  plane: (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round">
      <rect x="1" y="4" width="14" height="10"/>
      <line x1="1" y1="9" x2="15" y2="9"/>
      <line x1="8" y1="4" x2="8" y2="14"/>
    </svg>
  ),
  cylinder: (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round">
      <ellipse cx="8" cy="4" rx="5.5" ry="2"/>
      <ellipse cx="8" cy="12" rx="5.5" ry="2"/>
      <line x1="2.5" y1="4" x2="2.5" y2="12"/>
      <line x1="13.5" y1="4" x2="13.5" y2="12"/>
    </svg>
  ),
}

export function PreviewPanel() {
  const outputs        = useStore(s => s.outputs)
  const wiring         = useStore(s => s.previewWiring)
  const setModel       = useStore(s => s.setPreviewModel)
  const setRGBSlot     = useStore(s => s.setRGBSlot)
  const setChannelSlot = useStore(s => s.setChannelSlot)

  return (
    <div className={styles.panel}>
      <div className={styles.controls}>
        <span className={styles.title}>Preview</span>
        <div className={styles.modelButtons}>
          {MODELS.map(m => (
            <button
              key={m}
              className={`${styles.modelBtn}${wiring.model === m ? ` ${styles.modelBtnActive}` : ''}`}
              onClick={() => setModel(m)}
              title={m}
            >
              {ICONS[m]}
            </button>
          ))}
        </div>
      </div>

      <div className={styles.slots}>
        <div className={styles.sectionLabel}>Surface</div>
        {RGB_SLOTS.map(({ key, label }) => (
          <div key={key} className={styles.slotRow}>
            <span className={styles.slotName}>{label}</span>
            <select
              value={wiring[key].outputId ?? ''}
              onChange={e => setRGBSlot(key, e.target.value || undefined)}
              className={styles.slotSelect}
            >
              <option value="">— none —</option>
              {outputs.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
            </select>
          </div>
        ))}

        <div className={styles.sectionLabel}>Channels</div>
        {CH_SLOTS.map(({ key, label }) => (
          <div key={key} className={styles.slotRow}>
            <span className={styles.slotName}>{label}</span>
            <select
              value={wiring[key].outputId ?? ''}
              onChange={e => setChannelSlot(key, e.target.value || undefined)}
              className={styles.slotSelect}
            >
              <option value="">— none —</option>
              {outputs.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
            </select>
            <select
              value={wiring[key].channel}
              onChange={e => setChannelSlot(key, undefined, e.target.value as Channel)}
              className={styles.channelSelect}
            >
              {CHANNELS.map(c => <option key={c} value={c}>{c.toUpperCase()}</option>)}
            </select>
          </div>
        ))}
      </div>

      <div className={styles.canvasWrap}>
        <Preview />
      </div>
    </div>
  )
}
