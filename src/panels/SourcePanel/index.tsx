import { useStore } from '../../store/index.ts'
import { DropZone } from '../../components/DropZone.tsx'
import { SourceCard } from './SourceCard.tsx'
import styles from './SourcePanel.module.css'

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
    <div className={styles.panel}>
      <div className={styles.header}>
        <span className={styles.title}>Sources</span>
        <button className="btn-hi" onClick={() => addSource('texture')}>+ Texture</button>
        <button className="btn-outline" onClick={() => addSource('flat')}>+ Flat</button>
      </div>

      <DropZone
        onFiles={files => void handleDroppedFiles(files)}
        className={styles.dropBody}
      >
        <div onClick={e => e.stopPropagation()} className={styles.scroll}>
          {sources.length === 0 && (
            <div className={styles.empty}>
              Drop images here or<br />use the buttons above
            </div>
          )}
          {sources.map(src => <SourceCard key={src.id} source={src} />)}
        </div>
      </DropZone>
    </div>
  )
}
