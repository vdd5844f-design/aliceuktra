/**
 * aliceShim.ts
 *
 * Browser-preview shim — installs window.alice when Electron preload is absent.
 * The API surface mirrors preload.ts exactly so renderer code works in both contexts.
 */

import type {
  ScanResult, ScannedCharacter, ScannedOutfit, SpriteEntry, Emotion,
} from '../types'
import { DEFAULT_SETTINGS } from '../types'

// ── SpeakPayload — mirrors preload.ts / voice.ipc.ts
interface SpeakPayload {
  text: string
  voice: string
  rate: string
  pitch: string
  volume: string
}

// ─────────────────────────────────────────────
// Mock asset data helpers
// ─────────────────────────────────────────────

const MOCK_EMOTIONS: Emotion[] = ['idle', 'happy', 'talk', 'angry', 'sad', 'sleep']

function emptySprites(): Record<Emotion, SpriteEntry[]> {
  return { idle: [], happy: [], talk: [], angry: [], sad: [], sleep: [], fear: [], move: [] }
}

function mockEntry(fileUrl: string, filename: string): SpriteEntry {
  return { path: '', fileUrl, filename }
}

function mockOutfit(id: string, name: string, charId: string, preview = '/alice.jpg'): ScannedOutfit {
  const sprites = emptySprites()
  for (const e of MOCK_EMOTIONS) {
    sprites[e] = [mockEntry(preview, 'mock.png')]
  }
  return {
    id,
    name,
    packName: 'demo',
    characterId: charId,
    isCat: false,
    mode: 'static',
    sprites,
    previewUrl: preview,
    totalPng: MOCK_EMOTIONS.length,
    emotions: MOCK_EMOTIONS,
  }
}

function mockCharacter(id: string, name: string, preview = '/alice.jpg'): ScannedCharacter {
  const outfits: ScannedOutfit[] = [
    mockOutfit(`${id}_casual`,  'Günlük',   id, preview),
    mockOutfit(`${id}_uniform`, 'Üniforma', id, preview),
  ]
  return {
    id,
    name,
    outfits,
    totalPng: outfits.reduce((s, o) => s + o.totalPng, 0),
    previewUrl: preview,
  }
}

const MOCK_CHARS: ScannedCharacter[] = [
  mockCharacter('alice',   'Alice',   '/alice.jpg'),
  mockCharacter('aiko',    'Aiko',    '/alice.jpg'),
  mockCharacter('drift',   'Drift',   '/alice.jpg'),
  mockCharacter('eve',     'Eve',     '/alice.jpg'),
  mockCharacter('ichiko',  'Ichiko',  '/alice.jpg'),
  mockCharacter('miho',    'Miho',    '/alice.jpg'),
  mockCharacter('natsumi', 'Natsumi', '/alice.jpg'),
  mockCharacter('sumi',    'Sumi',    '/alice.jpg'),
]

const MOCK_SCAN: ScanResult = {
  assetsRoot: './assets (tarayıcı önizlemesi)',
  characters: MOCK_CHARS,
  totalPng: MOCK_CHARS.reduce((s, c) => s + c.totalPng, 0),
  errors: [],
}

// ── Mock AI streaming
const MOCK_REPLY = 'Merhaba! Ben Alice, yapay zeka arkadaşınım. Size nasıl yardımcı olabilirim?'
let _streamCb: ((token: string) => void) | null = null

// ── Voice event callback lists
const _doneListeners:  Array<() => void> = []
const _errorListeners: Array<(msg: string) => void> = []

// ─────────────────────────────────────────────
// Install shim only in browser (no Electron preload)
// ─────────────────────────────────────────────
if (typeof window !== 'undefined' && !(window as unknown as Record<string, unknown>)['alice']) {
  ;(window as unknown as Record<string, unknown>)['alice'] = {

    // ── assets
    assets: {
      scan: async (): Promise<ScanResult> => MOCK_SCAN,
      getCharacters: async (): Promise<ScannedCharacter[]> => MOCK_CHARS,
      getOutfits: async (charId: string): Promise<ScannedOutfit[]> =>
        MOCK_CHARS.find(c => c.id === charId)?.outfits ?? [],
      getSprite: async (charId: string, outfitId: string, emotion: Emotion): Promise<SpriteEntry | null> => {
        const char   = MOCK_CHARS.find(c => c.id === charId)
        const outfit = char?.outfits.find(o => o.id === outfitId)
        return outfit?.sprites[emotion]?.[0] ?? null
      },
      reload:        async (): Promise<ScanResult>  => MOCK_SCAN,
      setAssetsRoot: async (): Promise<ScanResult>  => MOCK_SCAN,
      getRoot:       async (): Promise<string>      => './assets',
    },

    // ── ai
    ai: {
      chat: async (): Promise<{ done: boolean }> => {
        const words = MOCK_REPLY.split(' ')
        let i = 0
        return new Promise(resolve => {
          const interval = setInterval(() => {
            if (i < words.length) {
              _streamCb?.((i === 0 ? '' : ' ') + words[i++])
            } else {
              clearInterval(interval)
              resolve({ done: true })
            }
          }, 80)
        })
      },
      stop: async (): Promise<void> => {},
      test: async (): Promise<{ success: boolean }> => ({ success: true }),
      onToken: (cb: (token: string) => void): (() => void) => {
        _streamCb = cb
        return () => { _streamCb = null }
      },
    },

    // ── voice — matches preload.ts surface exactly
    voice: {
      speak: async (_payload: SpeakPayload): Promise<void> => {
        // Simulate speech duration then fire done
        setTimeout(() => { _doneListeners.forEach(fn => fn()) }, 800)
      },
      stop: (): void => {},
      listVoices: async (): Promise<string[]> => ['tr-TR-EmelNeural', 'tr-TR-AhmetNeural'],
      onDone: (cb: () => void): (() => void) => {
        _doneListeners.push(cb)
        return () => {
          const i = _doneListeners.indexOf(cb)
          if (i !== -1) _doneListeners.splice(i, 1)
        }
      },
      onError: (cb: (msg: string) => void): (() => void) => {
        _errorListeners.push(cb)
        return () => {
          const i = _errorListeners.indexOf(cb)
          if (i !== -1) _errorListeners.splice(i, 1)
        }
      },
    },

    // ── settings
    settings: {
      get: async (): Promise<Record<string, unknown>> =>
        DEFAULT_SETTINGS as unknown as Record<string, unknown>,
      set: async (): Promise<void> => {},
    },

    // ── window — fire-and-forget (ipcMain.on) in real Electron, no-ops here
    window: {
      minimize:       (): void => {},
      maximize:       (): void => {},
      close:          (): void => {},
      setPetMode:     (_enabled: boolean): void => {},
      setAlwaysOnTop: (_val: boolean): void => {},
    },

    // ── pet window
    pet: {
      open:  (): void => {},
      close: (): void => {},
      move:  (_x: number, _y: number): void => {},
    },
  }
}
