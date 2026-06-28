import { unzip } from 'fflate'

// Browser-decodable image formats only — EXR/TGA need separate decoders
const IMAGE_EXTS = new Set(['.png', '.jpg', '.jpeg', '.webp', '.bmp', '.gif', '.avif'])

const MIME: Record<string, string> = {
  '.png':  'image/png',
  '.jpg':  'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.bmp':  'image/bmp',
  '.gif':  'image/gif',
  '.avif': 'image/avif',
}

export interface ZipImageEntry {
  name: string
  path: string
  data: Uint8Array
}

export async function extractImagesFromZip(file: File): Promise<ZipImageEntry[]> {
  const buf = new Uint8Array(await file.arrayBuffer())
  return new Promise((resolve, reject) => {
    unzip(buf, (err, files) => {
      if (err) { reject(err); return }
      const entries: ZipImageEntry[] = []
      for (const [path, data] of Object.entries(files)) {
        if (path.endsWith('/') || path.includes('__MACOSX')) continue
        const name = path.split('/').pop()!
        if (!name || name.startsWith('.')) continue
        const ext = name.slice(name.lastIndexOf('.')).toLowerCase()
        if (!IMAGE_EXTS.has(ext)) continue
        entries.push({ name, path, data })
      }
      entries.sort((a, b) => a.name.localeCompare(b.name))
      resolve(entries)
    })
  })
}

export function entryToFile(entry: ZipImageEntry): File {
  const ext = entry.name.slice(entry.name.lastIndexOf('.')).toLowerCase()
  // fflate types the buffer as ArrayBufferLike; it's always a plain ArrayBuffer at runtime
  return new File([entry.data.buffer.slice(0) as ArrayBuffer], entry.name, { type: MIME[ext] ?? 'application/octet-stream' })
}

export function isZipFile(file: File): boolean {
  return (
    file.type === 'application/zip' ||
    file.type === 'application/x-zip-compressed' ||
    file.type === 'application/x-zip' ||
    file.name.toLowerCase().endsWith('.zip')
  )
}
