import { useEffect } from 'react'
import { useStore } from './store/index.ts'
import { SourcePanel } from './panels/SourcePanel/index.tsx'
import { OutputPanel } from './panels/OutputPanel/index.tsx'
import { PreviewPanel } from './panels/PreviewPanel/index.tsx'
import styles from './App.module.css'

export default function App() {
  const initWorker = useStore(s => s.initWorker)
  const worker = useStore(s => s.worker)

  useEffect(() => {
    initWorker()
    return () => { useStore.getState().worker?.terminate() }
  }, [initWorker])

  return (
    <div className={styles.layout}>
      <header className={styles.header}>
        <h1 className={styles.title}>texwork</h1>
        {!worker && <span className={styles.status}>initializing…</span>}
      </header>
      <main className={styles.main}>
        <aside className={`${styles.panel} ${styles.panelSources}`}>
          <SourcePanel />
        </aside>
        <aside className={`${styles.panel} ${styles.panelOutputs}`}>
          <OutputPanel />
        </aside>
        <section className={`${styles.panel} ${styles.panelPreview}`}>
          <PreviewPanel />
        </section>
      </main>
    </div>
  )
}
