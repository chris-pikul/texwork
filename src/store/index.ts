import { create } from 'zustand'
import type {
  Source,
  SourceType,
  Modifier,
  ModifierType,
  Output,
  OutputChannel,
  Channel,
  PreviewWiring,
  WorkerResponse,
} from './types.ts'

// Vite transforms this static import into a Worker constructor at build time
import WorkerCtor from '../worker/index.ts?worker'
import { detectTexture } from '../lib/detectTexture.ts'

function uid(): string {
  return Math.random().toString(36).slice(2, 10)
}

function defaultOutput(): Output {
  const ch = (): OutputChannel => ({ sourceId: null, channel: 'r', constant: 0 })
  return {
    id: uid(),
    name: 'Output',
    channels: { r: ch(), g: ch(), b: ch(), a: { sourceId: null, channel: 'a', constant: 1 } },
    format: 'png',
    size: 'match-source',
  }
}

function defaultModifierParams(type: ModifierType): Record<string, unknown> {
  switch (type) {
    case 'invert':       return { channels: ['r', 'g', 'b', 'a'] }
    case 'tint':         return { color: [1, 0, 0] as [number, number, number], strength: 0.5 }
    case 'channel-pick': return { channel: 'r' }
    case 'scale-repeat': return { scaleX: 2, scaleY: 2 }
  }
}

export type PreviewTexture = { buffer: ArrayBuffer; width: number; height: number }
export type OutputMode = 'passthrough' | 'greyscale' | 'composite'

interface AppState {
  sources: Source[]
  outputs: Output[]
  materialName: string
  previewWiring: PreviewWiring
  worker: Worker | null
  previewTextures: Map<string, PreviewTexture>

  // Worker lifecycle
  initWorker: () => void

  // Sources
  addSource: (type: SourceType) => string
  removeSource: (id: string) => void
  updateSourceName: (id: string, name: string) => void
  loadSourceFile: (id: string, file: File) => Promise<void>
  updateFlatValue: (id: string, value: number) => void

  // Modifiers
  addModifier: (sourceId: string, type: ModifierType) => void
  removeModifier: (sourceId: string, modifierId: string) => void
  toggleModifier: (sourceId: string, modifierId: string) => void
  updateModifierParams: (sourceId: string, modifierId: string, params: Record<string, unknown>) => void
  reorderModifiers: (sourceId: string, fromIndex: number, toIndex: number) => void

  // Outputs
  addOutput: () => void
  addOutputFromSource: (sourceId: string, mode: OutputMode) => void
  removeOutput: (id: string) => void
  updateOutputName: (id: string, name: string) => void
  updateOutputChannel: (outputId: string, ch: Channel, value: Partial<OutputChannel>) => void
  updateOutputFormat: (id: string, format: Output['format']) => void
  updateOutputSize: (id: string, size: Output['size']) => void
  setMaterialName: (name: string) => void

  // Preview
  setPreviewModel: (model: PreviewWiring['model']) => void
  setPreviewEnvironment: (env: PreviewWiring['environment']) => void
  setPreviewFullDef: (v: boolean) => void
  setRGBSlot: (slot: 'albedo' | 'normal' | 'emissive', outputId?: string) => void
  setChannelSlot: (slot: 'metallic' | 'roughness' | 'ao' | 'height', outputId?: string, channel?: Channel) => void

  // Worker dispatch
  dispatchPreview: () => void
  dispatchExport: (outputId: string) => void

  // Worker callbacks (called from worker message handler)
  _onSourceLoaded: (sourceId: string, width: number, height: number, buf: ArrayBuffer) => void
  _onPreviewReady: (outputId: string, buf: ArrayBuffer, width: number, height: number) => void
  _onExportReady: (outputId: string, buf: ArrayBuffer, width: number, height: number) => void
}

function autoWirePreview(wiring: PreviewWiring, outputId: string, name: string): Partial<PreviewWiring> {
  const n = name.toLowerCase()
  if (['albedo', 'diffuse', 'color', 'colour', 'basecolor'].includes(n))   return { albedo:    { outputId } }
  if (n === 'normal')                                                        return { normal:    { outputId } }
  if (['emissive', 'emission'].includes(n))                                  return { emissive:  { outputId } }
  if (['metallic', 'metal', 'metalness'].includes(n))                        return { metallic:  { ...wiring.metallic,  outputId } }
  if (['roughness', 'rough'].includes(n))                                    return { roughness: { ...wiring.roughness, outputId } }
  if (['ao', 'occlusion', 'ambientocclusion'].includes(n))                   return { ao:        { ...wiring.ao,        outputId } }
  if (['height', 'displacement', 'disp', 'bump'].includes(n))                return { height:    { ...wiring.height,    outputId } }
  return {}
}

let previewDebounce: ReturnType<typeof setTimeout> | null = null

export const useStore = create<AppState>((set, get) => ({
  sources: [],
  outputs: [],
  materialName: '',
  previewWiring: {
    model: 'sphere',
    environment: 'studio',
    fullDefinition: false,
    albedo: {}, normal: {}, emissive: {},
    metallic: { channel: 'r' }, roughness: { channel: 'r' },
    ao: { channel: 'r' },      height:    { channel: 'r' },
  },
  worker: null,
  previewTextures: new Map(),

  // ── Worker ──────────────────────────────────────────────────────────────────

  initWorker: () => {
    const w = new WorkerCtor()
    w.onmessage = (e: MessageEvent<WorkerResponse>) => {
      const res = e.data
      const s = get()
      switch (res.type) {
        case 'SOURCE_LOADED': s._onSourceLoaded(res.sourceId, res.width, res.height, res.previewBuffer); break
        case 'PREVIEW_READY': s._onPreviewReady(res.outputId, res.buffer, res.width, res.height); break
        case 'EXPORT_READY':  s._onExportReady(res.outputId, res.buffer, res.width, res.height); break
        case 'ERROR':         console.error('[worker]', res.code, res.message); break
      }
    }
    set({ worker: w })
  },

  // ── Sources ──────────────────────────────────────────────────────────────────

  addSource: (type) => {
    const id = uid()
    const src: Source = {
      id,
      name: type === 'texture' ? 'Texture' : 'Flat',
      type,
      value: type === 'flat' ? 0 : undefined,
      modifiers: [],
    }
    set(s => ({ sources: [...s.sources, src] }))
    return id
  },

  removeSource: (id) => {
    get().worker?.postMessage({ type: 'REMOVE_SOURCE', sourceId: id })
    set(s => ({
      sources: s.sources.filter(src => src.id !== id),
      outputs: s.outputs.map(out => ({
        ...out,
        channels: {
          r: nullIfMatch(out.channels.r, id),
          g: nullIfMatch(out.channels.g, id),
          b: nullIfMatch(out.channels.b, id),
          a: nullIfMatch(out.channels.a, id),
        },
      })),
    }))
  },

  updateSourceName: (id, name) =>
    set(s => ({ sources: s.sources.map(src => src.id === id ? { ...src, name } : src) })),

  loadSourceFile: async (id, file) => {
    const isFresh = !get().sources.find(s => s.id === id)?.file
    const hint = detectTexture(file.name)

    const bitmap = await createImageBitmap(file)
    const canvas = new OffscreenCanvas(bitmap.width, bitmap.height)
    const ctx = canvas.getContext('2d')!
    ctx.drawImage(bitmap, 0, 0)
    bitmap.close()
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)

    set(s => ({
      sources: s.sources.map(src => {
        if (src.id !== id) return src
        return { ...src, file, ...(isFresh ? { name: hint.suggestedName } : {}) }
      }),
    }))
    get().worker?.postMessage({ type: 'LOAD_SOURCE', sourceId: id, imageData })
  },

  updateFlatValue: (id, value) => {
    set(s => ({ sources: s.sources.map(src => src.id === id ? { ...src, value } : src) }))
    get().worker?.postMessage({ type: 'UPDATE_FLAT', sourceId: id, value })
    get().dispatchPreview()
  },

  // ── Modifiers ────────────────────────────────────────────────────────────────

  addModifier: (sourceId, type) => {
    const mod: Modifier = { id: uid(), type, enabled: true, params: defaultModifierParams(type) }
    set(s => ({
      sources: s.sources.map(src =>
        src.id === sourceId ? { ...src, modifiers: [...src.modifiers, mod] } : src,
      ),
    }))
    get().dispatchPreview()
  },

  removeModifier: (sourceId, modifierId) => {
    set(s => ({
      sources: s.sources.map(src =>
        src.id === sourceId
          ? { ...src, modifiers: src.modifiers.filter(m => m.id !== modifierId) }
          : src,
      ),
    }))
    get().dispatchPreview()
  },

  toggleModifier: (sourceId, modifierId) => {
    set(s => ({
      sources: s.sources.map(src =>
        src.id === sourceId
          ? { ...src, modifiers: src.modifiers.map(m => m.id === modifierId ? { ...m, enabled: !m.enabled } : m) }
          : src,
      ),
    }))
    get().dispatchPreview()
  },

  updateModifierParams: (sourceId, modifierId, params) => {
    set(s => ({
      sources: s.sources.map(src =>
        src.id === sourceId
          ? { ...src, modifiers: src.modifiers.map(m => m.id === modifierId ? { ...m, params } : m) }
          : src,
      ),
    }))
    get().dispatchPreview()
  },

  reorderModifiers: (sourceId, fromIndex, toIndex) => {
    set(s => ({
      sources: s.sources.map(src => {
        if (src.id !== sourceId) return src
        const mods = [...src.modifiers]
        const [moved] = mods.splice(fromIndex, 1)
        mods.splice(toIndex, 0, moved)
        return { ...src, modifiers: mods }
      }),
    }))
    get().dispatchPreview()
  },

  // ── Outputs ──────────────────────────────────────────────────────────────────

  addOutput: () => set(s => ({ outputs: [...s.outputs, defaultOutput()] })),

  addOutputFromSource: (sourceId, mode) => {
    const source = get().sources.find(s => s.id === sourceId)
    if (!source) return

    const src = (ch: Channel): OutputChannel => ({ sourceId, channel: ch, constant: 0 })
    const con = (v: number): OutputChannel => ({ sourceId: null, channel: 'r', constant: v })

    const channels: Output['channels'] =
      mode === 'passthrough' ? { r: src('r'), g: src('g'), b: src('b'), a: con(1) } :
      mode === 'greyscale'   ? { r: src('r'), g: src('r'), b: src('r'), a: con(1) } :
                               { r: con(0),   g: con(0),   b: con(0),   a: con(1) }

    const output: Output = {
      id: uid(),
      name: source.name,
      channels,
      format: 'png',
      size: 'match-source',
    }
    set(s => ({ outputs: [...s.outputs, output] }))
    const wire = autoWirePreview(get().previewWiring, output.id, output.name)
    if (Object.keys(wire).length) set(s => ({ previewWiring: { ...s.previewWiring, ...wire } }))
    get().dispatchPreview()
  },

  removeOutput: (id) => set(s => ({ outputs: s.outputs.filter(o => o.id !== id) })),

  updateOutputName: (id, name) =>
    set(s => ({ outputs: s.outputs.map(o => o.id === id ? { ...o, name } : o) })),

  updateOutputChannel: (outputId, ch, value) => {
    set(s => ({
      outputs: s.outputs.map(o =>
        o.id === outputId
          ? { ...o, channels: { ...o.channels, [ch]: { ...o.channels[ch], ...value } } }
          : o,
      ),
    }))
    get().dispatchPreview()
  },

  updateOutputFormat: (id, format) =>
    set(s => ({ outputs: s.outputs.map(o => o.id === id ? { ...o, format } : o) })),

  updateOutputSize: (id, size) =>
    set(s => ({ outputs: s.outputs.map(o => o.id === id ? { ...o, size } : o) })),

  setMaterialName: (name) => set({ materialName: name }),

  // ── Preview ──────────────────────────────────────────────────────────────────

  setPreviewModel: (model) => set(s => ({ previewWiring: { ...s.previewWiring, model } })),

  setPreviewEnvironment: (env) => set(s => ({ previewWiring: { ...s.previewWiring, environment: env } })),

  setPreviewFullDef: (v) => {
    set(s => ({ previewWiring: { ...s.previewWiring, fullDefinition: v } }))
    get().dispatchPreview()
  },

  setRGBSlot: (slot, outputId) =>
    set(s => ({ previewWiring: { ...s.previewWiring, [slot]: { outputId } } })),

  setChannelSlot: (slot, outputId, channel) =>
    set(s => ({
      previewWiring: {
        ...s.previewWiring,
        [slot]: {
          ...s.previewWiring[slot],
          ...(outputId !== undefined ? { outputId } : {}),
          ...(channel  !== undefined ? { channel }  : {}),
        },
      },
    })),

  // ── Dispatch ─────────────────────────────────────────────────────────────────

  dispatchPreview: () => {
    if (previewDebounce) clearTimeout(previewDebounce)
    previewDebounce = setTimeout(() => {
      const { worker, outputs, sources, previewWiring } = get()
      if (!worker || outputs.length === 0) return
      const resolution = previewWiring.fullDefinition ? 'full' : 'preview'
      worker.postMessage({ type: 'PROCESS_PREVIEW', outputs, sources, resolution })
    }, 100)
  },

  dispatchExport: (outputId) => {
    const { worker, outputs, sources } = get()
    const output = outputs.find(o => o.id === outputId)
    if (!worker || !output) return
    worker.postMessage({ type: 'PROCESS_EXPORT', output, outputId, sources })
  },

  // ── Worker callbacks ─────────────────────────────────────────────────────────

  _onSourceLoaded: (sourceId, width, height, buf) => {
    const previewBuffer = new ImageData(new Uint8ClampedArray(buf), width, height)
    set(s => ({
      sources: s.sources.map(src => src.id === sourceId ? { ...src, previewBuffer } : src),
    }))
    get().dispatchPreview()
  },

  _onPreviewReady: (outputId, buf, width, height) => {
    set(s => {
      const next = new Map(s.previewTextures)
      next.set(outputId, { buffer: buf, width, height })
      return { previewTextures: next }
    })
  },

  _onExportReady: (outputId, buf, width, height) => {
    void height
    void width
    const { materialName } = get()
    const output = get().outputs.find(o => o.id === outputId)
    const mime = output?.format === 'jpeg' ? 'image/jpeg' : 'image/png'
    const blob = new Blob([buf], { type: mime })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    const stem = [materialName, output?.name ?? 'output'].filter(Boolean).join('_')
    a.download = `${stem}.${output?.format ?? 'png'}`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  },
}))

function nullIfMatch(ch: OutputChannel, sourceId: string): OutputChannel {
  return ch.sourceId === sourceId ? { ...ch, sourceId: null } : ch
}
