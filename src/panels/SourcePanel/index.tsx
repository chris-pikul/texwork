import { useState } from 'react'
import { useStore } from '../../store/index.ts'
import { DropZone } from '../../components/DropZone.tsx'
import { SourceCard } from './SourceCard.tsx'
import { ZipImportDialog } from '../../components/ZipImportDialog.tsx'
import { extractImagesFromZip, entryToFile, isZipFile } from '../../lib/zipImport.ts'
import type { ZipImageEntry } from '../../lib/zipImport.ts'
import styles from './SourcePanel.module.css'

interface ZipDialog {
  zipName: string
  entries: ZipImageEntry[]
}

export function SourcePanel() {
  const sources    = useStore(s => s.sources)
  const addSource  = useStore(s => s.addSource)
  const loadFile   = useStore(s => s.loadSourceFile)

  const [zipDialog, setZipDialog] = useState<ZipDialog | null>(null)

  async function handleDroppedFiles(files: File[]) {
    const images = files.filter(f => f.type.startsWith('image/'))
    const zips   = files.filter(isZipFile)

    for (const file of images) {
      const id = addSource('texture')
      await loadFile(id, file)
    }

    if (zips[0]) {
      try {
        const entries = await extractImagesFromZip(zips[0])
        if (entries.length > 0) setZipDialog({ zipName: zips[0].name, entries })
      } catch (err) {
        console.error('[zip]', err)
      }
    }
  }

  async function handleZipConfirm(selected: ZipImageEntry[]) {
    setZipDialog(null)
    for (const entry of selected) {
      const id = addSource('texture')
      await loadFile(id, entryToFile(entry))
    }
  }

  return (
    <>
      {zipDialog && (
        <ZipImportDialog
          zipName={zipDialog.zipName}
          entries={zipDialog.entries}
          onConfirm={handleZipConfirm}
          onCancel={() => setZipDialog(null)}
        />
      )}

      <div className={styles.panel}>
        <div className={styles.header}>
          <span className={styles.title}>Sources</span>
          <button className="btn-hi" onClick={() => addSource('texture')}>+ Texture</button>
          <button className="btn-outline" onClick={() => addSource('flat')}>+ Flat</button>
        </div>

        <DropZone
          onFiles={files => void handleDroppedFiles(files)}
          accept="image/*,.zip"
          className={styles.dropBody}
        >
          <div onClick={e => e.stopPropagation()} className={styles.scroll}>
            {sources.length === 0 && (
              <div className={styles.empty}>
                Drop images or a ZIP here<br />or use the buttons above
              </div>
            )}
            {sources.map(src => <SourceCard key={src.id} source={src} />)}
          </div>
        </DropZone>
      </div>
    </>
  )
}
