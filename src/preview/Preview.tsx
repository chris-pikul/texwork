import { useEffect, useRef } from 'react'
import { useStore } from '../store/index.ts'
import { createScene } from './scene.ts'
import type { SceneHandle, TextureSlot } from './scene.ts'

export function Preview() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const sceneRef = useRef<SceneHandle | null>(null)

  const previewWiring = useStore(s => s.previewWiring)
  const previewTextures = useStore(s => s.previewTextures)

  // Mount / unmount Three.js scene
  useEffect(() => {
    if (!canvasRef.current) return
    const scene = createScene()
    scene.mount(canvasRef.current)
    sceneRef.current = scene
    return () => {
      scene.unmount()
      sceneRef.current = null
    }
  }, [])

  // Sync model changes
  useEffect(() => {
    sceneRef.current?.setModel(previewWiring.model)
  }, [previewWiring.model])

  // Sync texture slots when preview textures or wiring changes
  useEffect(() => {
    const scene = sceneRef.current
    if (!scene) return
    const slots = previewWiring.slots
    const slotKeys: TextureSlot[] = ['albedo', 'orm', 'normal', 'emissive']
    for (const slot of slotKeys) {
      const outputId = slots[slot]
      if (!outputId) {
        scene.clearTexture(slot)
        continue
      }
      const tex = previewTextures.get(outputId)
      if (tex) scene.updateTexture(slot, tex.buffer, tex.width, tex.height)
    }
  }, [previewTextures, previewWiring.slots])

  return (
    <canvas
      ref={canvasRef}
      style={{ width: '100%', height: '100%', display: 'block' }}
    />
  )
}
