import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('alice', {
  assets: {
    scan: () => ipcRenderer.invoke('assets:scan'),
    getCharacters: () => ipcRenderer.invoke('assets:getCharacters'),
    getOutfits: (characterId: string) => ipcRenderer.invoke('assets:getOutfits', characterId),
    getSprite: (characterId: string, outfitId: string, emotion: string) =>
      ipcRenderer.invoke('assets:getSprite', characterId, outfitId, emotion),
    reload: () => ipcRenderer.invoke('assets:reload'),
    setAssetsRoot: (p: string) => ipcRenderer.invoke('assets:setAssetsRoot', p),
    getRoot: () => ipcRenderer.invoke('assets:getRoot'),
  },
  ai: {
    chat: (payload: unknown) => ipcRenderer.invoke('ai:chat', payload),
    stop: () => ipcRenderer.invoke('ai:stop'),
    test: (opts: unknown) => ipcRenderer.invoke('ai:test', opts),
    onToken: (cb: (token: string) => void) => {
      const handler = (_: unknown, t: string) => cb(t)
      ipcRenderer.on('ai:token', handler)
      return () => ipcRenderer.removeListener('ai:token', handler)
    },
  },
  voice: {
    speak: (text: string, voice: string) => ipcRenderer.invoke('voice:speak', text, voice),
    stop: () => ipcRenderer.invoke('voice:stop'),
    listVoices: () => ipcRenderer.invoke('voice:listVoices'),
  },
  settings: {
    get: () => ipcRenderer.invoke('settings:get'),
    set: (data: unknown) => ipcRenderer.invoke('settings:set', data),
  },
  window: {
    minimize: () => ipcRenderer.invoke('window:minimize'),
    maximize: () => ipcRenderer.invoke('window:maximize'),
    close: () => ipcRenderer.invoke('window:close'),
    setPetMode: (enabled: boolean) => ipcRenderer.invoke('window:setPetMode', enabled),
    setAlwaysOnTop: (val: boolean) => ipcRenderer.invoke('window:setAlwaysOnTop', val),
  },
})
