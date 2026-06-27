import { useState } from 'react'
import { useStore } from '../../store/index.ts'
import type { Output, Channel } from '../../store/types.ts'
import { Slider } from '../../components/Slider.tsx'
import styles from './OutputCard.module.css'

const CHANNELS: Channel[] = ['r', 'g', 'b', 'a']
const SIZES = [512, 1024, 2048, 4096] as const

interface Props {
  output: Output
}

export function OutputCard({ output }: Props) {
  const sources = useStore(s => s.sources)
  const updateName = useStore(s => s.updateOutputName)
  const updateChannel = useStore(s => s.updateOutputChannel)
  const updateFormat = useStore(s => s.updateOutputFormat)
  const updateSize = useStore(s => s.updateOutputSize)
  const removeOutput = useStore(s => s.removeOutput)
  const dispatchExport = useStore(s => s.dispatchExport)
  const [collapsed, setCollapsed] = useState(false)

  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <button className="btn-ghost" onClick={() => setCollapsed(c => !c)}>
          {collapsed ? '▶' : '▼'}
        </button>
        <input
          type="text"
          value={output.name}
          onChange={e => updateName(output.id, e.target.value)}
          className={styles.name}
        />
        <button className="btn-hi" onClick={() => dispatchExport(output.id)}>↓ Export</button>
        <button className="btn-ghost" onClick={() => removeOutput(output.id)}>×</button>
      </div>

      {!collapsed && (
        <div className={styles.body}>
          {CHANNELS.map(ch => {
            const oc = output.channels[ch]
            return (
              <div key={ch} className={styles.chRow}>
                <span className={styles.chLabel}>{ch.toUpperCase()}</span>
                <select
                  value={oc.sourceId ?? ''}
                  onChange={e => updateChannel(output.id, ch, { sourceId: e.target.value || null })}
                  className={styles.sourceSelect}
                >
                  <option value="">Constant</option>
                  {sources.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
                {oc.sourceId ? (
                  <select
                    value={oc.channel}
                    onChange={e => updateChannel(output.id, ch, { channel: e.target.value as Channel })}
                    className={styles.channelSelect}
                  >
                    {CHANNELS.map(c => <option key={c} value={c}>{c.toUpperCase()}</option>)}
                  </select>
                ) : (
                  <Slider
                    value={oc.constant}
                    onChange={v => updateChannel(output.id, ch, { constant: v })}
                    className={styles.chSlider}
                  />
                )}
              </div>
            )
          })}

          <div className={styles.footer}>
            <select
              value={output.format}
              onChange={e => updateFormat(output.id, e.target.value as Output['format'])}
              className={styles.footerSelect}
            >
              <option value="png">PNG</option>
              <option value="jpeg">JPEG</option>
            </select>
            <select
              value={output.size}
              onChange={e => updateSize(output.id, e.target.value === 'match-source' ? 'match-source' : parseInt(e.target.value))}
              className={styles.footerSelect}
            >
              <option value="match-source">Match source</option>
              {SIZES.map(s => <option key={s} value={s}>{s}px</option>)}
            </select>
          </div>
        </div>
      )}
    </div>
  )
}
