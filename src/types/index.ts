// ─────────────────────────────────────────────
// Core enums / unions
// ─────────────────────────────────────────────

export type Emotion =
  | 'idle' | 'happy' | 'talk' | 'angry' | 'sad' | 'sleep' | 'fear' | 'move'

export type Provider =
  | 'ollama' | 'openai' | 'anthropic' | 'gemini'
  | 'openrouter' | 'lmstudio' | 'openai-compatible'

export type SidebarTab =
  | 'sohbet' | 'karakter' | 'kiyafet'
  | 'ses' | 'hafiza' | 'ayarlar' | 'gelistirici'
  | 'model-studio'

// ─────────────────────────────────────────────
// Asset types — mirrored in electron/ipc/assets.ipc.ts
// ─────────────────────────────────────────────

export interface SpriteEntry {
  path: string
  fileUrl: string  // file:///... safe for Electron renderer <img src>
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
// Chat
// ─────────────────────────────────────────────

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  emotion?: Emotion
  timestamp: number
}

// ─────────────────────────────────────────────
// Settings — must match electron/ipc/settings.ipc.ts DEFAULT_SETTINGS shape
// ─────────────────────────────────────────────

export interface VoiceSettings {
  engine: string
  voiceName: string
  rate: string
  pitch: string
  volume: string
  autoSpeak: boolean
}

export interface AppSettings {
  provider: Provider
  baseUrl: string
  apiKey: string
  model: string
  temperature: number
  maxTokens: number
  persona: string
  voice: VoiceSettings
  window: {
    alwaysOnTop: boolean
  }
  assetsPath: string
}

// ─────────────────────────────────────────────
// Defaults
// ─────────────────────────────────────────────

export const DEFAULT_VOICE: VoiceSettings = {
  engine: 'edge-tts',
  voiceName: 'tr-TR-EmelNeural',
  rate: '-10%',
  pitch: '+6Hz',
  volume: '+8%',
  autoSpeak: false,
}

export const DEFAULT_SETTINGS: AppSettings = {
  provider: 'ollama',
  baseUrl: 'http://localhost:11434',
  apiKey: '',
  model: 'gemma3:4b',
  persona: 'Sen Alice, sevimli ve zeki bir yapay zeka arkadaşısın. Sadece Türkçe konuşuyorsun.',
  temperature: 0.8,
  maxTokens: 1024,
  voice: DEFAULT_VOICE,
  window: { alwaysOnTop: false },
  assetsPath: '',
}

// ─────────────────────────────────────────────
// Labels & lists
// ─────────────────────────────────────────────

export const EMOTION_LABELS: Record<Emotion, string> = {
  idle:  'Boşta',
  happy: 'Mutlu',
  talk:  'Konuşuyor',
  angry: 'Kızgın',
  sad:   'Üzgün',
  sleep: 'Uyku',
  fear:  'Korku',
  move:  'Hareket',
}

export const PROVIDERS: { value: Provider; label: string }[] = [
  { value: 'ollama',            label: 'Ollama (Yerel)' },
  { value: 'lmstudio',          label: 'LM Studio' },
  { value: 'openai-compatible', label: 'Uyumlu API' },
  { value: 'openai',            label: 'OpenAI' },
  { value: 'anthropic',         label: 'Anthropic' },
  { value: 'gemini',            label: 'Google Gemini' },
  { value: 'openrouter',        label: 'OpenRouter' },
]
