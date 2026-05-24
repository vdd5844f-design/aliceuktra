import { ipcMain } from 'electron'
import {
  saveModelFile, listModels, readModelMeta, deleteModel,
  setActiveModel, getActiveModel, updateModelMeta,
  savePreviewImage, getModelFileUrl,
} from './modelStorage'
import type { ModelMeta } from '../src/features/model-studio/types'

// ─────────────────────────────────────────────────────────────────────────────
// Model IPC handlers — all renderer calls go through contextBridge
// ─────────────────────────────────────────────────────────────────────────────

export function registerModelIpc() {
  // Save VRM file buffer + meta
  ipcMain.handle('model:save', async (_e, fileBuffer: ArrayBuffer, meta: ModelMeta) => {
    try {
      return await saveModelFile(Buffer.from(fileBuffer), meta)
    } catch (e) {
      return { success: false, error: (e as Error).message }
    }
  })

  // List all saved models
  ipcMain.handle('model:list', () => {
    return listModels()
  })

  // Read single model meta
  ipcMain.handle('model:readMeta', (_e, modelId: string) => {
    return readModelMeta(modelId)
  })

  // Delete model
  ipcMain.handle('model:delete', (_e, modelId: string) => {
    return deleteModel(modelId)
  })

  // Set active character
  ipcMain.handle('model:setActive', (_e, modelId: string) => {
    return setActiveModel(modelId)
  })

  // Get active character
  ipcMain.handle('model:getActive', () => {
    return getActiveModel()
  })

  // Update model settings
  ipcMain.handle('model:updateSettings', (_e, modelId: string, patch: Partial<ModelMeta>) => {
    return updateModelMeta(modelId, patch)
  })

  // Save preview image (base64)
  ipcMain.handle('model:savePreview', (_e, modelId: string, base64Data: string) => {
    return savePreviewImage(modelId, base64Data)
  })

  // Get file:// URL for the VRM
  ipcMain.handle('model:getFileUrl', (_e, modelId: string) => {
    return getModelFileUrl(modelId)
  })
}
