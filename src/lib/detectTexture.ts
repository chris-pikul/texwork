export interface TextureHint {
  mapType: string | null
  suggestedName: string
}

const MAP_TYPES: { label: string; keywords: string[] }[] = [
  // Order matters — more specific entries first
  { label: 'ORM',       keywords: ['orm'] },
  { label: 'Normal',    keywords: ['normal', 'nrm', 'nrml', 'nor', 'norm', 'normalmap', 'nmap'] },
  { label: 'Albedo',    keywords: ['albedo', 'diffuse', 'basecolor', 'base_color', 'col', 'diff', 'alb', 'color', 'colour'] },
  { label: 'Roughness', keywords: ['roughness', 'rough', 'rgh', 'roughnessmap'] },
  { label: 'Metallic',  keywords: ['metallic', 'metalness', 'metal', 'met'] },
  { label: 'AO',        keywords: ['ao', 'ambientocclusion', 'occlusion', 'occ', 'ambient'] },
  { label: 'Emissive',  keywords: ['emissive', 'emission', 'emiss', 'emit'] },
  { label: 'Height',    keywords: ['height', 'disp', 'displacement', 'bump', 'hgt', 'heightmap'] },
  { label: 'Specular',  keywords: ['specular', 'spec', 'spc'] },
  { label: 'Opacity',   keywords: ['opacity', 'alpha', 'transparency', 'transp'] },
  { label: 'Mask',      keywords: ['mask'] },
  { label: 'Cavity',    keywords: ['cavity', 'cav'] },
]

// Tokens that carry no naming value — strip from base name
const NOISE = new Set([
  'gl', 'dx', 'map', 'tex', 'texture', 'pack', 'packed',
  '512', '1024', '2048', '4096', '8192',
])

export function detectTexture(filename: string): TextureHint {
  const withoutExt = filename.replace(/\.[^.]+$/, '')
  const tokens = withoutExt.toLowerCase().split(/[_\-\s.]+/).filter(Boolean)

  // Strip common single-letter asset-type prefixes (Unreal: T_, M_, S_, etc.)
  const work = tokens.length > 1 && /^[a-z]$/.test(tokens[0]!) ? tokens.slice(1) : tokens

  // Find first matching map type
  let mapType: string | null = null
  const used = new Set<number>()

  outer: for (const { label, keywords } of MAP_TYPES) {
    for (let i = 0; i < work.length; i++) {
      if (keywords.includes(work[i]!)) {
        mapType = label
        used.add(i)
        break outer
      }
    }
  }

  // Build base name: remove matched type token, noise tokens, resolution tokens
  const baseTokens = work.filter((t, i) => {
    if (used.has(i)) return false
    if (NOISE.has(t)) return false
    if (/^\d+k$/i.test(t)) return false   // 2k, 4k, 8k, 16k
    return true
  })

  const base = baseTokens.join('_') || null
  // Source names only need to identify the map type, not the asset name
  const suggestedName = mapType ?? base ?? withoutExt

  return { mapType, suggestedName }
}
