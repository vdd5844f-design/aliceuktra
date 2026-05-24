import { ipcMain, app } from 'electron'
import * as fs from 'fs'
import * as path from 'path'

export interface AssetFrame {
  path: string
  name: string
}

export interface CharacterOutfit {
  name: string
  emotions: Record<string, AssetFrame[]>
}

export interface CharacterAsset {
  name: string
  mode: 'frame_animation' | 'static_expression'
  outfits: Record<string, CharacterOutfit>
  rootPath: string
}

// Emotion keyword mapping
const EMOTION_MAP: Record<string, string[]> = {
  idle:   ['idle', 'closed_smile', 'eyesclosed_smile', 'smile', 'normal', 'default'],
  talk:   ['talk', 'open', 'closed_open', 'mouth'],
  happy:  ['happy', 'smile_blush', 'blush', 'joy'],
  angry:  ['angry', 'frown_blush', 'frown', 'mad'],
  sleep:  ['sleep', 'eyesclosed', 'zzz', 'rest'],
  move:   ['move', 'walk', 'run', 'motion'],
}

function getEmotionForFile(filename: string): string {
  const lower = filename.toLowerCase()
  for (const [emotion, keywords] of Object.entries(EMOTION_MAP)) {
    if (keywords.some((k) => lower.includes(k))) return emotion
  }
  return 'idle'
}

function scanPngs(dir: string): string[] {
  if (!fs.existsSync(dir)) return []
  const results: string[] = []
  const items = fs.readdirSync(dir)
  for (const item of items) {
    const full = path.join(dir, item)
    const stat = fs.statSync(full)
    if (stat.isDirectory()) results.push(...scanPngs(full))
    else if (item.toLowerCase().endsWith('.png')) results.push(full)
  }
  return results
}

function scanAlice(aliceDir: string): CharacterAsset {
  const emotions: Record<string, AssetFrame[]> = { idle: [], talk: [], happy: [], angry: [], sleep: [], move: [] }
  const subDirs = ['idle', 'talk', 'happy', 'angry', 'sleep', 'move']

  const defaultOutfit: CharacterOutfit = { name: 'Varsayılan', emotions: {} }

  for (const emo of subDirs) {
    const emoDir = path.join(aliceDir, emo)
    if (fs.existsSync(emoDir)) {
      const files = fs.readdirSync(emoDir).filter((f) => f.toLowerCase().endsWith('.png')).sort()
      defaultOutfit.emotions[emo] = files.map((f) => ({ path: path.join(emoDir, f), name: f }))
    } else {
      defaultOutfit.emotions[emo] = []
    }
  }

  return {
    name: 'Alice',
    mode: 'frame_animation',
    outfits: { default: defaultOutfit },
    rootPath: aliceDir,
  }
}

function scanAiko(aikoDir: string): CharacterAsset {
  if (!fs.existsSync(aikoDir)) return { name: 'Aiko', mode: 'static_expression', outfits: {}, rootPath: aikoDir }

  const outfits: Record<string, CharacterOutfit> = {}

  const items = fs.readdirSync(aikoDir)
  for (const item of items) {
    const full = path.join(aikoDir, item)
    if (!fs.statSync(full).isDirectory()) continue

    const pngs = scanPngs(full)
    if (pngs.length === 0) continue

    const outfitKey = item.toLowerCase().replace(/\s+/g, '_')
    const outfit: CharacterOutfit = { name: item, emotions: { idle: [], talk: [], happy: [], angry: [], sleep: [], move: [] } }

    for (const pngPath of pngs) {
      const fname = path.basename(pngPath)
      const emo = getEmotionForFile(fname)
      if (!outfit.emotions[emo]) outfit.emotions[emo] = []
      outfit.emotions[emo].push({ path: pngPath, name: fname })
    }

    // If no emotion matches, put everything under idle
    const allEmpty = Object.values(outfit.emotions).every((arr) => arr.length === 0)
    if (allEmpty) {
      outfit.emotions['idle'] = pngs.map((p) => ({ path: p, name: path.basename(p) }))
    }

    outfits[outfitKey] = outfit
  }

  return {
    name: 'Aiko',
    mode: 'static_expression',
    outfits,
    rootPath: aikoDir,
  }
}

export function setupAssetsIpc() {
  ipcMain.handle('assets:scan', async (_event, assetsPath?: string) => {
    try {
      const base = assetsPath || path.join(app.getAppPath(), 'assets')
      const result: Record<string, CharacterAsset> = {}

      const aliceDir = path.join(base, 'alice')
      if (fs.existsSync(aliceDir)) {
        result['alice'] = scanAlice(aliceDir)
      }

      const aikoDir = path.join(base, 'aiko')
      if (fs.existsSync(aikoDir)) {
        result['aiko'] = scanAiko(aikoDir)
      }

      // Also scan any other character dirs
      if (fs.existsSync(base)) {
        const entries = fs.readdirSync(base)
        for (const entry of entries) {
          if (entry === 'alice' || entry === 'aiko') continue
          const full = path.join(base, entry)
          if (fs.statSync(full).isDirectory()) {
            const pngs = scanPngs(full)
            if (pngs.length > 0) {
              result[entry] = scanAlice(full)
              result[entry].name = entry.charAt(0).toUpperCase() + entry.slice(1)
            }
          }
        }
      }

      return { success: true, characters: result }
    } catch (err: unknown) {
      return { success: false, error: err instanceof Error ? err.message : String(err), characters: {} }
    }
  })

  ipcMain.handle('assets:getFrame', async (_event, framePath: string) => {
    try {
      if (!fs.existsSync(framePath)) return { success: false, data: null }
      const data = fs.readFileSync(framePath)
      const b64 = data.toString('base64')
      return { success: true, data: `data:image/png;base64,${b64}` }
    } catch (err: unknown) {
      return { success: false, data: null }
    }
  })
}
