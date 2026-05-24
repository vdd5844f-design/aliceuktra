import fs from 'fs'
import path from 'path'
import { app } from 'electron'
import type { ModelMeta } from '../src/features/model-studio/types'

// ─────────────────────────────────────────────────────────────────────────────
// Model Storage — manages VRM files in userData/data/models/{id}/
// ─────────────────────────────────────────────────────────────────────────────

function modelsRoot(): string {
  return path.join(app.getPath('userData'), 'data', 'models')
}

function modelDir(id: string): string {
  return path.join(modelsRoot(), id)
}

function ensureDir(dir: string) {
  fs.mkdirSync(dir, { recursive: true })
}

// ── Save a VRM file buffer + meta

export async function saveModelFile(
  buffer: Buffer,
  meta: ModelMeta,
): Promise<{ success: boolean; error?: string }> {
  try {
    const dir = modelDir(meta.id)
    ensureDir(dir)
    const vrmPath = path.join(dir, 'character.vrm')
    const metaPath = path.join(dir, 'meta.json')
    fs.writeFileSync(vrmPath, buffer)
    fs.writeFileSync(metaPath, JSON.stringify(meta, null, 2), 'utf8')
    return { success: true }
  } catch (e) {
    return { success: false, error: (e as Error).message }
  }
}

// ── List all models

export function listModels(): ModelMeta[] {
  try {
    const root = modelsRoot()
    if (!fs.existsSync(root)) return []
    const dirs = fs.readdirSync(root, { withFileTypes: true })
      .filter((d) => d.isDirectory())
      .map((d) => d.name)
    const metas: ModelMeta[] = []
    for (const id of dirs) {
      const metaPath = path.join(modelDir(id), 'meta.json')
      if (fs.existsSync(metaPath)) {
        try {
          const raw = fs.readFileSync(metaPath, 'utf8')
          metas.push(JSON.parse(raw) as ModelMeta)
        } catch { /* skip corrupt meta */ }
      }
    }
    return metas.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  } catch {
    return []
  }
}

// ── Read single meta

export function readModelMeta(modelId: string): ModelMeta | null {
  try {
    const metaPath = path.join(modelDir(modelId), 'meta.json')
    if (!fs.existsSync(metaPath)) return null
    return JSON.parse(fs.readFileSync(metaPath, 'utf8')) as ModelMeta
  } catch {
    return null
  }
}

// ── Update model settings / meta

export function updateModelMeta(modelId: string, patch: Partial<ModelMeta>): boolean {
  try {
    const existing = readModelMeta(modelId)
    if (!existing) return false
    const updated = { ...existing, ...patch }
    fs.writeFileSync(path.join(modelDir(modelId), 'meta.json'), JSON.stringify(updated, null, 2), 'utf8')
    return true
  } catch {
    return false
  }
}

// ── Delete model

export function deleteModel(modelId: string): boolean {
  try {
    const dir = modelDir(modelId)
    if (!fs.existsSync(dir)) return false
    fs.rmSync(dir, { recursive: true, force: true })
    return true
  } catch {
    return false
  }
}

// ── Set active model (clears all others)

export function setActiveModel(modelId: string): boolean {
  try {
    const models = listModels()
    for (const m of models) {
      updateModelMeta(m.id, { isActive: m.id === modelId })
    }
    return true
  } catch {
    return false
  }
}

// ── Get active model

export function getActiveModel(): ModelMeta | null {
  const models = listModels()
  return models.find((m) => m.isActive) ?? null
}

// ── Get file:// URL for VRM

export function getModelFileUrl(modelId: string): string | null {
  const vrmPath = path.join(modelDir(modelId), 'character.vrm')
  if (!fs.existsSync(vrmPath)) return null
  return `file://${vrmPath.replace(/\\/g, '/')}`
}

// ── Save preview image (base64 PNG)

export function savePreviewImage(modelId: string, base64Data: string): boolean {
  try {
    const dir = modelDir(modelId)
    ensureDir(dir)
    const imgPath = path.join(dir, 'preview.png')
    const data = base64Data.replace(/^data:image\/\w+;base64,/, '')
    fs.writeFileSync(imgPath, Buffer.from(data, 'base64'))
    updateModelMeta(modelId, { previewImage: `file://${imgPath.replace(/\\/g, '/')}` })
    return true
  } catch {
    return false
  }
}
