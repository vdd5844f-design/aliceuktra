/**
 * Global type declarations for window.alice (Electron contextBridge surface).
 * Mirrors preload.ts exactly.
 */

import type { ScanResult, ScannedCharacter, ScannedOutfit, SpriteEntry, AppSettings } from './index'

interface SpeakPayload {
  text: string
  voice: string
  rate: string
  pitch: string
  volume: string
}

interface AliceAssets {
  scan:           ()                                                        => Promise<ScanResult>
  getCharacters:  ()                                                        => Promise<ScannedCharacter[]>
  getOutfits:     (characterId: string)                                     => Promise<ScannedOutfit[]>
  getSprite:      (characterId: string, outfitId: string, emotion: string) => Promise<SpriteEntry | null>
  reload:         ()                                                        => Promise<ScanResult>
  setAssetsRoot:  (path: string)                                            => Promise<ScanResult>
  getRoot:        ()                                                        => Promise<string>
}

interface AliceAI {
  chat:    (payload: unknown) => Promise<{ done: boolean }>
  stop:    ()                 => Promise<void>
  test:    (opts: unknown)    => Promise<{ success: boolean; error?: string }>
  onToken: (cb: (token: string) => void) => () => void
}

interface AliceVoice {
  speak:      (payload: SpeakPayload)           => Promise<void>
  stop:       ()                                => void
  listVoices: ()                                => Promise<string[]>
  onDone:     (cb: () => void)                  => () => void
  onError:    (cb: (msg: string) => void)       => () => void
}

interface AliceSettings {
  get: ()                          => Promise<Record<string, unknown>>
  set: (data: Partial<AppSettings>) => Promise<void>
}

interface AliceWindow {
  minimize:       ()                  => void
  maximize:       ()                  => void
  close:          ()                  => void
  setPetMode:     (enabled: boolean)  => void
  setAlwaysOnTop: (val: boolean)      => void
}

interface AlicePet {
  open:  ()                         => void
  close: ()                         => void
  move:  (x: number, y: number)     => void
}

interface AliceAPI {
  assets:   AliceAssets
  ai:       AliceAI
  voice:    AliceVoice
  settings: AliceSettings
  window:   AliceWindow
  pet:      AlicePet
}

declare global {
  interface Window {
    alice?: AliceAPI
  }
}

export {}
