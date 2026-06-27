import { useEffect } from 'react'
import { useStore } from './store/index.ts'
import { SourcePanel } from './panels/SourcePanel/index.tsx'
import { OutputPanel } from './panels/OutputPanel/index.tsx'
import { PreviewPanel } from './panels/PreviewPanel/index.tsx'
import './App.css'

export default function App() {
  const initWorker = useStore(s => s.initWorker)
  const worker = useStore(s => s.worker)

  useEffect(() => {
    initWorker()
    return () => { useStore.getState().worker?.terminate() }
  }, [initWorker])

  return (
    <div className="app-layout">
      <header className="app-header">
        <h1 className="app-title">texwork</h1>
        {!worker && <span style={{ fontSize: 11, color: 'var(--text)', marginLeft: 12 }}>initializing…</span>}
      </header>
      <main className="app-main">
        <aside className="panel panel-sources">
          <SourcePanel />
        </aside>
        <aside className="panel panel-outputs">
          <OutputPanel />
        </aside>
        <section className="panel panel-preview">
          <PreviewPanel />
        </section>
      </main>
    </div>
  )
}
