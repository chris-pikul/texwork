import { useStore } from '../../store/index.ts'
import { OutputCard } from './OutputCard.tsx'
import styles from './OutputPanel.module.css'

export function OutputPanel() {
  const outputs = useStore(s => s.outputs)
  const materialName = useStore(s => s.materialName)
  const addOutput = useStore(s => s.addOutput)
  const setMaterialName = useStore(s => s.setMaterialName)

  return (
    <div className={styles.panel}>
      <div className={styles.header}>
        <span className={styles.title}>Outputs</span>
        <button className="btn-hi" onClick={addOutput}>+ Add</button>
      </div>

      <div className={styles.materialBar}>
        <span className={styles.materialLabel}>Material</span>
        <input
          type="text"
          value={materialName}
          onChange={e => setMaterialName(e.target.value)}
          className={styles.materialInput}
          placeholder="e.g. Dirt"
        />
      </div>

      <div className={styles.scroll}>
        {outputs.length === 0 && (
          <div className={styles.empty}>
            Add an output to start<br />packing channels
          </div>
        )}
        {outputs.map(out => <OutputCard key={out.id} output={out} />)}
      </div>
    </div>
  )
}
