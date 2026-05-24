import { ipcMain, BrowserWindow } from 'electron'
import { spawn, ChildProcess } from 'child_process'
import * as path from 'path'
import * as fs from 'fs'
import * as os from 'os'

let currentProcess: ChildProcess | null = null
let audioProcess: ChildProcess | null = null

interface SpeakPayload {
  text: string
  voice: string
  rate: string
  pitch: string
  volume: string
}

async function speakWithEdgeTts(payload: SpeakPayload): Promise<string> {
  const { text, voice, rate, pitch } = payload
  const tmpFile = path.join(os.tmpdir(), `alice_tts_${Date.now()}.mp3`)

  return new Promise((resolve, reject) => {
    // Try edge-tts (Python package) first
    const args = [
      '-m', 'edge_tts',
      '--voice', voice || 'tr-TR-EmelNeural',
      '--rate', rate || '-10%',
      '--pitch', pitch || '+6Hz',
      '--text', text,
      '--write-media', tmpFile,
    ]

    const proc = spawn('python3', args, { timeout: 30000 })
    currentProcess = proc

    let stderr = ''
    proc.stderr?.on('data', (d) => (stderr += d.toString()))
    proc.on('close', (code) => {
      if (code === 0 && fs.existsSync(tmpFile)) {
        resolve(tmpFile)
      } else {
        // Fallback to edge-tts CLI if python module fails
        const cliArgs = [
          '--voice', voice || 'tr-TR-EmelNeural',
          '--rate', rate || '-10%',
          '--pitch', pitch || '+6Hz',
          '--text', text,
          '--write-media', tmpFile,
        ]
        const cliProc = spawn('edge-tts', cliArgs, { timeout: 30000 })
        currentProcess = cliProc
        let cliStderr = ''
        cliProc.stderr?.on('data', (d) => (cliStderr += d.toString()))
        cliProc.on('close', (cliCode) => {
          if (cliCode === 0 && fs.existsSync(tmpFile)) resolve(tmpFile)
          else reject(new Error(`edge-tts hatası: ${cliStderr || stderr}`))
        })
        cliProc.on('error', () => reject(new Error('edge-tts bulunamadı. Kurmak için: pip install edge-tts')))
      }
    })
    proc.on('error', () => reject(new Error('Python3 bulunamadı. pip install edge-tts gerekli.')))
  })
}

function playAudio(filePath: string): Promise<void> {
  return new Promise((resolve, reject) => {
    let player: ChildProcess

    if (process.platform === 'win32') {
      player = spawn('powershell', [
        '-c',
        `(New-Object Media.SoundPlayer '${filePath}').PlaySync()`,
      ])
    } else if (process.platform === 'darwin') {
      player = spawn('afplay', [filePath])
    } else {
      // Linux: try mpg123, then aplay
      player = spawn('mpg123', [filePath])
    }

    audioProcess = player
    player.on('close', (code) => {
      if (fs.existsSync(filePath)) {
        try { fs.unlinkSync(filePath) } catch {}
      }
      resolve()
    })
    player.on('error', () => {
      // Fallback Linux
      const alt = spawn('aplay', [filePath])
      audioProcess = alt
      alt.on('close', () => {
        try { if (fs.existsSync(filePath)) fs.unlinkSync(filePath) } catch {}
        resolve()
      })
      alt.on('error', () => resolve()) // silently skip if no player
    })
  })
}

export function setupVoiceIpc() {
  ipcMain.handle('voice:speak', async (event, payload: SpeakPayload) => {
    const allWindows = BrowserWindow.getAllWindows()

    try {
      const audioFile = await speakWithEdgeTts(payload)
      await playAudio(audioFile)
      allWindows.forEach((w) => w.webContents.send('voice:done'))
      return { success: true }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err)
      allWindows.forEach((w) => w.webContents.send('voice:error', msg))
      return { success: false, error: msg }
    }
  })

  ipcMain.on('voice:stop', () => {
    currentProcess?.kill('SIGTERM')
    audioProcess?.kill('SIGTERM')
    currentProcess = null
    audioProcess = null
  })
}
