import { create } from 'zustand'
import type { ModelMeta, LogEntry, AnimationState } from './types'

interface ModelStoreState {
  // Model library
  models: ModelMeta[]
  setModels: (m: ModelMeta[]) => void
  addModel: (m: ModelMeta) => void
  updateModel: (id: string, patch: Partial<ModelMeta>) => void
  removeModel: (id: string) => void

  // Active
  activeModelId: string | null
  setActiveModelId: (id: string | null) => void
  activeModel: ModelMeta | null

  // Viewer state
  isLoading: boolean
  setIsLoading: (v: boolean) => void
  loadError: string | null
  setLoadError: (e: string | null) => void

  // Animation state machine
  animState: AnimationState
  setAnimState: (s: AnimationState) => void

  // Viewer toggles
  autoRotate: boolean
  setAutoRotate: (v: boolean) => void
  showGrid: boolean
  setShowGrid: (v: boolean) => void
  transparentBg: boolean
  setTransparentBg: (v: boolean) => void

  // Logs
  logs: LogEntry[]
  addLog: (level: LogEntry['level'], message: string) => void
  clearLogs: () => void
}

export const useModelStore = create<ModelStoreState>((set, get) => ({
  models: [],
  setModels: (models) => set({ models }),
  addModel: (m) => set((s) => ({ models: [...s.models, m] })),
  updateModel: (id, patch) =>
    set((s) => ({
      models: s.models.map((m) => (m.id === id ? { ...m, ...patch } : m)),
    })),
  removeModel: (id) =>
    set((s) => ({ models: s.models.filter((m) => m.id !== id) })),

  activeModelId: null,
  setActiveModelId: (activeModelId) => set({ activeModelId }),
  get activeModel() {
    const { models, activeModelId } = get()
    return models.find((m) => m.id === activeModelId) ?? null
  },

  isLoading: false,
  setIsLoading: (isLoading) => set({ isLoading }),
  loadError: null,
  setLoadError: (loadError) => set({ loadError }),

  animState: 'idle',
  setAnimState: (animState) => set({ animState }),

  autoRotate: false,
  setAutoRotate: (autoRotate) => set({ autoRotate }),
  showGrid: true,
  setShowGrid: (showGrid) => set({ showGrid }),
  transparentBg: true,
  setTransparentBg: (transparentBg) => set({ transparentBg }),

  logs: [],
  addLog: (level, message) =>
    set((s) => ({
      logs: [
        ...s.logs.slice(-199),
        { id: `${Date.now()}-${Math.random()}`, level, message, timestamp: Date.now() },
      ],
    })),
  clearLogs: () => set({ logs: [] }),
}))
