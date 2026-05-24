import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('alice', {
  // Window controls
  window: {
    minimize: () => ipcRenderer.send('window:minimize'),
    maximize: () => ipcRenderer.send('window:maximize'),
    close: () => ipcRenderer.send('window:close'),
  },

  // AI chat
  ai: {
    chat: (payload: { provider: string; baseUrl: string; apiKey: string; model: string; temperature: number; maxTokens: number; messages: Array<{ role: string; content: string }> }) =>
      ipcRenderer.invoke('ai:chat', payload),
    test: (payload: { provider: string; baseUrl: string; apiKey: string; model: string }) =>
      ipcRenderer.invoke('ai:test', payload),
  },

  // Asset scanning
  assets: {
    scan: (assetsPath?: string) => ipcRenderer.invoke('assets:scan', assetsPath),
    getFrame: (framePath: string) => ipcRenderer.invoke('assets:getFrame', framePath),
  },

  // Voice / Edge TTS
  voice: {
    speak: (payload: { text: string; voice: string; rate: string; pitch: string; volume: string }) =>
      ipcRenderer.invoke('voice:speak', payload),
    stop: () => ipcRenderer.send('voice:stop'),
    onDone: (cb: () => void) => ipcRenderer.on('voice:done', cb),
    onError: (cb: (err: string) => void) => ipcRenderer.on('voice:error', (_e, err) => cb(err)),
  },

  // Settings
  settings: {
    get: () => ipcRenderer.invoke('settings:get'),
    set: (data: Record<string, unknown>) => ipcRenderer.invoke('settings:set', data),
  },

  // Pet window
  pet: {
    open: () => ipcRenderer.send('pet:open'),
    close: () => ipcRenderer.send('pet:close'),
    move: (x: number, y: number) => ipcRenderer.send('pet:move', { x, y }),
    alwaysOnTop: (val: boolean) => ipcRenderer.send('pet:alwaysOnTop', val),
  },

  // Studio window
  studio: {
    open: () => ipcRenderer.send('studio:open'),
  },
})
