export type Emotion = 'idle' | 'talk' | 'happy' | 'angry' | 'sleep' | 'move'
export type Provider = 'ollama' | 'openai' | 'anthropic' | 'gemini' | 'openrouter' | 'openai-compatible'
export type SidebarTab = 'sohbet' | 'karakter' | 'kiyafet' | 'duygu' | 'ses' | 'hafiza' | 'gelistirici'

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: number
}

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
  window: { alwaysOnTop: boolean }
  assetsPath: string
}

export interface AliceAPI {
  window: {
    minimize(): void
    maximize(): void
    close(): void
  }
  ai: {
    chat(payload: unknown): Promise<{ success: boolean; content: string }>
    test(payload: unknown): Promise<{ success: boolean; error?: string }>
  }
  assets: {
    scan(path?: string): Promise<{ success: boolean; characters: Record<string, CharacterAsset>; error?: string }>
    getFrame(path: string): Promise<{ success: boolean; data: string | null }>
  }
  voice: {
    speak(payload: { text: string; voice: string; rate: string; pitch: string; volume: string }): Promise<{ success: boolean; error?: string }>
    stop(): void
    onDone(cb: () => void): void
    onError(cb: (err: string) => void): void
  }
  settings: {
    get(): Promise<AppSettings>
    set(data: Partial<AppSettings>): Promise<AppSettings>
  }
  pet: {
    open(): void
    close(): void
    move(x: number, y: number): void
    alwaysOnTop(val: boolean): void
  }
  studio: {
    open(): void
  }
}

declare global {
  interface Window {
    alice: AliceAPI
  }
}
