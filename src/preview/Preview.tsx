import { useEffect, useRef } from 'react'
import { useStore } from '../store/index.ts'
import { createScene } from './scene.ts'
import type { SceneHandle, RGBSlotName, ChannelSlotName } from './scene.ts'
import styles from './Preview.module.css'

const RGB_SLOTS: RGBSlotName[]     = ['albedo', 'normal', 'emissive']
const CH_SLOTS: ChannelSlotName[]  = ['metallic', 'roughness', 'ao', 'height']

export function Preview() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const sceneRef  = useRef<SceneHandle | null>(null)

  const previewWiring   = useStore(s => s.previewWiring)
  const previewTextures = useStore(s => s.previewTextures)

  useEffect(() => {
    if (!canvasRef.current) return
    const scene = createScene()
    scene.mount(canvasRef.current)
    sceneRef.current = scene
    return () => { scene.unmount(); sceneRef.current = null }
  }, [])

  useEffect(() => {
    sceneRef.current?.setModel(previewWiring.model)
  }, [previewWiring.model])

  useEffect(() => {
    const scene = sceneRef.current
    if (!scene) return

    for (const slot of RGB_SLOTS) {
      const { outputId } = previewWiring[slot]
      if (!outputId) { scene.clearTexture(slot); continue }
      const tex = previewTextures.get(outputId)
      if (tex) scene.updateTexture(slot, tex.buffer, tex.width, tex.height)
    }

    for (const slot of CH_SLOTS) {
      const { outputId, channel } = previewWiring[slot]
      if (!outputId) { scene.clearTexture(slot); continue }
      const tex = previewTextures.get(outputId)
      if (tex) scene.updateChannelTexture(slot, tex.buffer, tex.width, tex.height, channel)
    }
  }, [previewTextures, previewWiring])

  return <canvas ref={canvasRef} className={styles.canvas} />
}
