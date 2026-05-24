/**
 * Browser shim for window.alice — used when running outside Electron (Vite dev preview).
 * Provides realistic mock data so the UI can be fully previewed in a browser.
 */

import type { AliceAPI, AppSettings, CharacterAsset } from '@/types'

const DEFAULT_SETTINGS: AppSettings = {
  provider: 'ollama',
  baseUrl: 'http://127.0.0.1:11434',
  apiKey: '',
  model: 'qwen2.5:3b',
  temperature: 0.7,
  maxTokens: 512,
  persona: 'Sen Alice AI Ultra adlı masaüstü yardımcı karakterisin.\nSadece Türkçe konuş. Kısa ve net cevap ver.',
  voice: { engine: 'edge-tts', voiceName: 'tr-TR-EmelNeural', rate: '-10%', pitch: '+6Hz', volume: '+8%', autoSpeak: false },
  window: { alwaysOnTop: false },
  assetsPath: '',
}

let storedSettings = { ...DEFAULT_SETTINGS }

const MOCK_CHARACTERS: Record<string, CharacterAsset> = {
  alice: {
    name: 'Alice',
    mode: 'frame_animation',
    rootPath: 'assets/alice',
    outfits: {
      default: {
        name: 'Varsayılan',
        emotions: {
          idle: [], talk: [], happy: [], angry: [], sleep: [], move: [],
        },
      },
    },
  },
}

export const aliceShim: AliceAPI = {
  window: {
    minimize: () => console.log('[alice-shim] window.minimize'),
    maximize: () => console.log('[alice-shim] window.maximize'),
    close: () => console.log('[alice-shim] window.close'),
  },
  ai: {
    chat: async (payload: unknown) => {
      const p = payload as { messages?: Array<{ content: string }> }
      const last = p.messages?.slice(-1)[0]?.content || ''
      await new Promise((r) => setTimeout(r, 900))
      const responses = [
        'Merhaba! Sana nasıl yardımcı olabilirim?',
        'Evet, anlıyorum. Devam edebiliriz.',
        'Bu konuda size yardımcı olabilirim.',
        'Tabii ki, hemen bakıyorum.',
        'İlginç bir soru. İşte cevabım:',
      ]
      return { success: true, content: responses[Math.floor(Math.random() * responses.length)] + ' ' + last.slice(0, 20) }
    },
    test: async () => {
      await new Promise((r) => setTimeout(r, 600))
      return { success: true }
    },
  },
  assets: {
    scan: async () => ({ success: true, characters: MOCK_CHARACTERS }),
    getFrame: async () => ({ success: false, data: null }),
  },
  voice: {
    speak: async () => {
      await new Promise((r) => setTimeout(r, 1200))
      return { success: true }
    },
    stop: () => {},
    onDone: (cb) => { setTimeout(cb, 1500) },
    onError: () => {},
  },
  settings: {
    get: async () => ({ ...storedSettings }),
    set: async (data) => {
      storedSettings = { ...storedSettings, ...data } as AppSettings
      return storedSettings
    },
  },
  pet: {
    open: () => console.log('[alice-shim] pet.open'),
    close: () => console.log('[alice-shim] pet.close'),
    move: (x, y) => console.log(`[alice-shim] pet.move ${x},${y}`),
    alwaysOnTop: (v) => console.log(`[alice-shim] pet.alwaysOnTop ${v}`),
  },
  studio: {
    open: () => console.log('[alice-shim] studio.open'),
  },
}

// Install shim if not in Electron
if (typeof window !== 'undefined' && !(window as unknown as { alice?: AliceAPI }).alice) {
  ;(window as unknown as { alice: AliceAPI }).alice = aliceShim
}
