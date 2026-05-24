import { ipcMain, app } from 'electron'
import * as fs from 'fs'
import * as path from 'path'

// ─────────────────────────────────────────────
// Types (mirrored in src/types/index.ts)
// ─────────────────────────────────────────────
export type Emotion = 'idle' | 'happy' | 'talk' | 'angry' | 'sad' | 'sleep' | 'fear' | 'move'

export interface SpriteEntry {
  path: string
  fileUrl: string
  filename: string
}

export interface ScannedOutfit {
  id: string
  name: string
  packName: string
  characterId: string
  isCat: boolean
  mode: 'static' | 'frames'
  sprites: Record<Emotion, SpriteEntry[]>
  previewUrl: string | null
  totalPng: number
  emotions: Emotion[]
}

export interface ScannedCharacter {
  id: string
  name: string
  outfits: ScannedOutfit[]
  totalPng: number
  previewUrl: string | null
}

export interface ScanResult {
  assetsRoot: string
  characters: ScannedCharacter[]
  totalPng: number
  errors: string[]
}

// ─────────────────────────────────────────────
// Path utilities
// ─────────────────────────────────────────────

/**
 * Convert an absolute filesystem path to a file:// URL safe for Electron renderer.
 * Handles Windows backslashes and encodes special chars.
 */
function toFileUrl(absPath: string): string {
  // Normalise all backslashes to forward slashes
  const normalized = absPath.replace(/\\/g, '/')
  // On Windows a path like C:/... must become file:///C:/...
  // On Unix /home/... must become file:///home/...
  const withoutLeadingSlash = normalized.startsWith('/') ? normalized.slice(1) : normalized
  return 'file:///' + encodeURI(withoutLeadingSlash)
}

function makeSpriteEntry(absPath: string): SpriteEntry {
  return { path: absPath, fileUrl: toFileUrl(absPath), filename: path.basename(absPath) }
}

// ─────────────────────────────────────────────
// Filesystem helpers
// ─────────────────────────────────────────────

function safeReaddir(dir: string): string[] {
  try { return fs.readdirSync(dir) } catch { return [] }
}

function isPng(f: string): boolean {
  return f.toLowerCase().endsWith('.png')
}

function isDir(p: string): boolean {
  try { return fs.statSync(p).isDirectory() } catch { return false }
}

function collectPngs(dir: string, result: string[] = []): string[] {
  for (const entry of safeReaddir(dir)) {
    const full = path.join(dir, entry)
    if (isDir(full)) collectPngs(full, result)
    else if (isPng(entry)) result.push(full)
  }
  return result
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase()
}

function normalizeId(s: string): string {
  return s.toLowerCase()
    .replace(/[^a-z0-9]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '')
}

function prettyName(s: string): string {
  return s.replace(/[_-]+/g, ' ')
    .replace(/\b\w/g, c => c.toUpperCase())
    .trim()
}

// ─────────────────────────────────────────────
// Emotion mapping
// ─────────────────────────────────────────────

/**
 * Map a PNG filename to one of our canonical emotions.
 * Order matters — more specific patterns first.
 */
function mapFilenameToEmotion(filename: string): Emotion {
  const f = filename.toLowerCase().replace(/\.png$/, '')

  // fear
  if (/(frightened|terrified|character_frightened|character_terrified)/.test(f)) return 'fear'

  // angry
  if (/(character_mad|_mad\b|angry|_frown|frown_blush|_pout)/.test(f)) return 'angry'
  if (/\bmad\b/.test(f)) return 'angry'

  // sad
  if (/(character_sad|_sad\b|\bsad\b)/.test(f)) return 'sad'

  // sleep
  if (/(eyesclosed|eyes_closed|closedeyes|closed_frown|character_closedeyes|_asleep|closedsmile)/.test(f)) return 'sleep'
  if (/^closed$/.test(f)) return 'sleep'

  // happy
  if (/(character_happy|smile_blush|blush_smile)/.test(f)) return 'happy'
  if (/\bhappy\b/.test(f)) return 'happy'

  // talk (open mouth)
  if (/(closed_open|_open\b|shout|mouthopen|mouth_open)/.test(f)) return 'talk'
  if (/\bopen\b/.test(f)) return 'talk'

  // idle (smile / neutral)
  if (/(character_neutral|neutral|closed_smile|closedsmile|_smile\b|\bsmile\b)/.test(f)) return 'idle'

  // frame-based patterns like frame_0, frame_1 — use idle by default
  if (/frame_?\d+/.test(f)) return 'idle'

  return 'idle'
}

// ─────────────────────────────────────────────
// Outfit builders
// ─────────────────────────────────────────────

function emptySprites(): Record<Emotion, SpriteEntry[]> {
  return { idle: [], happy: [], talk: [], angry: [], sad: [], sleep: [], fear: [], move: [] }
}

function buildStaticOutfit(
  charId: string,
  outfitName: string,
  packName: string,
  pngs: string[],
  isCat: boolean,
): ScannedOutfit {
  const sprites = emptySprites()

  for (const p of pngs) {
    const emotion = mapFilenameToEmotion(path.basename(p))
    sprites[emotion].push(makeSpriteEntry(p))
  }

  // Sort each emotion bucket by filename (frame order, alphabetical)
  for (const key of Object.keys(sprites) as Emotion[]) {
    sprites[key].sort((a, b) => a.filename.localeCompare(b.filename))
  }

  const allEmotions = (Object.keys(sprites) as Emotion[]).filter(e => sprites[e].length > 0)
  const preview =
    sprites.idle[0] ?? sprites.happy[0] ??
    (allEmotions.length > 0 ? sprites[allEmotions[0]][0] : null)

  return {
    id: normalizeId(outfitName),
    name: prettyName(outfitName),
    packName,
    characterId: charId,
    isCat,
    mode: 'static',
    sprites,
    previewUrl: preview?.fileUrl ?? null,
    totalPng: pngs.length,
    emotions: allEmotions,
  }
}

/**
 * Build a frame-animated outfit from a normalized outfits/<id>/<emotion>/ directory tree.
 */
function buildFrameOutfit(charId: string, outfitId: string, outfitDir: string): ScannedOutfit | null {
  const sprites = emptySprites()
  let totalPng = 0

  for (const emotionDir of safeReaddir(outfitDir)) {
    const emotionPath = path.join(outfitDir, emotionDir)
    if (!isDir(emotionPath)) continue

    const emotionKey = emotionDir.toLowerCase() as Emotion
    if (!(emotionKey in sprites)) continue

    for (const f of safeReaddir(emotionPath)) {
      if (!isPng(f)) continue
      sprites[emotionKey].push(makeSpriteEntry(path.join(emotionPath, f)))
      totalPng++
    }

    // Sort numerically by the first number in filename (frame_0, frame_1 …)
    sprites[emotionKey].sort((a, b) => {
      const numA = parseInt(a.filename.match(/\d+/)?.[0] ?? '0', 10)
      const numB = parseInt(b.filename.match(/\d+/)?.[0] ?? '0', 10)
      return numA - numB
    })
  }

  if (totalPng === 0) return null

  const allEmotions = (Object.keys(sprites) as Emotion[]).filter(e => sprites[e].length > 0)
  const preview =
    sprites.idle[0] ?? sprites.happy[0] ??
    (allEmotions.length > 0 ? sprites[allEmotions[0]][0] : null)

  return {
    id: outfitId,
    name: prettyName(outfitId.replace(/_/g, ' ')),
    packName: 'normalized',
    characterId: charId,
    isCat: outfitId.includes('cat'),
    mode: 'frames',
    sprites,
    previewUrl: preview?.fileUrl ?? null,
    totalPng,
    emotions: allEmotions,
  }
}

// ─────────────────────────────────────────────
// Raw pack scanner (assets/<charId>/<Pack>/)
// ─────────────────────────────────────────────

const CAT_KEYWORDS = ['cat', '_cat_', 'neko']

function isCatPath(name: string): boolean {
  const l = name.toLowerCase()
  return CAT_KEYWORDS.some(k => l.includes(k))
}

/**
 * Scan a single raw character directory (e.g. assets/aiko/).
 * Handles:
 *   - Pack directory with PNGs directly inside (flat pack)
 *   - Pack directory with sub-directories per variant (Aiko_NoranekoGames/Casual)
 *   - Cat variants as separate outfits (inline _cat_ prefix OR subdir named "cat")
 */
function scanRawCharacterDir(charId: string, charDir: string): ScannedOutfit[] {
  const outfits: ScannedOutfit[] = []
  const seenIds = new Set<string>()

  function addOutfit(o: ScannedOutfit) {
    // Deduplicate by id — prefer whichever comes first
    if (seenIds.has(o.id)) return
    seenIds.add(o.id)
    outfits.push(o)
  }

  for (const packEntry of safeReaddir(charDir)) {
    const packPath = path.join(charDir, packEntry)
    if (!isDir(packPath)) continue

    const directPngs = safeReaddir(packPath).filter(f => isPng(f)).map(f => path.join(packPath, f))
    const subDirs = safeReaddir(packPath).filter(e => isDir(path.join(packPath, e)))

    if (directPngs.length > 0) {
      // ── Flat pack: PNG files are directly in the pack directory
      const nonCatPngs = directPngs.filter(p => !isCatPath(path.basename(p)))
      const catInlinePngs = directPngs.filter(p => isCatPath(path.basename(p)))

      if (nonCatPngs.length > 0) {
        addOutfit(buildStaticOutfit(charId, packEntry, packEntry, nonCatPngs, false))
      } else if (directPngs.length > 0) {
        addOutfit(buildStaticOutfit(charId, packEntry, packEntry, directPngs, false))
      }

      // Cat inline files as a separate variant
      if (catInlinePngs.length > 0) {
        addOutfit(buildStaticOutfit(charId, `${packEntry} Cat`, packEntry, catInlinePngs, true))
      }

      // Cat sub-directory
      const catSubDir = subDirs.find(d => isCatPath(d))
      if (catSubDir) {
        const catPath = path.join(packPath, catSubDir)
        const catPngs = safeReaddir(catPath).filter(f => isPng(f)).map(f => path.join(catPath, f))
        if (catPngs.length > 0) {
          addOutfit(buildStaticOutfit(charId, `${packEntry} Cat`, packEntry, catPngs, true))
        }
      }
    } else if (subDirs.length > 0) {
      // ── Nested pack: sub-directories contain variant PNGs
      for (const subEntry of subDirs) {
        const subLower = subEntry.toLowerCase()
        // Skip dedicated cat directories at this level — handled below per subEntry
        const subPath = path.join(packPath, subEntry)
        const subPngs = safeReaddir(subPath).filter(f => isPng(f)).map(f => path.join(subPath, f))

        if (subPngs.length === 0) continue

        const outfitLabel = `${packEntry} ${subEntry}`
        const isCatVariant = isCatPath(subEntry)
        const catInline = subPngs.filter(p => isCatPath(path.basename(p)))
        const nonCat = subPngs.filter(p => !isCatPath(path.basename(p)))

        if (nonCat.length > 0) {
          addOutfit(buildStaticOutfit(charId, outfitLabel, packEntry, nonCat, isCatVariant))
        } else {
          addOutfit(buildStaticOutfit(charId, outfitLabel, packEntry, subPngs, isCatVariant))
        }

        if (!isCatVariant && catInline.length > 0) {
          addOutfit(buildStaticOutfit(charId, `${outfitLabel} Cat`, packEntry, catInline, true))
        }

        // Cat sub-sub-directory
        const catSubSub = safeReaddir(subPath).find(
          e => isDir(path.join(subPath, e)) && isCatPath(e),
        )
        if (catSubSub) {
          const catSSPath = path.join(subPath, catSubSub)
          const catSSPngs = safeReaddir(catSSPath).filter(f => isPng(f)).map(f => path.join(catSSPath, f))
          if (catSSPngs.length > 0) {
            addOutfit(buildStaticOutfit(charId, `${outfitLabel} Cat`, packEntry, catSSPngs, true))
          }
        }
      }
    }
  }

  return outfits
}

// ─────────────────────────────────────────────
// Normalized structure scanner (assets/characters/<charId>/outfits/)
// ─────────────────────────────────────────────

function scanNormalizedCharacterDir(charId: string, charDir: string): ScannedOutfit[] {
  const outfitsDir = path.join(charDir, 'outfits')
  if (!isDir(outfitsDir)) return []

  const outfits: ScannedOutfit[] = []

  for (const outfitId of safeReaddir(outfitsDir)) {
    const outfitPath = path.join(outfitsDir, outfitId)
    if (!isDir(outfitPath)) continue

    const subDirs = safeReaddir(outfitPath).filter(e => isDir(path.join(outfitPath, e)))
    const EMOTION_NAMES = new Set(['idle', 'happy', 'talk', 'angry', 'sad', 'sleep', 'fear', 'move'])
    const hasEmotionDirs = subDirs.some(d => EMOTION_NAMES.has(d.toLowerCase()))

    if (hasEmotionDirs) {
      const outfit = buildFrameOutfit(charId, outfitId, outfitPath)
      if (outfit) outfits.push(outfit)
    } else {
      const pngs = collectPngs(outfitPath)
      if (pngs.length > 0) {
        outfits.push(buildStaticOutfit(charId, outfitId, 'normalized', pngs, false))
      }
    }
  }

  return outfits
}

// ─────────────────────────────────────────────
// Top-level scan
// ─────────────────────────────────────────────

const KNOWN_CHARS = ['aiko', 'alice', 'drift', 'eve', 'ichiko', 'miho', 'natsumi', 'sumi']

const CHAR_DISPLAY_NAMES: Record<string, string> = {
  alice:   'Alice',
  aiko:    'Aiko',
  drift:   'Drift',
  eve:     'Eve',
  ichiko:  'Ichiko',
  miho:    'Miho',
  natsumi: 'Natsumi',
  sumi:    'Sumi',
}

function scanAssetsRoot(assetsRoot: string): ScanResult {
  const errors: string[] = []
  const characterMap = new Map<string, ScannedCharacter>()

  function ensureChar(id: string): ScannedCharacter {
    if (!characterMap.has(id)) {
      characterMap.set(id, {
        id,
        name: CHAR_DISPLAY_NAMES[id] ?? capitalize(id),
        outfits: [],
        totalPng: 0,
        previewUrl: null,
      })
    }
    return characterMap.get(id)!
  }

  function mergeOutfits(char: ScannedCharacter, outfits: ScannedOutfit[]) {
    for (const o of outfits) {
      if (char.outfits.find(ex => ex.id === o.id)) continue
      char.outfits.push(o)
      char.totalPng += o.totalPng
    }
    if (!char.previewUrl && char.outfits.length > 0) {
      char.previewUrl = char.outfits[0].previewUrl
    }
  }

  // ── A) Scan raw pack structure: assets/<charId>/
  for (const entry of safeReaddir(assetsRoot)) {
    if (entry === 'characters') continue
    const entryPath = path.join(assetsRoot, entry)
    if (!isDir(entryPath)) continue
    const charId = entry.toLowerCase()
    if (!KNOWN_CHARS.includes(charId)) continue

    try {
      const outfits = scanRawCharacterDir(charId, entryPath)
      if (outfits.length === 0) continue
      mergeOutfits(ensureChar(charId), outfits)
    } catch (e) {
      errors.push(`[raw] ${entry}: ${String(e)}`)
    }
  }

  // ── B) Scan normalized structure: assets/characters/<charId>/outfits/
  const charsDir = path.join(assetsRoot, 'characters')
  if (isDir(charsDir)) {
    for (const entry of safeReaddir(charsDir)) {
      const charPath = path.join(charsDir, entry)
      if (!isDir(charPath)) continue
      const charId = entry.toLowerCase()

      try {
        const outfits = scanNormalizedCharacterDir(charId, charPath)
        if (outfits.length === 0) continue
        mergeOutfits(ensureChar(charId), outfits)
      } catch (e) {
        errors.push(`[norm] ${entry}: ${String(e)}`)
      }
    }
  }

  const characters = Array.from(characterMap.values())
    .filter(c => c.outfits.length > 0)
    // Sort by canonical order
    .sort((a, b) => KNOWN_CHARS.indexOf(a.id) - KNOWN_CHARS.indexOf(b.id))

  return {
    assetsRoot,
    characters,
    totalPng: characters.reduce((s, c) => s + c.totalPng, 0),
    errors,
  }
}

// ─────────────────────────────────────────────
// Assets root resolution
// ─────────────────────────────────────────────

function resolveAssetsRoot(userPath?: string): string {
  const candidates: string[] = []
  if (userPath) candidates.push(userPath)

  const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged

  if (isDev) {
    candidates.push(path.join(process.cwd(), 'assets'))
    candidates.push(path.join(app.getAppPath(), 'assets'))
  } else {
    candidates.push(path.join(process.resourcesPath, 'assets'))
    candidates.push(path.join(path.dirname(app.getPath('exe')), 'assets'))
    candidates.push(path.join(app.getAppPath(), 'assets'))
  }

  // Prefer first candidate that has at least one PNG
  for (const c of candidates) {
    if (isDir(c) && collectPngs(c).length > 0) return c
  }
  // Fall back to first existing directory
  for (const c of candidates) {
    if (isDir(c)) return c
  }
  return candidates[0] ?? path.join(process.cwd(), 'assets')
}

// ─────────────────────────────────────────────
// IPC state
// ─────────────────────────────────────────────

let _userAssetsPath: string | undefined
let _cachedResult: ScanResult | null = null

function getOrScan(): ScanResult {
  if (!_cachedResult) {
    const root = resolveAssetsRoot(_userAssetsPath)
    _cachedResult = scanAssetsRoot(root)
  }
  return _cachedResult
}

// ─────────────────────────────────────────────
// IPC registration
// ─────────────────────────────────────────────

/** Alias for main.ts import */
export const setupAssetsIpc = registerAssetsIpc

export function registerAssetsIpc() {
  ipcMain.handle('assets:scan', async () => {
    const root = resolveAssetsRoot(_userAssetsPath)
    _cachedResult = scanAssetsRoot(root)
    return _cachedResult
  })

  ipcMain.handle('assets:getCharacters', async () => {
    return getOrScan().characters
  })

  ipcMain.handle('assets:getOutfits', async (_e, characterId: string) => {
    return getOrScan().characters.find(c => c.id === characterId)?.outfits ?? []
  })

  ipcMain.handle('assets:getSprite', async (_e, characterId: string, outfitId: string, emotion: Emotion) => {
    const scan = getOrScan()
    const outfit = scan.characters.find(c => c.id === characterId)?.outfits.find(o => o.id === outfitId)
    if (!outfit) return null

    const list = outfit.sprites[emotion]
    if (list?.length) return list[0]

    // Fallback chain
    const fallback: Emotion[] = ['idle', 'happy', 'move', 'talk', 'angry', 'sad', 'sleep', 'fear']
    for (const fb of fallback) {
      const fbl = outfit.sprites[fb]
      if (fbl?.length) return fbl[0]
    }
    return null
  })

  ipcMain.handle('assets:reload', async () => {
    _cachedResult = null
    const root = resolveAssetsRoot(_userAssetsPath)
    _cachedResult = scanAssetsRoot(root)
    return _cachedResult
  })

  ipcMain.handle('assets:setAssetsRoot', async (_e, newPath: string) => {
    _userAssetsPath = newPath
    _cachedResult = null
    const root = resolveAssetsRoot(_userAssetsPath)
    _cachedResult = scanAssetsRoot(root)
    return _cachedResult
  })

  ipcMain.handle('assets:getRoot', async () => {
    return resolveAssetsRoot(_userAssetsPath)
  })
}
