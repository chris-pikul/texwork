import { useState } from 'react'
import { detectTexture } from '../lib/detectTexture.ts'
import type { ZipImageEntry } from '../lib/zipImport.ts'
import styles from './ZipImportDialog.module.css'

interface Props {
  zipName: string
  entries: ZipImageEntry[]
  onConfirm: (selected: ZipImageEntry[]) => void
  onCancel: () => void
}

export function ZipImportDialog({ zipName, entries, onConfirm, onCancel }: Props) {
  const [checked, setChecked] = useState<Set<string>>(() => new Set(entries.map(e => e.path)))

  function toggle(path: string) {
    setChecked(prev => {
      const next = new Set(prev)
      next.has(path) ? next.delete(path) : next.add(path)
      return next
    })
  }

  const selected = entries.filter(e => checked.has(e.path))

  return (
    <div className={styles.overlay} onClick={onCancel}>
      <div className={styles.dialog} onClick={e => e.stopPropagation()}>

        <div className={styles.header}>
          <span className={styles.title}>Import from ZIP</span>
          <button className="btn-ghost" onClick={onCancel} title="Close">×</button>
        </div>

        <div className={styles.subtitle}>
          {entries.length} image{entries.length !== 1 ? 's' : ''} found in <em>{zipName}</em>
        </div>

        <div className={styles.list}>
          {entries.map(entry => {
            const { mapType } = detectTexture(entry.name)
            const isChecked = checked.has(entry.path)
            return (
              <label key={entry.path} className={`${styles.row}${isChecked ? ` ${styles.rowChecked}` : ''}`}>
                <input
                  type="checkbox"
                  checked={isChecked}
                  onChange={() => toggle(entry.path)}
                  className={styles.check}
                />
                <span className={styles.filename} title={entry.path}>{entry.name}</span>
                <span className={mapType ? styles.tag : styles.tagNone}>
                  {mapType ?? '—'}
                </span>
              </label>
            )
          })}
        </div>

        <div className={styles.footer}>
          <div className={styles.footerLeft}>
            <button className="btn-ghost" onClick={() => setChecked(new Set(entries.map(e => e.path)))}>All</button>
            <button className="btn-ghost" onClick={() => setChecked(new Set())}>None</button>
          </div>
          <div className={styles.footerRight}>
            <button className="btn-outline" onClick={onCancel}>Cancel</button>
            <button className="btn-hi" onClick={() => onConfirm(selected)} disabled={selected.length === 0}>
              Import {selected.length > 0 ? selected.length : ''}
            </button>
          </div>
        </div>

      </div>
    </div>
  )
}
