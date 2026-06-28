import * as THREE from 'three'
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js'
import { EXRLoader } from 'three/examples/jsm/loaders/EXRLoader.js'
import type { PreviewWiring, Channel } from '../store/types.ts'

export type RGBSlotName     = 'albedo' | 'normal' | 'emissive'
export type ChannelSlotName = 'metallic' | 'roughness' | 'ao' | 'height'
export type TextureSlot     = RGBSlotName | ChannelSlotName
export type EnvironmentMode = PreviewWiring['environment']

export interface SceneHandle {
  mount: (canvas: HTMLCanvasElement) => void
  unmount: () => void
  setModel: (model: PreviewWiring['model']) => void
  setEnvironment: (env: EnvironmentMode) => void
  updateTexture: (slot: RGBSlotName, buffer: ArrayBuffer, width: number, height: number) => void
  updateChannelTexture: (slot: ChannelSlotName, buffer: ArrayBuffer, width: number, height: number, ch: Channel) => void
  clearTexture: (slot: TextureSlot) => void
}

const CH_OFFSET: Record<Channel, number> = { r: 0, g: 1, b: 2, a: 3 }

export function createScene(): SceneHandle {
  let renderer: THREE.WebGLRenderer | null = null
  let camera: THREE.PerspectiveCamera | null = null
  let scene: THREE.Scene | null = null
  let mesh: THREE.Mesh | null = null
  let material: THREE.MeshStandardMaterial | null = null
  let resizeObserver: ResizeObserver | null = null
  let envRT: THREE.WebGLRenderTarget | null = null
  let activeEnv: EnvironmentMode = 'studio'
  const textures: Partial<Record<TextureSlot, THREE.DataTexture>> = {}

  function buildGeometry(model: PreviewWiring['model']): THREE.BufferGeometry {
    let geo: THREE.BufferGeometry
    switch (model) {
      case 'cube':     geo = new THREE.BoxGeometry(1.4, 1.4, 1.4, 32, 32, 32); break
      case 'plane':    geo = new THREE.PlaneGeometry(2, 2, 128, 128); break
      case 'cylinder': geo = new THREE.CylinderGeometry(0.7, 0.7, 1.5, 64, 32); break
      default:         geo = new THREE.SphereGeometry(1, 64, 64); break
    }
    // aoMap samples from uv2
    geo.setAttribute('uv2', geo.attributes['uv'])
    return geo
  }

  function fitCamera(): void {
    if (!camera || !mesh) return
    mesh.geometry.computeBoundingSphere()
    const radius = mesh.geometry.boundingSphere!.radius
    const vFovRad = (camera.fov * Math.PI) / 180
    const distForHeight = radius / Math.tan(vFovRad / 2)
    const distForWidth  = radius / (Math.tan(vFovRad / 2) * camera.aspect)
    camera.position.z = Math.max(distForHeight, distForWidth) * 1.2
  }

  // Extract one RGBA channel into a greyscale DataTexture (R=G=B=value, A=255)
  function extractChannel(buffer: ArrayBuffer, width: number, height: number, ch: Channel): THREE.DataTexture {
    const src = new Uint8Array(buffer)
    const dst = new Uint8Array(width * height * 4)
    const off = CH_OFFSET[ch]
    for (let i = 0; i < width * height; i++) {
      const v = src[i * 4 + off]!
      dst[i * 4]     = v
      dst[i * 4 + 1] = v
      dst[i * 4 + 2] = v
      dst[i * 4 + 3] = 255
    }
    const tex = new THREE.DataTexture(dst, width, height, THREE.RGBAFormat, THREE.UnsignedByteType)
    tex.colorSpace = THREE.LinearSRGBColorSpace
    tex.needsUpdate = true
    return tex
  }

  function applyRGB(slot: RGBSlotName, tex: THREE.DataTexture): void {
    if (!material) return
    switch (slot) {
      case 'albedo':
        tex.colorSpace = THREE.SRGBColorSpace
        tex.needsUpdate = true
        material.map = tex
        break
      case 'normal':
        tex.colorSpace = THREE.LinearSRGBColorSpace
        tex.needsUpdate = true
        material.normalMap = tex
        material.normalMapType = THREE.TangentSpaceNormalMap
        break
      case 'emissive':
        tex.colorSpace = THREE.SRGBColorSpace
        tex.needsUpdate = true
        material.emissiveMap = tex
        material.emissive = new THREE.Color(1, 1, 1)
        break
    }
    material.needsUpdate = true
  }

  function applyChannel(slot: ChannelSlotName, tex: THREE.DataTexture): void {
    if (!material) return
    switch (slot) {
      case 'metallic':  material.metalnessMap = tex;  material.metalness = 1;          break
      case 'roughness': material.roughnessMap = tex;  material.roughness = 1;          break
      case 'ao':        material.aoMap = tex;         material.aoMapIntensity = 1;     break
      case 'height':    material.displacementMap = tex;                                break
    }
    material.needsUpdate = true
  }

  function clearSlot(slot: TextureSlot): void {
    if (!material) return
    const old = textures[slot]
    if (old) { old.dispose(); delete textures[slot] }
    switch (slot) {
      case 'albedo':    material.map = null;                                              break
      case 'normal':    material.normalMap = null;                                        break
      case 'emissive':  material.emissiveMap = null; material.emissive = new THREE.Color(0, 0, 0); break
      case 'metallic':  material.metalnessMap = null;  material.metalness = 0;            break
      case 'roughness': material.roughnessMap = null;  material.roughness = 0.5;          break
      case 'ao':        material.aoMap = null;                                             break
      case 'height':    material.displacementMap = null;                                   break
    }
    material.needsUpdate = true
  }

  function applyEnvironment(env: EnvironmentMode): void {
    if (!scene || !renderer) return
    activeEnv = env

    if (env === 'studio') {
      if (envRT) { envRT.dispose(); envRT = null }
      const pmrem = new THREE.PMREMGenerator(renderer)
      envRT = pmrem.fromScene(new RoomEnvironment())
      scene.environment = envRT.texture
      pmrem.dispose()
      return
    }

    const path = env === 'outdoor' ? '/outdoor.2k.exr' : '/indoor.2k.exr'
    const pmrem = new THREE.PMREMGenerator(renderer)
    pmrem.compileEquirectangularShader()
    new EXRLoader().load(path, (texture) => {
      // Discard if the env changed while loading
      if (!scene || !renderer || activeEnv !== env) {
        texture.dispose()
        pmrem.dispose()
        return
      }
      if (envRT) { envRT.dispose(); envRT = null }
      envRT = pmrem.fromEquirectangular(texture)
      scene.environment = envRT.texture
      pmrem.dispose()
      texture.dispose()
    })
  }

  const handle: SceneHandle = {
    mount(canvas) {
      renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true })
      renderer.setPixelRatio(window.devicePixelRatio)
      renderer.outputColorSpace = THREE.SRGBColorSpace
      renderer.toneMapping = THREE.ACESFilmicToneMapping
      renderer.toneMappingExposure = 1

      const w = canvas.clientWidth || 1
      const h = canvas.clientHeight || 1
      renderer.setSize(w, h, false)

      scene = new THREE.Scene()
      applyEnvironment('studio')

      camera = new THREE.PerspectiveCamera(45, w / h, 0.1, 100)

      material = new THREE.MeshStandardMaterial({
        color: 0xcccccc,
        roughness: 0.5,
        metalness: 0,
        aoMapIntensity: 1,
        displacementScale: 0.08,
      })

      mesh = new THREE.Mesh(buildGeometry('sphere'), material)
      scene.add(mesh)
      fitCamera()

      renderer.setAnimationLoop(() => {
        if (!renderer || !scene || !camera || !mesh) return
        mesh.rotation.y += 0.003
        renderer.render(scene, camera)
      })

      resizeObserver = new ResizeObserver(() => {
        if (!renderer || !camera || !canvas) return
        const pw = canvas.clientWidth
        const ph = canvas.clientHeight
        renderer.setSize(pw, ph, false)
        camera.aspect = pw / ph
        camera.updateProjectionMatrix()
        fitCamera()
      })
      resizeObserver.observe(canvas.parentElement ?? canvas)
    },

    unmount() {
      resizeObserver?.disconnect()
      renderer?.setAnimationLoop(null)
      for (const slot of Object.keys(textures) as TextureSlot[]) clearSlot(slot)
      if (envRT) { envRT.dispose(); envRT = null }
      material?.dispose()
      mesh?.geometry.dispose()
      renderer?.dispose()
      renderer = null; camera = null; scene = null; mesh = null; material = null
    },

    setModel(model) {
      if (!mesh) return
      mesh.geometry.dispose()
      mesh.geometry = buildGeometry(model)
      fitCamera()
    },

    setEnvironment(env) {
      applyEnvironment(env)
    },

    updateTexture(slot, buffer, width, height) {
      const old = textures[slot]
      if (old) old.dispose()
      const data = new Uint8ClampedArray(buffer)
      const tex = new THREE.DataTexture(data, width, height)
      textures[slot] = tex
      applyRGB(slot, tex)
    },

    updateChannelTexture(slot, buffer, width, height, ch) {
      const old = textures[slot]
      if (old) old.dispose()
      const tex = extractChannel(buffer, width, height, ch)
      textures[slot] = tex
      applyChannel(slot, tex)
    },

    clearTexture(slot) {
      clearSlot(slot)
    },
  }

  return handle
}
