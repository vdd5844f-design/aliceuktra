import { create } from 'zustand'
import type { Emotion, SidebarTab, ChatMessage, CharacterAsset, AppSettings, Provider } from '@/types'

const DEFAULT_SETTINGS: AppSettings = {
  provider: 'ollama',
  baseUrl: 'http://127.0.0.1:11434',
  apiKey: '',
  model: 'qwen2.5:3b',
  temperature: 0.7,
  maxTokens: 512,
  persona: 'Sen Alice AI Ultra adlı masaüstü yardımcı karakterisin.\n\nKurallar:\n- Sadece Türkçe konuş.\n- Kısa, net ve profesyonel cevap ver.\n- Bilmediğin şeyi uydurma.\n- Gereksiz emoji kullanma.\n- Cevaplarını 1-3 cümle ile sınırla.',
  voice: {
    engine: 'edge-tts',
    voiceName: 'tr-TR-EmelNeural',
    rate: '-10%',
    pitch: '+6Hz',
    volume: '+8%',
    autoSpeak: false,
  },
  window: { alwaysOnTop: false },
  assetsPath: '',
}

interface AppState {
  // UI
  activeTab: SidebarTab
  petModeOpen: boolean
  connectionStatus: 'unknown' | 'connected' | 'disconnected' | 'testing'
  isLoading: boolean
  fps: number

  // Character
  activeCharacter: string
  activeOutfit: string
  emotion: Emotion
  isTalking: boolean
  characters: Record<string, CharacterAsset>
  currentFrame: string

  // Chat
  messages: ChatMessage[]
  isStreaming: boolean
  inputText: string

  // Settings
  settings: AppSettings

  // Actions
  setActiveTab: (tab: SidebarTab) => void
  setPetMode: (open: boolean) => void
  setConnectionStatus: (s: AppState['connectionStatus']) => void
  setIsLoading: (v: boolean) => void

  setActiveCharacter: (name: string) => void
  setActiveOutfit: (name: string) => void
  setEmotion: (e: Emotion) => void
  setIsTalking: (v: boolean) => void
  setCharacters: (chars: Record<string, CharacterAsset>) => void
  setCurrentFrame: (url: string) => void

  addMessage: (msg: ChatMessage) => void
  clearMessages: () => void
  setIsStreaming: (v: boolean) => void
  setInputText: (t: string) => void

  setSettings: (s: Partial<AppSettings>) => void
  setSetting: <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => void
}

export const useAppStore = create<AppState>((set) => ({
  activeTab: 'sohbet',
  petModeOpen: false,
  connectionStatus: 'unknown',
  isLoading: false,
  fps: 60,

  activeCharacter: 'alice',
  activeOutfit: 'default',
  emotion: 'idle',
  isTalking: false,
  characters: {},
  currentFrame: '',

  messages: [],
  isStreaming: false,
  inputText: '',

  settings: DEFAULT_SETTINGS,

  setActiveTab: (tab) => set({ activeTab: tab }),
  setPetMode: (open) => set({ petModeOpen: open }),
  setConnectionStatus: (s) => set({ connectionStatus: s }),
  setIsLoading: (v) => set({ isLoading: v }),

  setActiveCharacter: (name) => set({ activeCharacter: name, activeOutfit: 'default' }),
  setActiveOutfit: (name) => set({ activeOutfit: name }),
  setEmotion: (e) => set({ emotion: e }),
  setIsTalking: (v) => set({ isTalking: v }),
  setCharacters: (chars) => set({ characters: chars }),
  setCurrentFrame: (url) => set({ currentFrame: url }),

  addMessage: (msg) => set((s) => ({ messages: [...s.messages, msg] })),
  clearMessages: () => set({ messages: [] }),
  setIsStreaming: (v) => set({ isStreaming: v }),
  setInputText: (t) => set({ inputText: t }),

  setSettings: (s) => set((state) => ({ settings: { ...state.settings, ...s } })),
  setSetting: (key, value) => set((state) => ({ settings: { ...state.settings, [key]: value } })),
}))
