// ─────────────────────────────────────────────────────────────────────────────
// Model Studio — shared types
// ─────────────────────────────────────────────────────────────────────────────

export type LicenseType =
  | 'own'
  | 'CC0'
  | 'CC-BY'
  | 'commercial'
  | 'unknown'

export const LICENSE_LABELS: Record<LicenseType, string> = {
  own:        'Kendi Üretimim',
  CC0:        'CC0 (Kamu Malı)',
  'CC-BY':    'CC-BY (Atıf Gerekli)',
  commercial: 'Ticari Kullanıma İzinli',
  unknown:    'Bilinmiyor',
}

export type AnimationState =
  | 'idle'
  | 'listening'
  | 'thinking'
  | 'talking'
  | 'happy'
  | 'angry'
  | 'sad'
  | 'sleeping'
  | 'moving'

export type RenderQuality = 'balanced' | 'high' | 'ultra'

export type PixelRatioMode = 'device' | 'fixed1' | 'fixed2'

export interface ModelSettings {
  scale: number
  positionX: number
  positionY: number
  positionZ: number
  opacity: number
  alwaysOnTop: boolean
  mouseFollow: boolean
  shadow: boolean
  antiAliasing: boolean
  pixelRatioMode: PixelRatioMode
  renderQuality: RenderQuality
  idleIntensity: number       // 0–1
  headFollowIntensity: number // 0–1
  blinkInterval: number       // seconds
  mouthOpenScale: number      // 0–1
}

export const DEFAULT_MODEL_SETTINGS: ModelSettings = {
  scale: 1,
  positionX: 0,
  positionY: 0,
  positionZ: 0,
  opacity: 1,
  alwaysOnTop: true,
  mouseFollow: true,
  shadow: true,
  antiAliasing: true,
  pixelRatioMode: 'device',
  renderQuality: 'high',
  idleIntensity: 0.5,
  headFollowIntensity: 0.4,
  blinkInterval: 4,
  mouthOpenScale: 0.8,
}

export interface ModelMeta {
  id: string
  name: string
  sourceUrl: string
  licenseType: LicenseType
  fileName: string
  fileSize: number
  createdAt: string
  isActive: boolean
  previewImage: string
  settings: ModelSettings
}

export interface LogEntry {
  id: string
  level: 'info' | 'warn' | 'error' | 'success'
  message: string
  timestamp: number
}
