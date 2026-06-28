// --- Source ---

export type SourceType = 'texture' | 'flat'

export interface Source {
  id: string
  name: string
  type: SourceType
  file?: File
  originalBuffer?: ImageData
  previewBuffer?: ImageData
  value?: number // flat: 0.0–1.0
  modifiers: Modifier[]
}

// --- Modifier ---

export type ModifierType = 'invert' | 'tint' | 'channel-pick' | 'scale-repeat'
export type Channel = 'r' | 'g' | 'b' | 'a'

export interface Modifier {
  id: string
  type: ModifierType
  enabled: boolean
  params: Record<string, unknown>
  // invert:        { channels: Channel[] }
  // tint:          { color: [number, number, number], strength: number }  — color in 0–1
  // channel-pick:  { channel: Channel }
  // scale-repeat:  { scaleX: number, scaleY: number }
}

// --- Output ---

export interface OutputChannel {
  sourceId: string | null
  channel: Channel
  constant: number // 0.0–1.0, used when sourceId is null
}

export interface Output {
  id: string
  name: string
  channels: { r: OutputChannel; g: OutputChannel; b: OutputChannel; a: OutputChannel }
  format: 'png' | 'jpeg'
  size: number | 'match-source'
}

// --- Preview ---

export interface RGBSlot    { outputId?: string }
export interface ChannelSlot { outputId?: string; channel: Channel }

export interface PreviewWiring {
  model:          'sphere' | 'cube' | 'plane' | 'cylinder'
  environment:    'studio' | 'outdoor' | 'indoor'
  fullDefinition: boolean
  // Full-texture RGB maps
  albedo:   RGBSlot
  normal:   RGBSlot
  emissive: RGBSlot
  // Per-channel scalar maps
  metallic:  ChannelSlot
  roughness: ChannelSlot
  ao:        ChannelSlot
  height:    ChannelSlot
}

// --- Worker Message Protocol ---

export type WorkerCommand =
  | { type: 'LOAD_SOURCE'; sourceId: string; imageData: ImageData }
  | { type: 'UPDATE_FLAT'; sourceId: string; value: number }
  | { type: 'REMOVE_SOURCE'; sourceId: string }
  | { type: 'PROCESS_PREVIEW'; outputs: Output[]; sources: Source[]; resolution: 'preview' | 'full' }
  | { type: 'PROCESS_EXPORT'; output: Output; outputId: string; sources: Source[] }

export type WorkerResponse =
  | { type: 'SOURCE_LOADED'; sourceId: string; width: number; height: number; previewBuffer: ArrayBuffer }
  | { type: 'PREVIEW_READY'; outputId: string; buffer: ArrayBuffer; width: number; height: number }
  | { type: 'EXPORT_READY'; outputId: string; buffer: ArrayBuffer; width: number; height: number }
  | { type: 'ERROR'; code: string; message: string }
