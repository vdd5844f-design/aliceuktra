export type Emotion = 'idle' | 'happy' | 'talk' | 'angry' | 'sad' | 'sleep' | 'fear' | 'move'
export type Provider = 'ollama' | 'openai' | 'anthropic' | 'gemini' | 'openrouter' | 'lmstudio'
export type SidebarTab = 'sohbet' | 'karakter' | 'kiyafet' | 'ses' | 'hafiza' | 'ayarlar' | 'gelistirici'

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

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  emotion?: Emotion
  timestamp: number
}

export interface AppSettings {
  provider: Provider
  baseUrl: string
  apiKey: string
  model: string
  systemPrompt: string
  temperature: number
  maxTokens: number
  voice: string
  voiceEnabled: boolean
  alwaysOnTop: boolean
  assetsRoot: string
}

export const DEFAULT_SETTINGS: AppSettings = {
  provider: 'ollama',
  baseUrl: 'http://localhost:11434',
  apiKey: '',
  model: 'gemma3:4b',
  systemPrompt: 'Sen Alice, sevimli ve zeki bir yapay zeka arkadaşısın. Türkçe konuşuyorsun.',
  temperature: 0.8,
  maxTokens: 1024,
  voice: 'tr-TR-EmelNeural',
  voiceEnabled: false,
  alwaysOnTop: false,
  assetsRoot: '',
}

export const EMOTION_LABELS: Record<Emotion, string> = {
  idle: 'Boşta',
  happy: 'Mutlu',
  talk: 'Konuşuyor',
  angry: 'Kızgın',
  sad: 'Üzgün',
  sleep: 'Uyku',
  fear: 'Korku',
  move: 'Hareket',
}

export const PROVIDERS: { value: Provider; label: string }[] = [
  { value: 'ollama', label: 'Ollama (Yerel)' },
  { value: 'lmstudio', label: 'LM Studio' },
  { value: 'openai', label: 'OpenAI' },
  { value: 'anthropic', label: 'Anthropic' },
  { value: 'gemini', label: 'Google Gemini' },
  { value: 'openrouter', label: 'OpenRouter' },
]
