/**
 * aliceShim.ts
 *
 * Browser-preview shim — installs window.alice when Electron preload is absent.
 * The surface mirrors preload.ts exactly so renderer code works in both contexts.
 */

import type { ScanResult, ScannedCharacter, ScannedOutfit, SpriteEntry, Emotion } from '../types'

// ── SpeakPayload — mirrors preload.ts / voice.ipc.ts
interface SpeakPayload {
  text: string
  voice: string
  rate: string
  pitch: string
  volume: string
}

// ── Mock data helpers

const MOCK_EMOTIONS: Emotion[] = ['idle', 'happy', 'talk', 'angry', 'sad', 'sleep']

function mockOutfit(id: string, name: string, charId: string): ScannedOutfit {
  const sprites: Record<Emotion, SpriteEntry[]> = {
    idle: [], happy: [], talk: [], angry: [], sad: [], sleep: [], fear: [], move: [],
  }
  for (const e of MOCK_EMOTIONS) {
    sprites[e] = [{ path: '', fileUrl: '/alice.jpg', filename: 'mock.png' }]
  }
  return {
    id, name, packName: 'demo', characterId: charId,
    isCat: false, mode: 'static', sprites,
    previewUrl: '/alice.jpg', totalPng: 6,
    emotions: MOCK_EMOTIONS,
  }
}

function mockCharacter(id: string, name: string): ScannedCharacter {
  return {
    id, name,
    outfits: [
      mockOutfit('casual', 'Günlük', id),
      mockOutfit('uniform', 'Üniforma', id),
    ],
    totalPng: 12,
    previewUrl: '/alice.jpg',
  }
}

const MOCK_CHARS: ScannedCharacter[] = [
  mockCharacter('alice',   'Alice'),
  mockCharacter('aiko',    'Aiko'),
  mockCharacter('drift',   'Drift'),
  mockCharacter('eve',     'Eve'),
  mockCharacter('ichiko',  'Ichiko'),
  mockCharacter('miho',    'Miho'),
  mockCharacter('natsumi', 'Natsumi'),
  mockCharacter('sumi',    'Sumi'),
]

const MOCK_SCAN: ScanResult = {
  assetsRoot: './assets (tarayıcı)',
  characters: MOCK_CHARS,
  totalPng: 96,
  errors: [],
}

// ── Mock AI stream
const MOCK_REPLY = 'Merhaba! Ben Alice, yapay zeka arkadaşınım. Size nasıl yardımcı olabilirim?'
let _streamCb: ((token: string) => void) | null = null

// ── Voice event callbacks (onDone / onError) — fire-and-forget mocks
const _doneListeners:  Array<() => void> = []
const _errorListeners: Array<(msg: string) => void> = []

// ── Install shim only in browser (no Electron preload)
if (typeof window !== 'undefined' && !(window as unknown as Record<string, unknown>)['alice']) {
  ;(window as unknown as Record<string, unknown>)['alice'] = {
    // ── assets
    assets: {
      scan:          async (): Promise<ScanResult>                => MOCK_SCAN,
      getCharacters: async (): Promise<ScannedCharacter[]>        => MOCK_CHARS,
      getOutfits:    async (charId: string): Promise<ScannedOutfit[]> =>
        MOCK_CHARS.find(c => c.id === charId)?.outfits ?? [],
      getSprite:     async (charId: string, outfitId: string, emotion: Emotion): Promise<SpriteEntry | null> => {
        const char   = MOCK_CHARS.find(c => c.id === charId)
        const outfit = char?.outfits.find(o => o.id === outfitId)
        return outfit?.sprites[emotion]?.[0] ?? null
      },
      reload:        async (): Promise<ScanResult>                => MOCK_SCAN,
      setAssetsRoot: async (): Promise<ScanResult>                => MOCK_SCAN,
      getRoot:       async (): Promise<string>                    => './assets',
    },

    // ── ai
    ai: {
      chat: async (): Promise<{ done: boolean }> => {
        let i = 0
        const words = MOCK_REPLY.split(' ')
        const interval = setInterval(() => {
          if (i < words.length) {
            _streamCb?.((i === 0 ? '' : ' ') + words[i++])
          } else {
            clearInterval(interval)
          }
        }, 80)
        return { done: true }
      },
      stop: async (): Promise<void> => {},
      test: async (): Promise<{ success: boolean }> => ({ success: true }),
      onToken: (cb: (token: string) => void): (() => void) => {
        _streamCb = cb
        return () => { _streamCb = null }
      },
    },

    // ── voice — matches preload surface exactly
    voice: {
      speak:      async (_payload: SpeakPayload): Promise<void>  => {},
      stop:       (): void                                        => {},
      listVoices: async (): Promise<string[]>                    => [],
      onDone:  (cb: () => void): (() => void) => {
        _doneListeners.push(cb)
        return () => {
          const idx = _doneListeners.indexOf(cb)
          if (idx !== -1) _doneListeners.splice(idx, 1)
        }
      },
      onError: (cb: (msg: string) => void): (() => void) => {
        _errorListeners.push(cb)
        return () => {
          const idx = _errorListeners.indexOf(cb)
          if (idx !== -1) _errorListeners.splice(idx, 1)
        }
      },
    },

    // ── settings
    settings: {
      get: async (): Promise<Record<string, unknown>> => ({}),
      set: async (): Promise<void>                    => {},
    },

    // ── window — fire-and-forget in real Electron, no-ops here
    window: {
      minimize:      (): void => {},
      maximize:      (): void => {},
      close:         (): void => {},
      setPetMode:    (_enabled: boolean): void => {},
      setAlwaysOnTop:(_val: boolean): void     => {},
    },

    // ── pet window
    pet: {
      open:  (): void => {},
      close: (): void => {},
      move:  (_x: number, _y: number): void => {},
    },
  }
}
