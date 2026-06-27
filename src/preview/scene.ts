import * as THREE from 'three'
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js'
import type { PreviewWiring } from '../store/types.ts'

export type TextureSlot = keyof PreviewWiring['slots']

export interface SceneHandle {
  mount: (canvas: HTMLCanvasElement) => void
  unmount: () => void
  setModel: (model: PreviewWiring['model']) => void
  updateTexture: (slot: TextureSlot, buffer: ArrayBuffer, width: number, height: number) => void
  clearTexture: (slot: TextureSlot) => void
}

export function createScene(): SceneHandle {
  let renderer: THREE.WebGLRenderer | null = null
  let camera: THREE.PerspectiveCamera | null = null
  let scene: THREE.Scene | null = null
  let mesh: THREE.Mesh | null = null
  let material: THREE.MeshStandardMaterial | null = null
  let resizeObserver: ResizeObserver | null = null
  const textures: Partial<Record<TextureSlot, THREE.DataTexture>> = {}

  function buildGeometry(model: PreviewWiring['model']): THREE.BufferGeometry {
    let geo: THREE.BufferGeometry
    switch (model) {
      case 'cube':     geo = new THREE.BoxGeometry(1.4, 1.4, 1.4); break
      case 'plane':    geo = new THREE.PlaneGeometry(2, 2, 64, 64); break
      case 'cylinder': geo = new THREE.CylinderGeometry(0.7, 0.7, 1.5, 64); break
      default:         geo = new THREE.SphereGeometry(1, 64, 64); break
    }
    // UV2 is required for aoMap to sample correctly
    geo.setAttribute('uv2', geo.attributes['uv'])
    return geo
  }

  function applySlot(slot: TextureSlot, tex: THREE.DataTexture): void {
    if (!material) return
    switch (slot) {
      case 'albedo':
        tex.colorSpace = THREE.SRGBColorSpace
        material.map = tex
        break
      case 'orm':
        tex.colorSpace = THREE.LinearSRGBColorSpace
        // Three.js reads R=AO, G=Roughness, B=Metalness from the same texture natively
        material.aoMap = tex
        material.roughnessMap = tex
        material.metalnessMap = tex
        material.aoMapIntensity = 1
        material.roughness = 1
        material.metalness = 1
        break
      case 'normal':
        tex.colorSpace = THREE.LinearSRGBColorSpace
        material.normalMap = tex
        material.normalMapType = THREE.TangentSpaceNormalMap
        break
      case 'emissive':
        tex.colorSpace = THREE.SRGBColorSpace
        material.emissiveMap = tex
        material.emissive = new THREE.Color(1, 1, 1)
        break
    }
    tex.needsUpdate = true
    material.needsUpdate = true
  }

  function clearSlot(slot: TextureSlot): void {
    if (!material) return
    const old = textures[slot]
    if (old) { old.dispose(); delete textures[slot] }
    switch (slot) {
      case 'albedo':   material.map = null; break
      case 'orm':      material.aoMap = null; material.roughnessMap = null; material.metalnessMap = null; break
      case 'normal':   material.normalMap = null; break
      case 'emissive': material.emissiveMap = null; material.emissive = new THREE.Color(0, 0, 0); break
    }
    material.needsUpdate = true
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

      const pmrem = new THREE.PMREMGenerator(renderer)
      pmrem.compileEquirectangularShader()
      scene.environment = pmrem.fromScene(new RoomEnvironment()).texture
      pmrem.dispose()

      camera = new THREE.PerspectiveCamera(45, w / h, 0.1, 100)
      camera.position.set(0, 0, 3)

      material = new THREE.MeshStandardMaterial({
        color: 0xffffff,
        roughness: 0.5,
        metalness: 0,
      })

      mesh = new THREE.Mesh(buildGeometry('sphere'), material)
      scene.add(mesh)

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
      })
      resizeObserver.observe(canvas.parentElement ?? canvas)
    },

    unmount() {
      resizeObserver?.disconnect()
      renderer?.setAnimationLoop(null)
      for (const slot of Object.keys(textures) as TextureSlot[]) clearSlot(slot)
      material?.dispose()
      mesh?.geometry.dispose()
      renderer?.dispose()
      renderer = null; camera = null; scene = null; mesh = null; material = null
    },

    setModel(model) {
      if (!mesh) return
      mesh.geometry.dispose()
      mesh.geometry = buildGeometry(model)
    },

    updateTexture(slot, buffer, width, height) {
      const old = textures[slot]
      if (old) old.dispose()
      const data = new Uint8ClampedArray(buffer)
      const tex = new THREE.DataTexture(data, width, height)
      textures[slot] = tex
      applySlot(slot, tex)
    },

    clearTexture(slot) {
      clearSlot(slot)
    },
  }

  return handle
}
