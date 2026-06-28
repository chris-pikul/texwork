<div align="center">
  <img src="public/favicon.svg" width="72" height="72" alt="texwork" />
  <h1>texwork</h1>
  <p>Browser-based PBR texture workbench — compose, preview, and export material maps.</p>
  <a href="https://chris-pikul.github.io/texwork"><strong>Open the app →</strong></a>
  <br /><br />

  ![TypeScript](https://img.shields.io/badge/TypeScript-6-3178C6?style=flat-square&logo=typescript&logoColor=white)
  ![Three.js](https://img.shields.io/badge/Three.js-r185-black?style=flat-square&logo=threedotjs&logoColor=white)
  ![Vite](https://img.shields.io/badge/Vite-8-646CFF?style=flat-square&logo=vite&logoColor=white)
  ![PWA](https://img.shields.io/badge/PWA-installable-5A0FC8?style=flat-square&logo=pwa&logoColor=white)
</div>

---

## What is it?

texwork is a local-first, offline-capable web tool for the PBR texture pipeline. It lets you load individual material maps — Albedo, Normal, Roughness, Metallic, AO, Height, Emissive — apply non-destructive modifiers, pack channels into composite outputs, and preview the result live on a 3D model with accurate PBR shading before downloading.

The primary use case is channel packing: taking separate grayscale masks and combining them into a single texture (e.g. an Unreal Engine ORM map where R=AO, G=Roughness, B=Metallic). Everything runs in the browser with no server, no uploads, and no account.

---

## Features

### Sources
- **Drag-and-drop** images directly onto the panel, or click to browse
- **ZIP archive import** — drop a `.zip` from any asset store; texwork scans it, auto-detects map types, and lets you choose what to import
- **Flat sources** — generate a constant greyscale value (0–1) without a file
- **Smart detection** — file names like `T_Rock_Normal_2K.png` are recognised and labelled automatically (Albedo, Normal, Roughness, Metallic, AO, Height, Emissive, ORM, Specular, and more)
- **Non-destructive modifier stack** per source, with toggle and reorder:
  - **Invert** — invert any combination of R/G/B/A channels
  - **Tint** — multiply a colour over RGB with adjustable strength
  - **Channel Pick** — collapse a single channel to greyscale
  - **Scale & Repeat** — tile the texture by X/Y scale factors

### Outputs
- Assign any source channel (R, G, B, A) to each output channel independently
- Use a constant value (0–1) in any channel slot — no source needed
- Set output resolution: match the first source, or fixed (512 → 8192 px)
- Choose export format per output: **PNG** or **JPEG**
- One-click download — exports at full source resolution

### 3D Preview
- Live PBR material preview on **Sphere**, **Cube**, **Plane**, or **Cylinder**
- Wire any output to: **Albedo**, **Normal**, **Metallic**, **Roughness**, **AO**, **Height**, **Emissive**
- Per-channel slot selector for packed maps (choose which channel drives each property)
- **Environment maps** — switch between three IBL environments:
  - *Studio* — neutral grey backdrop (default)
  - *Outdoor* — 2K HDRI daylight
  - *Indoor* — 2K HDRI interior
- **FD toggle** — flip between the fast 512 px preview and full source resolution at any time

### App
- Runs entirely in the browser — no server, no installation required
- All pixel processing runs off the main thread in a **Web Worker** with zero-copy `ArrayBuffer` transfers
- **Dual-resolution pipeline** — a 512 px working copy drives the real-time preview; the original buffer is used on export
- **Installable PWA** — add to home screen on mobile or install as a desktop app; works fully offline

---

## Workflow

1. **Add sources** — drop image files or a ZIP archive onto the Sources panel. Flat sources can stand in for missing maps (e.g. set Metallic = 0).
2. **Stack modifiers** — flip normals between OpenGL/DirectX, invert a roughness mask, pick a single channel from a packed map, or tile a texture.
3. **Define outputs** — add an output and route channels. For an ORM map: R ← AO source, G ← Roughness source, B ← Metallic source, A = 1.0.
4. **Wire the preview** — assign outputs to material slots in the Preview panel. Rotate the model to inspect seams and lighting response.
5. **Export** — click Download on any output card. Full-resolution processing runs once per export and the file downloads immediately.

---

## Install as a PWA

texwork is fully installable as a Progressive Web App. Once installed, it works offline with no network dependency.

- **Desktop (Chrome / Edge):** open the app, then click the install icon in the address bar
- **Android:** open in Chrome → menu → *Add to Home Screen*
- **iOS (Safari):** open the app → Share → *Add to Home Screen*

---

## Self-hosting & Development

texwork has no backend. The build output is a static site you can host anywhere.

### Prerequisites

- Node.js 18+

### Development

```bash
git clone https://github.com/chris-pikul/texwork.git
cd texwork
npm install
npm run dev
```

### Production build

```bash
npm run build
# Output is in dist/ — serve it with any static host
```

### Deploying to GitHub Pages

A GitHub Actions workflow is included at `.github/workflows/deploy.yml`. It builds and deploys automatically on every push to `main` or `master`.

To enable it: go to your repository **Settings → Pages**, set the source to **GitHub Actions**, and push.

---

## Tech Stack

| Layer | Library |
|---|---|
| UI | React 19 + CSS Modules |
| State | Zustand 5 |
| 3D preview | Three.js r185 (MeshStandardMaterial + PMREM) |
| Pixel processing | TypeScript Web Worker |
| ZIP parsing | fflate |
| Build | Vite 8 + Rolldown |
| PWA | vite-plugin-pwa + Workbox |

---

## Roadmap

The following are planned for future releases:

- **Session presets** — save and restore source + output configurations as JSON
- **Export all** — download all outputs at once as a ZIP
- **Levels modifier** — input/output min-max and gamma curve
- **Procedural sources** — noise, gradient, and pattern fills
- **Channel isolation view** — isolate R / G / B / A in the 3D preview
- **Multiple preview slots** — compare outputs side by side
- **Undo / redo** — full command history
- **WASM processing** — Rust/wasm-pack backend for 4K+ performance

---

## License

MIT © [Chris Pikul](https://github.com/chris-pikul)
