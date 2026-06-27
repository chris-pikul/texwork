import type { WorkerCommand, WorkerResponse, Source } from '../store/types.ts'
import { processOutput, resampleNearest } from './processor.ts'
import { encodeImageData } from './encode.ts'

// Worker-internal buffer store: sourceId → { preview, original }
const sourcesMap = new Map<string, { preview: ImageData; original: ImageData }>()
// Mirror of source modifier stacks from the store, kept current via each command
const sourceMeta = new Map<string, Source>()

self.addEventListener('message', (e: MessageEvent<WorkerCommand>) => {
  void handle(e.data)
})

async function handle(cmd: WorkerCommand): Promise<void> {
  try {
    switch (cmd.type) {
      case 'LOAD_SOURCE': {
        const [pw, ph] = previewSize(cmd.imageData)
        const preview = resampleNearest(cmd.imageData, pw, ph)
        sourcesMap.set(cmd.sourceId, { original: cmd.imageData, preview })
        const buf = preview.data.buffer.slice(0) // clone; keep original in map
        post({ type: 'SOURCE_LOADED', sourceId: cmd.sourceId, width: pw, height: ph, previewBuffer: buf }, [buf])
        break
      }

      case 'UPDATE_FLAT': {
        const existing = sourceMeta.get(cmd.sourceId)
        if (existing) sourceMeta.set(cmd.sourceId, { ...existing, value: cmd.value })
        break
      }

      case 'REMOVE_SOURCE': {
        sourcesMap.delete(cmd.sourceId)
        sourceMeta.delete(cmd.sourceId)
        break
      }

      case 'PROCESS_PREVIEW': {
        syncMeta(cmd.sources)
        for (const output of cmd.outputs) {
          const result = processOutput(output, sourcesMap, sourceMeta, 'preview')
          const buf = result.data.buffer.slice(0)
          post({ type: 'PREVIEW_READY', outputId: output.id, buffer: buf, width: result.width, height: result.height }, [buf])
        }
        break
      }

      case 'PROCESS_EXPORT': {
        syncMeta(cmd.sources)
        const result = processOutput(cmd.output, sourcesMap, sourceMeta, 'full')
        const encoded = await encodeImageData(result, cmd.output.format)
        post({ type: 'EXPORT_READY', outputId: cmd.outputId, buffer: encoded, width: result.width, height: result.height }, [encoded])
        break
      }
    }
  } catch (err) {
    post({ type: 'ERROR', code: 'E_WORKER', message: String(err) }, [])
  }
}

function syncMeta(sources: Source[]): void {
  for (const src of sources) sourceMeta.set(src.id, src)
}

function post(msg: WorkerResponse, transfer: Transferable[]): void {
  (self as DedicatedWorkerGlobalScope).postMessage(msg, { transfer })
}

function previewSize(img: ImageData): [number, number] {
  const MAX = 512
  const ratio = Math.min(MAX / img.width, MAX / img.height, 1)
  return [Math.round(img.width * ratio), Math.round(img.height * ratio)]
}
