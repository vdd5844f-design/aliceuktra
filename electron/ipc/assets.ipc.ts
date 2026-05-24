import { ipcMain, app } from 'electron'
import * as fs from 'fs'
import * as path from 'path'

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

function toFileUrl(absPath: string): string {
  const normalized = absPath.replace(/\\/g, '/')
  return 'file:///' + encodeURI(normalized.replace(/^\//, ''))
}

function makeSpriteEntry(absPath: string): SpriteEntry {
  return { path: absPath, fileUrl: toFileUrl(absPath), filename: path.basename(absPath) }
}

function safeReaddir(dir: string): string[] {
  try { return fs.readdirSync(dir) } catch { return [] }
}

function isPng(f: string): boolean { return f.toLowerCase().endsWith('.png') }

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

function capitalize(s: string): string { return s.charAt(0).toUpperCase() + s.slice(1) }

function normalizeId(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]/g, '_').replace(/_+/g, '_').replace(/^_|_$/g, '')
}

function prettyName(s: string): string {
  return s.replace(/[_-]+/g, ' ').replace(/\b\w/g, c => c.toUpperCase()).trim()
}

function mapFilenameToEmotion(filename: string): Emotion {
  const lower = filename.toLowerCase()
  if (['frightened', 'terrified'].some(k => lower.includes(k))) return 'fear'
  if (['character_happy', 'happy'].some(k => lower.includes(k))) return 'happy'
  if (['character_sad', '_sad'].some(k => lower.includes(k))) return 'sad'
  if (['character_mad', '_mad', 'angry', '_frown', '_pout'].some(k => lower.includes(k))) return 'angry'
  if (['eyesclosed', 'closed_frown', 'closedsmile', 'character_closedeyes'].some(k => lower.includes(k))) return 'sleep'
  if (['_open', 'shout', 'mouthopen', 'closed_open'].some(k => lower.includes(k))) return 'talk'
  if (['_smile', 'neutral', 'character_neutral', 'closed_smile'].some(k => lower.includes(k))) return 'idle'
  return 'idle'
}

function buildStaticOutfit(charId: string, outfitName: string, packName: string, pngs: string[], isCat: boolean): ScannedOutfit {
  const sprites: Record<Emotion, SpriteEntry[]> = { idle: [], happy: [], talk: [], angry: [], sad: [], sleep: [], fear: [], move: [] }
  for (const p of pngs) {
    const emotion = mapFilenameToEmotion(path.basename(p))
    sprites[emotion].push(makeSpriteEntry(p))
  }
  const allEmotions = (Object.keys(sprites) as Emotion[]).filter(e => sprites[e].length > 0)
  const preview = sprites.idle[0] ?? sprites.happy[0] ?? (allEmotions.length > 0 ? sprites[allEmotions[0]][0] : null)
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

function buildFrameOutfit(charId: string, outfitId: string, outfitDir: string): ScannedOutfit | null {
  const sprites: Record<Emotion, SpriteEntry[]> = { idle: [], happy: [], talk: [], angry: [], sad: [], sleep: [], fear: [], move: [] }
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
    sprites[emotionKey].sort((a, b) => {
      const numA = parseInt(a.filename.match(/\d+/)?.[0] ?? '0')
      const numB = parseInt(b.filename.match(/\d+/)?.[0] ?? '0')
      return numA - numB
    })
  }
  if (totalPng === 0) return null
  const allEmotions = (Object.keys(sprites) as Emotion[]).filter(e => sprites[e].length > 0)
  const preview = sprites.idle[0] ?? sprites.happy[0] ?? (allEmotions.length > 0 ? sprites[allEmotions[0]][0] : null)
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

const KNOWN_CHARS = ['aiko', 'alice', 'drift', 'eve', 'ichiko', 'miho', 'natsumi', 'sumi']

function scanRawCharacterDir(charId: string, charDir: string): ScannedOutfit[] {
  const outfits: ScannedOutfit[] = []
  for (const packEntry of safeReaddir(charDir)) {
    const packPath = path.join(charDir, packEntry)
    if (!isDir(packPath)) continue
    const pngsInPack = safeReaddir(packPath).filter(f => isPng(f)).map(f => path.join(packPath, f))
    const subDirs = safeReaddir(packPath).filter(e => isDir(path.join(packPath, e)))
    if (pngsInPack.length > 0) {
      const catDir = subDirs.find(d => d.toLowerCase().includes('cat'))
      const nonCatPngs = pngsInPack.filter(p => !path.basename(p).toLowerCase().includes('_cat_'))
      const catInline = pngsInPack.filter(p => path.basename(p).toLowerCase().includes('_cat_'))
      if (nonCatPngs.length > 0) {
        outfits.push(buildStaticOutfit(charId, packEntry, packEntry, nonCatPngs, false))
      } else {
        outfits.push(buildStaticOutfit(charId, packEntry, packEntry, pngsInPack, false))
      }
      if (catDir) {
        const catPath = path.join(packPath, catDir)
        const catPngs = safeReaddir(catPath).filter(f => isPng(f)).map(f => path.join(catPath, f))
        if (catPngs.length > 0) outfits.push(buildStaticOutfit(charId, `${packEntry} Cat`, packEntry, catPngs, true))
      } else if (catInline.length > 0) {
        outfits.push(buildStaticOutfit(charId, `${packEntry} Cat`, packEntry, catInline, true))
      }
    } else if (subDirs.length > 0) {
      for (const subEntry of subDirs) {
        const lowerSub = subEntry.toLowerCase()
        if (lowerSub === 'cat' || lowerSub === 'cat version') continue
        const subPath = path.join(packPath, subEntry)
        const subPngs = safeReaddir(subPath).filter(f => isPng(f)).map(f => path.join(subPath, f))
        if (subPngs.length === 0) continue
        const outfitLabel = `${packEntry} ${subEntry}`
        const catInline = subPngs.filter(p => path.basename(p).toLowerCase().includes('_cat_'))
        const nonCat = subPngs.filter(p => !path.basename(p).toLowerCase().includes('_cat_'))
        if (nonCat.length > 0) outfits.push(buildStaticOutfit(charId, outfitLabel, packEntry, nonCat, false))
        else outfits.push(buildStaticOutfit(charId, outfitLabel, packEntry, subPngs, false))
        if (catInline.length > 0) outfits.push(buildStaticOutfit(charId, `${outfitLabel} Cat`, packEntry, catInline, true))
        const catSubDir = safeReaddir(subPath).find(e => isDir(path.join(subPath, e)) && e.toLowerCase().includes('cat'))
        if (catSubDir) {
          const catSubPath = path.join(subPath, catSubDir)
          const catSubPngs = safeReaddir(catSubPath).filter(f => isPng(f)).map(f => path.join(catSubPath, f))
          if (catSubPngs.length > 0) outfits.push(buildStaticOutfit(charId, `${outfitLabel} Cat`, packEntry, catSubPngs, true))
        }
      }
    }
  }
  return outfits
}

function scanNormalizedCharacterDir(charId: string, charDir: string): ScannedOutfit[] {
  const outfitsDir = path.join(charDir, 'outfits')
  if (!isDir(outfitsDir)) return []
  const outfits: ScannedOutfit[] = []
  for (const outfitId of safeReaddir(outfitsDir)) {
    const outfitPath = path.join(outfitsDir, outfitId)
    if (!isDir(outfitPath)) continue
    const subDirs = safeReaddir(outfitPath).filter(e => isDir(path.join(outfitPath, e)))
    const hasEmotionDirs = subDirs.some(d => ['idle','happy','talk','angry','sad','sleep','fear','move'].includes(d.toLowerCase()))
    if (hasEmotionDirs) {
      const outfit = buildFrameOutfit(charId, outfitId, outfitPath)
      if (outfit) outfits.push(outfit)
    } else {
      const pngs = collectPngs(outfitPath)
      if (pngs.length > 0) outfits.push(buildStaticOutfit(charId, outfitId, 'normalized', pngs, false))
    }
  }
  return outfits
}

function scanAssetsRoot(assetsRoot: string): ScanResult {
  const errors: string[] = []
  const characterMap = new Map<string, ScannedCharacter>()
  function ensureChar(id: string): ScannedCharacter {
    if (!characterMap.has(id)) characterMap.set(id, { id, name: capitalize(id), outfits: [], totalPng: 0, previewUrl: null })
    return characterMap.get(id)!
  }
  for (const entry of safeReaddir(assetsRoot)) {
    const entryPath = path.join(assetsRoot, entry)
    const lower = entry.toLowerCase()
    if (lower === 'characters') continue
    if (!isDir(entryPath) || !KNOWN_CHARS.includes(lower)) continue
    const outfits = scanRawCharacterDir(lower, entryPath)
    if (outfits.length === 0) continue
    const char = ensureChar(lower)
    for (const o of outfits) {
      if (!char.outfits.find(ex => ex.id === o.id)) { char.outfits.push(o); char.totalPng += o.totalPng }
    }
    if (!char.previewUrl) char.previewUrl = outfits[0]?.previewUrl ?? null
  }
  const charsDir = path.join(assetsRoot, 'characters')
  if (isDir(charsDir)) {
    for (const entry of safeReaddir(charsDir)) {
      const charPath = path.join(charsDir, entry)
      const charId = entry.toLowerCase()
      if (!isDir(charPath)) continue
      const outfits = scanNormalizedCharacterDir(charId, charPath)
      if (outfits.length === 0) continue
      const char = ensureChar(charId)
      for (const o of outfits) {
        if (!char.outfits.find(ex => ex.id === o.id)) { char.outfits.push(o); char.totalPng += o.totalPng }
      }
      if (!char.previewUrl) char.previewUrl = outfits[0]?.previewUrl ?? null
    }
  }
  const characters = Array.from(characterMap.values()).filter(c => c.outfits.length > 0)
  return { assetsRoot, characters, totalPng: characters.reduce((s, c) => s + c.totalPng, 0), errors }
}

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
  for (const c of candidates) {
    if (isDir(c) && collectPngs(c).length > 0) return c
  }
  for (const c of candidates) { if (isDir(c)) return c }
  return candidates[0] ?? path.join(process.cwd(), 'assets')
}

let _userAssetsPath: string | undefined
let _cachedResult: ScanResult | null = null

/** Alias used by main.ts */
export const setupAssetsIpc = registerAssetsIpc

export function registerAssetsIpc() {
  ipcMain.handle('assets:scan', async () => {
    const root = resolveAssetsRoot(_userAssetsPath)
    _cachedResult = scanAssetsRoot(root)
    return _cachedResult
  })
  ipcMain.handle('assets:getCharacters', async () => {
    if (!_cachedResult) { const root = resolveAssetsRoot(_userAssetsPath); _cachedResult = scanAssetsRoot(root) }
    return _cachedResult.characters
  })
  ipcMain.handle('assets:getOutfits', async (_e, characterId: string) => {
    if (!_cachedResult) { const root = resolveAssetsRoot(_userAssetsPath); _cachedResult = scanAssetsRoot(root) }
    return _cachedResult.characters.find(c => c.id === characterId)?.outfits ?? []
  })
  ipcMain.handle('assets:getSprite', async (_e, characterId: string, outfitId: string, emotion: Emotion) => {
    if (!_cachedResult) { const root = resolveAssetsRoot(_userAssetsPath); _cachedResult = scanAssetsRoot(root) }
    const outfit = _cachedResult.characters.find(c => c.id === characterId)?.outfits.find(o => o.id === outfitId)
    if (!outfit) return null
    const list = outfit.sprites[emotion]
    if (list?.length) return list[0]
    const fallback: Emotion[] = ['idle', 'happy', 'move', 'talk', 'angry', 'sad', 'sleep', 'fear']
    for (const fb of fallback) { const fbl = outfit.sprites[fb]; if (fbl?.length) return fbl[0] }
    return null
  })
  ipcMain.handle('assets:reload', async () => {
    _cachedResult = null
    const root = resolveAssetsRoot(_userAssetsPath)
    _cachedResult = scanAssetsRoot(root)
    return _cachedResult
  })
  ipcMain.handle('assets:setAssetsRoot', async (_e, newPath: string) => {
    _userAssetsPath = newPath; _cachedResult = null
    const root = resolveAssetsRoot(_userAssetsPath)
    _cachedResult = scanAssetsRoot(root)
    return _cachedResult
  })
  ipcMain.handle('assets:getRoot', async () => resolveAssetsRoot(_userAssetsPath))
}
