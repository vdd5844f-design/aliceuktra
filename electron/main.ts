import { app, BrowserWindow, ipcMain, Menu, Tray, nativeImage, screen } from 'electron'
import * as path from 'path'
import * as fs from 'fs'
import { setupAiIpc } from './ipc/ai.ipc'
import { setupAssetsIpc } from './ipc/assets.ipc'
import { setupVoiceIpc } from './ipc/voice.ipc'
import { setupSettingsIpc } from './ipc/settings.ipc'
import { registerModelIpc } from './modelIpc'

const isDev = process.env.NODE_ENV === 'development'

let studioWindow: BrowserWindow | null = null
let petWindow: BrowserWindow | null = null

function getPreloadPath(): string {
  return path.join(__dirname, 'preload.js')
}

function getRendererUrl(hash = ''): string {
  if (isDev) return `http://localhost:5173${hash}`
  return `file://${path.join(__dirname, '../dist/index.html')}${hash}`
}

export function createStudioWindow() {
  if (studioWindow && !studioWindow.isDestroyed()) {
    studioWindow.focus()
    return studioWindow
  }

  const { width, height } = screen.getPrimaryDisplay().workAreaSize

  studioWindow = new BrowserWindow({
    width: Math.min(1600, width),
    height: Math.min(960, height),
    minWidth: 1200,
    minHeight: 720,
    frame: false,
    titleBarStyle: 'hidden',
    backgroundColor: '#05070a',
    webPreferences: {
      preload: getPreloadPath(),
      contextIsolation: true,
      nodeIntegration: false,
      webSecurity: false,
    },
    icon: path.join(__dirname, '../assets/icon.png'),
  })

  studioWindow.loadURL(getRendererUrl())

  if (isDev) studioWindow.webContents.openDevTools({ mode: 'detach' })

  studioWindow.on('closed', () => { studioWindow = null })

  return studioWindow
}

export function createPetWindow() {
  if (petWindow && !petWindow.isDestroyed()) {
    petWindow.show()
    return petWindow
  }

  petWindow = new BrowserWindow({
    width: 280,
    height: 400,
    transparent: true,
    frame: false,
    alwaysOnTop: true,
    skipTaskbar: true,
    resizable: false,
    hasShadow: false,
    backgroundColor: '#00000000',
    webPreferences: {
      preload: getPreloadPath(),
      contextIsolation: true,
      nodeIntegration: false,
      webSecurity: false,
    },
  })

  petWindow.loadURL(getRendererUrl('#/pet'))
  petWindow.setIgnoreMouseEvents(false)

  petWindow.on('closed', () => { petWindow = null })

  return petWindow
}

// IPC: window controls
ipcMain.on('window:minimize', (e) => {
  const win = BrowserWindow.fromWebContents(e.sender)
  win?.minimize()
})
ipcMain.on('window:maximize', (e) => {
  const win = BrowserWindow.fromWebContents(e.sender)
  if (win?.isMaximized()) win.unmaximize()
  else win?.maximize()
})
ipcMain.on('window:close', (e) => {
  const win = BrowserWindow.fromWebContents(e.sender)
  win?.close()
})

// IPC: pet window
ipcMain.on('pet:open', () => createPetWindow())
ipcMain.on('pet:close', () => { petWindow?.close() })
ipcMain.on('pet:move', (_e, { x, y }) => { petWindow?.setPosition(x, y) })
ipcMain.on('pet:alwaysOnTop', (_e, val: boolean) => { petWindow?.setAlwaysOnTop(val) })
ipcMain.on('studio:open', () => createStudioWindow())

// IPC: pet drag
ipcMain.on('pet:startDrag', (e) => {
  const win = BrowserWindow.fromWebContents(e.sender)
  if (win) win.webContents.startDrag({ file: '', icon: nativeImage.createEmpty() })
})

app.whenReady().then(() => {
  setupAiIpc()
  setupAssetsIpc()
  setupVoiceIpc()
  setupSettingsIpc()
  registerModelIpc()
  createStudioWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createStudioWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})
