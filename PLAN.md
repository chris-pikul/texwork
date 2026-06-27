# texwork — Plan & Bill of Features

## Concept

A local-first / PWA texture workbench for PBR pipeline work. Primary use case: take individual PBR mask textures (Metallic, Roughness, AO, etc.), combine their channels into a single packed output (e.g. UE-style ORM), and preview the result on a 3D model with a real PBR shader before downloading. Secondary use cases: channel inversion (normal map format conversion), flat/constant value fills, albedo tinting, and procedural fills (v2).

---

## Architecture Decisions

| Decision | Choice | Rationale |
|---|---|---|
| Pixel processing | TypeScript Web Worker (WASM upgrade path) | One-shot ops, 200ms latency acceptable; simpler than WebGL2 context management |
| 3D preview | Three.js MeshStandardMaterial | PBR shading, normal mapping, IBL free; avoids re-implementing PBR shader |
| State management | Zustand | Lightweight, no boilerplate, works well with worker message passing |
| Build tooling | Vite + TypeScript | Already configured |
| PWA | vite-plugin-pwa | Service worker + manifest, local-first |
| Styling | TBD (Tailwind or CSS Modules) | Decide at scaffold time |

### Dual-Resolution Pipeline

All processing runs at two resolutions:

- **Working copy** — longest edge capped at 512px. Generated on source load. Used for all real-time processing and Three.js preview updates.
- **Original buffer** — full resolution, retained in worker memory (or re-read from File handle). Only processed on export.

The processing pipeline is **resolution-agnostic**: same function, same parameters, different input dimensions. Export = re-run pipeline at full res.

### Worker Message Protocol

The TypeScript Web Worker is the spine of the app. The main thread sends commands; the worker posts back processed `ArrayBuffer`s (zero-copy transfer via `Transferable`).

```
Main → Worker:  LOAD_SOURCE, UPDATE_SOURCE, REMOVE_SOURCE
                ADD_MODIFIER, UPDATE_MODIFIER, REMOVE_MODIFIER, REORDER_MODIFIERS
                UPDATE_OUTPUT, PROCESS_PREVIEW, PROCESS_EXPORT

Worker → Main:  SOURCE_LOADED  { sourceId, previewBuffer, width, height }
                PREVIEW_READY  { outputId, buffer, width, height }
                EXPORT_READY   { outputId, buffer, width, height, filename }
                ERROR          { code, message }
```

---

## Data Model

### Source

```ts
type SourceType = 'texture' | 'flat'  // 'noise' in v2

interface Source {
  id: string
  name: string
  type: SourceType
  // type === 'texture'
  file?: File
  originalBuffer?: ImageData
  previewBuffer?: ImageData
  // type === 'flat'
  value?: number  // 0.0–1.0
  modifiers: Modifier[]
}
```

### Modifier

```ts
type ModifierType = 'invert' | 'tint' | 'channel-pick' | 'scale-repeat' | 'levels'

interface Modifier {
  id: string
  type: ModifierType
  enabled: boolean
  params: Record<string, unknown>  // typed per modifier below
}

// invert:        { channels: ('r'|'g'|'b'|'a')[] }
// tint:          { color: [r,g,b], strength: number }
// channel-pick:  { channel: 'r'|'g'|'b'|'a' }  → outputs that channel to all RGBA
// scale-repeat:  { scaleX: number, scaleY: number }
// levels:        { inMin, inMax, gamma, outMin, outMax }  (v2)
```

### Output

```ts
interface OutputChannel {
  sourceId: string | null   // null = use constant
  channel: 'r' | 'g' | 'b' | 'a'
  constant: number          // 0.0–1.0, used when sourceId is null
}

interface Output {
  id: string
  name: string
  channels: { r: OutputChannel; g: OutputChannel; b: OutputChannel; a: OutputChannel }
  format: 'png' | 'jpeg'
  size: number | 'match-source'  // px on longest edge, or match first source
}
```

### Preview Wiring (Three.js)

```ts
interface PreviewWiring {
  model: 'sphere' | 'cube' | 'plane' | 'cylinder'
  preset: 'orm' | 'diffuse' | 'normal' | 'pbr-full' | 'custom'
  slots: {
    albedo?: string       // outputId
    orm?: string          // outputId (R=AO, G=Roughness, B=Metallic)
    normal?: string       // outputId
    emissive?: string     // outputId
  }
}
```

---

## Bill of Features

### Phase 1 — Core (MVP)

- [ ] **Source panel**: add/remove sources; each source has a name and type selector
- [ ] **Texture source**: drag-and-drop or click-to-browse file load; thumbnail preview; stores working + original buffers
- [ ] **Flat source**: single value slider (0.0–1.0); outputs solid RGBA fill
- [ ] **Modifier stack**: ordered list of modifiers per source; toggle enable/disable; drag to reorder
  - [ ] `invert` — invert selected channels (checkboxes for R/G/B/A)
  - [ ] `tint` — color picker + strength; multiplies over RGB
  - [ ] `channel-pick` — select one channel; collapses to grayscale (all channels = selected)
  - [ ] `scale-repeat` — UV scale X/Y (simple pixel repeat)
- [ ] **Output definitions**: add/remove outputs; name each
- [ ] **Channel assignment**: per output, assign R/G/B/A to `sourceId.channel` or constant value
- [ ] **Three.js preview panel**: renders working-res output(s) on selected model
  - [ ] Model selector: Sphere, Cube, Plane, Cylinder
  - [ ] Material preset wiring: ORM, Diffuse, Normal, PBR Full
- [ ] **Export**: process full-res → encode PNG → download; one output at a time
- [ ] **Dual-resolution pipeline**: 512px working copy on load; full-res on export only
- [ ] **TypeScript Web Worker**: all pixel math off main thread; zero-copy ArrayBuffer transfer

### Phase 2 — Polish & Presets

- [ ] **Session presets**: save/load source+output configurations as JSON
- [ ] **Built-in preset layouts**: UE ORM Pack, DX→UE Normal, Grayscale Fill, Albedo with Tint
- [ ] **Export all outputs** at once as a zip
- [ ] **Output size control**: match source, or fixed (512 / 1024 / 2048 / 4096)
- [ ] **Channel isolation view**: toggle to view R / G / B / A channel independently in preview
- [ ] **IBL environment** in preview (simple HDRI or baked cubemap)
- [ ] **PWA manifest + service worker**: installable, offline-capable

### Phase 3 — Advanced

- [ ] **Procedural sources**: Perlin/simplex noise, gradient fills; configurable params
- [ ] **Levels modifier**: input/output min-max + gamma curve
- [ ] **WASM upgrade**: replace Worker pixel math with Rust/wasm-pack for 4K+ perf
- [ ] **16-bit PNG export**: for displacement or HDR masks
- [ ] **Multiple model slots** in preview (show ORM sphere + albedo plane side-by-side)
- [ ] **Undo/redo**: command history for source/modifier/output changes

---

## UI Layout

```
┌─────────────────────────────────────────────────────────────────┐
│  texwork                                          [Export All]  │
├──────────────┬──────────────────────────┬───────────────────────┤
│  SOURCES     │  OUTPUTS                 │  PREVIEW              │
│              │                          │                       │
│  + Add       │  + Add Output            │  [Sphere ▾]           │
│              │                          │  [PBR Full ▾]         │
│  ▶ Src A     │  ▶ ORM Pack              │                       │
│    texture   │    R ← Src B . R         │   ┌─────────────┐    │
│    [invert]  │    G ← Src A . G         │   │             │    │
│    [tint]    │    B ← Src A . B         │   │  3D model   │    │
│              │    A ← const(1.0)        │   │             │    │
│  ▶ Src B     │    [PNG] [match src]     │   └─────────────┘    │
│    flat 0.8  │    [Download]            │                       │
│              │                          │  Albedo ← Output 2    │
│  ▶ Src C     │  ▶ Albedo               │  ORM    ← Output 1    │
│    texture   │    R ← Src C . R         │  Normal ← Output 3    │
│    [ch-pick] │    G ← Src C . G         │                       │
│              │    B ← Src C . B         │  [R] [G] [B] [A]      │
│              │    A ← const(1.0)        │                       │
└──────────────┴──────────────────────────┴───────────────────────┘
```

---

## Implementation Order

1. Project scaffold: install deps (Three.js, Zustand, vite-plugin-pwa), folder structure
2. Zustand store: Source, Modifier, Output, PreviewWiring types + actions
3. Worker: message protocol types, LOAD_SOURCE + downscale, PROCESS_PREVIEW
4. Three.js preview shell: canvas mount, model swap, DataTexture update on message
5. Source panel UI: add/remove, file drop, flat slider, modifier stack
6. Output panel UI: add/remove, channel assignment dropdowns, constant sliders
7. Preview wiring UI: model selector, preset dropdown, slot assignments
8. Export: PROCESS_EXPORT → encode PNG (canvas.toBlob or pngjs in worker) → download
9. Phase 2 features per prioritization

---

## Folder Structure (proposed)

```
src/
  worker/
    index.ts          ← worker entry point
    processor.ts      ← resolution-agnostic pipeline (sources → outputs)
    modifiers/        ← one file per modifier type
    encode.ts         ← PNG encoding for export
  store/
    index.ts          ← Zustand root store
    types.ts          ← Source, Modifier, Output, PreviewWiring
  preview/
    Preview.tsx       ← Three.js canvas component
    scene.ts          ← Three.js scene/model/material management
    wiring.ts         ← maps PreviewWiring slots to material textures
  panels/
    SourcePanel.tsx
    OutputPanel.tsx
    PreviewPanel.tsx
  components/         ← shared UI primitives
  App.tsx
  main.ts
```
