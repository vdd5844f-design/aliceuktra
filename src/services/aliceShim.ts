// Browser preview shim — mocks window.alice when Electron preload is absent

import type { ScanResult, ScannedCharacter, ScannedOutfit, SpriteEntry, Emotion } from '../types'

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
  mockCharacter('alice', 'Alice'),
  mockCharacter('aiko', 'Aiko'),
  mockCharacter('drift', 'Drift'),
  mockCharacter('eve', 'Eve'),
  mockCharacter('ichiko', 'Ichiko'),
  mockCharacter('miho', 'Miho'),
  mockCharacter('natsumi', 'Natsumi'),
  mockCharacter('sumi', 'Sumi'),
]

const MOCK_SCAN: ScanResult = {
  assetsRoot: './assets (tarayici)',
  characters: MOCK_CHARS,
  totalPng: 96,
  errors: [],
}

let streamCb: ((token: string) => void) | null = null
const MOCK_REPLY = 'Merhaba! Ben Alice, yapay zeka arkadaşınım. Size nasıl yardımcı olabilirim?'

if (typeof window !== 'undefined' && !(window as unknown as Record<string, unknown>)['alice']) {
  ;(window as unknown as Record<string, unknown>)['alice'] = {
    assets: {
      scan: async () => MOCK_SCAN,
      getCharacters: async () => MOCK_CHARS,
      getOutfits: async (charId: string) => MOCK_CHARS.find(c => c.id === charId)?.outfits ?? [],
      getSprite: async (charId: string, outfitId: string, emotion: Emotion): Promise<SpriteEntry | null> => {
        const char = MOCK_CHARS.find(c => c.id === charId)
        const outfit = char?.outfits.find(o => o.id === outfitId)
        return outfit?.sprites[emotion]?.[0] ?? null
      },
      reload: async () => MOCK_SCAN,
      setAssetsRoot: async () => MOCK_SCAN,
      getRoot: async () => './assets',
    },
    ai: {
      chat: async () => {
        let i = 0
        const words = MOCK_REPLY.split(' ')
        const interval = setInterval(() => {
          if (i < words.length) {
            streamCb?.((i === 0 ? '' : ' ') + words[i++])
          } else {
            clearInterval(interval)
          }
        }, 80)
        return { done: true }
      },
      stop: async () => {},
      test: async () => ({ success: true }),
      onToken: (cb: (token: string) => void) => {
        streamCb = cb
        return () => { streamCb = null }
      },
    },
    voice: {
      speak: async () => {},
      stop: async () => {},
      listVoices: async () => [],
    },
    settings: {
      get: async () => ({}),
      set: async () => {},
    },
    window: {
      minimize: async () => {},
      maximize: async () => {},
      close: async () => {},
      setPetMode: async () => {},
      setAlwaysOnTop: async () => {},
    },
  }
}
