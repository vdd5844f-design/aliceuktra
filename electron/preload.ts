import { contextBridge, ipcRenderer } from 'electron'

// ── Type mirrors (kept local so preload stays self-contained)
interface SpeakPayload {
  text: string
  voice: string
  rate: string
  pitch: string
  volume: string
}

contextBridge.exposeInMainWorld('alice', {
  // ── Asset IPC
  assets: {
    scan:           ()                                             => ipcRenderer.invoke('assets:scan'),
    getCharacters:  ()                                             => ipcRenderer.invoke('assets:getCharacters'),
    getOutfits:     (characterId: string)                         => ipcRenderer.invoke('assets:getOutfits', characterId),
    getSprite:      (characterId: string, outfitId: string, emotion: string)
                                                                   => ipcRenderer.invoke('assets:getSprite', characterId, outfitId, emotion),
    reload:         ()                                             => ipcRenderer.invoke('assets:reload'),
    setAssetsRoot:  (p: string)                                    => ipcRenderer.invoke('assets:setAssetsRoot', p),
    getRoot:        ()                                             => ipcRenderer.invoke('assets:getRoot'),
  },

  // ── AI IPC
  ai: {
    chat: (payload: unknown) => ipcRenderer.invoke('ai:chat', payload),
    stop: ()                 => ipcRenderer.invoke('ai:stop'),
    test: (opts: unknown)    => ipcRenderer.invoke('ai:test', opts),
    onToken: (cb: (token: string) => void) => {
      const handler = (_: unknown, t: string) => cb(t)
      ipcRenderer.on('ai:token', handler)
      return () => ipcRenderer.removeListener('ai:token', handler)
    },
  },

  // ── Voice IPC
  // voice:speak receives a full SpeakPayload object — matches voice.ipc.ts
  // voice:stop is a fire-and-forget (ipcMain.on, not handle)
  voice: {
    speak:      (payload: SpeakPayload) => ipcRenderer.invoke('voice:speak', payload),
    stop:       ()                      => ipcRenderer.send('voice:stop'),
    listVoices: ()                      => ipcRenderer.invoke('voice:listVoices'),
    // Subscribe to voice events from main
    onDone:  (cb: () => void)           => { ipcRenderer.on('voice:done', cb); return () => ipcRenderer.removeListener('voice:done', cb) },
    onError: (cb: (msg: string) => void)=> { ipcRenderer.on('voice:error', (_: unknown, m: string) => cb(m)); return () => ipcRenderer.removeListener('voice:error', cb) },
  },

  // ── Settings IPC
  settings: {
    get: ()                    => ipcRenderer.invoke('settings:get'),
    set: (data: unknown)       => ipcRenderer.invoke('settings:set', data),
  },

  // ── Window IPC — main.ts uses ipcMain.on (not handle), so use ipcRenderer.send
  window: {
    minimize:     ()                    => ipcRenderer.send('window:minimize'),
    maximize:     ()                    => ipcRenderer.send('window:maximize'),
    close:        ()                    => ipcRenderer.send('window:close'),
    setPetMode:   (enabled: boolean)    => ipcRenderer.send('window:setPetMode', enabled),
    setAlwaysOnTop: (val: boolean)      => ipcRenderer.send('pet:alwaysOnTop', val),
  },

  // ── Pet window IPC
  pet: {
    open:  ()                           => ipcRenderer.send('pet:open'),
    close: ()                           => ipcRenderer.send('pet:close'),
    move:  (x: number, y: number)       => ipcRenderer.send('pet:move', { x, y }),
  },
})
