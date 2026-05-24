import { ipcMain, app } from 'electron'
import * as fs from 'fs'
import * as path from 'path'

const SETTINGS_PATH = path.join(app.getPath('userData'), 'alice-settings.json')

const DEFAULT_SETTINGS = {
  provider: 'ollama',
  baseUrl: 'http://127.0.0.1:11434',
  apiKey: '',
  model: 'qwen2.5:3b',
  temperature: 0.7,
  maxTokens: 512,
  persona: 'Sen Alice AI Ultra adlı masaüstü yardımcı karakterisin.\n\nKurallar:\n- Sadece Türkçe konuş.\n- Kısa, net ve profesyonel cevap ver.\n- Kullanıcıya teknik konularda yardım et.\n- Bilmediğin şeyi uydurma.\n- Gereksiz emoji kullanma.\n- Cevaplarını 1-3 cümle ile sınırla.',
  voice: {
    engine: 'edge-tts',
    voiceName: 'tr-TR-EmelNeural',
    rate: '-10%',
    pitch: '+6Hz',
    volume: '+8%',
    autoSpeak: false,
  },
  window: {
    alwaysOnTop: false,
  },
  assetsPath: '',
}

function readSettings(): Record<string, unknown> {
  try {
    if (fs.existsSync(SETTINGS_PATH)) {
      const raw = fs.readFileSync(SETTINGS_PATH, 'utf-8')
      return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) }
    }
  } catch {}
  return { ...DEFAULT_SETTINGS }
}

function writeSettings(data: Record<string, unknown>) {
  const current = readSettings()
  const merged = deepMerge(current, data)
  fs.writeFileSync(SETTINGS_PATH, JSON.stringify(merged, null, 2), 'utf-8')
  return merged
}

function deepMerge(target: Record<string, unknown>, source: Record<string, unknown>): Record<string, unknown> {
  const result = { ...target }
  for (const key of Object.keys(source)) {
    if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key]) && typeof target[key] === 'object') {
      result[key] = deepMerge(target[key] as Record<string, unknown>, source[key] as Record<string, unknown>)
    } else {
      result[key] = source[key]
    }
  }
  return result
}

export function setupSettingsIpc() {
  ipcMain.handle('settings:get', () => readSettings())
  ipcMain.handle('settings:set', (_event, data: Record<string, unknown>) => {
    return writeSettings(data)
  })
}
