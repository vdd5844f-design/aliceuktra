import { create } from 'zustand'
import type {
  AppSettings, ChatMessage, Emotion, ScannedCharacter, ScannedOutfit,
  ScanResult, SidebarTab, SpriteEntry,
} from '../types'
import { DEFAULT_SETTINGS } from '../types'

interface AppState {
  // ── UI
  activeTab: SidebarTab
  setActiveTab: (t: SidebarTab) => void
  petMode: boolean
  setPetMode: (v: boolean) => void

  // ── Chat
  messages: ChatMessage[]
  addMessage: (m: ChatMessage) => void
  clearMessages: () => void
  isStreaming: boolean
  setIsStreaming: (v: boolean) => void
  isTalking: boolean
  setIsTalking: (v: boolean) => void
  appendToLastAssistant: (token: string) => void

  // ── Settings
  settings: AppSettings
  setSettings: (partial: Partial<AppSettings>) => void

  // ── Assets
  scanResult: ScanResult | null
  setScanResult: (r: ScanResult) => void
  characters: ScannedCharacter[]
  setCharacters: (c: ScannedCharacter[]) => void

  // ── Active character / outfit
  activeCharacterId: string
  setActiveCharacterId: (id: string) => void
  activeOutfitId: string
  setActiveOutfitId: (id: string) => void
  activeEmotion: Emotion
  setActiveEmotion: (e: Emotion) => void

  // ── Current sprite (resolved by CharacterPanel)
  currentSprite: SpriteEntry | null
  setCurrentSprite: (s: SpriteEntry | null) => void

  // ── Connection
  connectionStatus: 'idle' | 'testing' | 'connected' | 'disconnected'
  setConnectionStatus: (s: 'idle' | 'testing' | 'connected' | 'disconnected') => void

  // ── Helpers
  activeCharacter: ScannedCharacter | undefined
  activeOutfit: ScannedOutfit | undefined
}

export const useAppStore = create<AppState>((set, get) => ({
  // ── UI
  activeTab: 'sohbet',
  setActiveTab: (activeTab) => set({ activeTab }),
  petMode: false,
  setPetMode: (petMode) => set({ petMode }),

  // ── Chat
  messages: [],
  addMessage: (m) => set((s) => ({ messages: [...s.messages, m] })),
  clearMessages: () => set({ messages: [] }),
  isStreaming: false,
  setIsStreaming: (isStreaming) => set({ isStreaming }),
  isTalking: false,
  setIsTalking: (isTalking) => set({ isTalking }),
  appendToLastAssistant: (token) =>
    set((s) => {
      const msgs = [...s.messages]
      const last = msgs[msgs.length - 1]
      if (last?.role === 'assistant') {
        msgs[msgs.length - 1] = { ...last, content: last.content + token }
      } else {
        msgs.push({ id: Date.now().toString(), role: 'assistant', content: token, timestamp: Date.now() })
      }
      return { messages: msgs }
    }),

  // ── Settings
  settings: DEFAULT_SETTINGS,
  setSettings: (partial) => set((s) => ({ settings: { ...s.settings, ...partial } })),

  // ── Assets
  scanResult: null,
  setScanResult: (scanResult) => {
    const characters = scanResult.characters
    const firstChar = characters[0]
    const firstOutfit = firstChar?.outfits[0]
    set({
      scanResult,
      characters,
      activeCharacterId: get().activeCharacterId || firstChar?.id || '',
      activeOutfitId: get().activeOutfitId || firstOutfit?.id || '',
    })
  },
  characters: [],
  setCharacters: (characters) => set({ characters }),

  // ── Active character / outfit
  activeCharacterId: '',
  setActiveCharacterId: (activeCharacterId) => {
    const char = get().characters.find(c => c.id === activeCharacterId)
    const firstOutfit = char?.outfits[0]
    set({ activeCharacterId, activeOutfitId: firstOutfit?.id || '' })
  },
  activeOutfitId: '',
  setActiveOutfitId: (activeOutfitId) => set({ activeOutfitId }),
  activeEmotion: 'idle',
  setActiveEmotion: (activeEmotion) => set({ activeEmotion }),

  // ── Current sprite
  currentSprite: null,
  setCurrentSprite: (currentSprite) => set({ currentSprite }),

  // ── Connection
  connectionStatus: 'idle',
  setConnectionStatus: (connectionStatus) => set({ connectionStatus }),

  // ── Computed helpers (getters, not state)
  get activeCharacter() { return get().characters.find(c => c.id === get().activeCharacterId) },
  get activeOutfit() {
    const char = get().characters.find(c => c.id === get().activeCharacterId)
    return char?.outfits.find(o => o.id === get().activeOutfitId)
  },
}))
