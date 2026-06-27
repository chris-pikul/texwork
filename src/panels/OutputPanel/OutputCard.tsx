import { useStore } from '../../store/index.ts'
import type { Output, Channel } from '../../store/types.ts'
import { Slider } from '../../components/Slider.tsx'
import { useState } from 'react'

const CHANNELS: Channel[] = ['r', 'g', 'b', 'a']
const CHANNEL_COLORS: Record<Channel, string> = { r: '#f87171', g: '#4ade80', b: '#60a5fa', a: '#a78bfa' }
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
          style={{ background: 'none', border: 'none', color: 'var(--text)', fontSize: 11, padding: 0 }}
        >
          {collapsed ? '▶' : '▼'}
        </button>
        <input
          type="text"
          value={output.name}
          onChange={e => updateName(output.id, e.target.value)}
          style={{ flex: 1, background: 'transparent', border: 'none', color: 'var(--text-h)', fontSize: 13, fontWeight: 500, outline: 'none' }}
        />
        <button
          onClick={() => dispatchExport(output.id)}
          style={{ fontSize: 11, padding: '2px 8px', background: 'var(--accent-bg)', border: '1px solid var(--accent-border)', borderRadius: 4, color: 'var(--accent)' }}
        >
          ↓ Export
        </button>
        <button
          onClick={() => removeOutput(output.id)}
          style={{ background: 'none', border: 'none', color: 'var(--text)', fontSize: 15, padding: '0 2px' }}
        >
          ×
        </button>
      </div>

      {!collapsed && (
        <div style={{ padding: 8, display: 'flex', flexDirection: 'column', gap: 6 }}>
          {/* Channel assignments */}
          {CHANNELS.map(ch => {
            const oc = output.channels[ch]
            return (
              <div key={ch} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ width: 14, fontSize: 12, fontWeight: 700, color: CHANNEL_COLORS[ch], flexShrink: 0 }}>
                  {ch.toUpperCase()}
                </span>
                <select
                  value={oc.sourceId ?? ''}
                  onChange={e => updateChannel(output.id, ch, { sourceId: e.target.value || null })}
                  style={{ flex: 1, fontSize: 12 }}
                >
                  <option value="">Constant</option>
                  {sources.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
                {oc.sourceId ? (
                  <select
                    value={oc.channel}
                    onChange={e => updateChannel(output.id, ch, { channel: e.target.value as Channel })}
                    style={{ width: 52, fontSize: 12 }}
                  >
                    {CHANNELS.map(c => <option key={c} value={c}>{c.toUpperCase()}</option>)}
                  </select>
                ) : (
                  <Slider
                    value={oc.constant}
                    onChange={v => updateChannel(output.id, ch, { constant: v })}
                    style={{ flex: 1 }}
                  />
                )}
              </div>
            )
          })}

          {/* Format + size */}
          <div style={{ display: 'flex', gap: 6, marginTop: 4 }}>
            <select
              value={output.format}
              onChange={e => updateFormat(output.id, e.target.value as Output['format'])}
              style={{ flex: 1, fontSize: 12 }}
            >
              <option value="png">PNG</option>
              <option value="jpeg">JPEG</option>
            </select>
            <select
              value={output.size}
              onChange={e => updateSize(output.id, e.target.value === 'match-source' ? 'match-source' : parseInt(e.target.value))}
              style={{ flex: 1, fontSize: 12 }}
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
