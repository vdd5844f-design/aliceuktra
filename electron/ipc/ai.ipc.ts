import { ipcMain } from 'electron'
import * as https from 'https'
import * as http from 'http'

interface ChatPayload {
  provider: string
  baseUrl: string
  apiKey: string
  model: string
  temperature: number
  maxTokens: number
  messages: Array<{ role: string; content: string }>
}

async function httpPost(url: string, body: string, headers: Record<string, string>): Promise<string> {
  return new Promise((resolve, reject) => {
    const parsed = new URL(url)
    const lib = parsed.protocol === 'https:' ? https : http
    const options = {
      hostname: parsed.hostname,
      port: parsed.port || (parsed.protocol === 'https:' ? 443 : 80),
      path: parsed.pathname + (parsed.search || ''),
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body), ...headers },
    }
    const req = lib.request(options, (res) => {
      let data = ''
      res.on('data', (chunk) => (data += chunk))
      res.on('end', () => resolve(data))
    })
    req.on('error', reject)
    req.setTimeout(120000, () => { req.destroy(); reject(new Error('Zaman aşımı')) })
    req.write(body)
    req.end()
  })
}

async function httpGet(url: string, headers: Record<string, string> = {}): Promise<string> {
  return new Promise((resolve, reject) => {
    const parsed = new URL(url)
    const lib = parsed.protocol === 'https:' ? https : http
    const options = {
      hostname: parsed.hostname,
      port: parsed.port || (parsed.protocol === 'https:' ? 443 : 80),
      path: parsed.pathname + (parsed.search || ''),
      method: 'GET',
      headers,
    }
    const req = lib.request(options, (res) => {
      let data = ''
      res.on('data', (chunk) => (data += chunk))
      res.on('end', () => resolve(data))
    })
    req.on('error', reject)
    req.setTimeout(10000, () => { req.destroy(); reject(new Error('Zaman aşımı')) })
    req.end()
  })
}

export function setupAiIpc() {
  ipcMain.handle('ai:chat', async (_event, payload: ChatPayload) => {
    const { provider, baseUrl, apiKey, model, temperature, maxTokens, messages } = payload
    const base = baseUrl.replace(/\/$/, '')
    const authHeaders: Record<string, string> = apiKey ? { Authorization: `Bearer ${apiKey}` } : {}

    try {
      if (provider === 'ollama') {
        const body = JSON.stringify({ model, stream: false, messages, options: { temperature, num_predict: maxTokens } })
        const raw = await httpPost(`${base}/api/chat`, body, {})
        const json = JSON.parse(raw)
        return { success: true, content: json?.message?.content || '' }
      }

      if (provider === 'openai' || provider === 'openrouter' || provider === 'openai-compatible') {
        const body = JSON.stringify({ model, messages, temperature, max_tokens: maxTokens, stream: false })
        const url = provider === 'openrouter' ? 'https://openrouter.ai/api/v1/chat/completions' : `${base}/v1/chat/completions`
        const raw = await httpPost(url, body, authHeaders)
        const json = JSON.parse(raw)
        return { success: true, content: json?.choices?.[0]?.message?.content || '' }
      }

      if (provider === 'anthropic') {
        const sysMsg = messages.find((m) => m.role === 'system')
        const userMsgs = messages.filter((m) => m.role !== 'system')
        const body = JSON.stringify({ model, max_tokens: maxTokens, system: sysMsg?.content, messages: userMsgs })
        const raw = await httpPost('https://api.anthropic.com/v1/messages', body, { 'x-api-key': apiKey, 'anthropic-version': '2023-06-01' })
        const json = JSON.parse(raw)
        return { success: true, content: json?.content?.[0]?.text || '' }
      }

      if (provider === 'gemini') {
        const contents = messages.filter((m) => m.role !== 'system').map((m) => ({ role: m.role === 'assistant' ? 'model' : 'user', parts: [{ text: m.content }] }))
        const body = JSON.stringify({ contents, generationConfig: { temperature, maxOutputTokens: maxTokens } })
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`
        const raw = await httpPost(url, body, {})
        const json = JSON.parse(raw)
        return { success: true, content: json?.candidates?.[0]?.content?.parts?.[0]?.text || '' }
      }

      return { success: false, content: 'Desteklenmeyen sağlayıcı' }
    } catch (err: unknown) {
      return { success: false, content: err instanceof Error ? err.message : String(err) }
    }
  })

  ipcMain.handle('ai:test', async (_event, { provider, baseUrl, apiKey, model }: { provider: string; baseUrl: string; apiKey: string; model: string }) => {
    const base = (baseUrl || '').replace(/\/$/, '')
    const authHeaders: Record<string, string> = apiKey ? { Authorization: `Bearer ${apiKey}` } : {}
    try {
      if (provider === 'ollama') {
        await httpGet(`${base}/api/tags`)
        return { success: true }
      }
      // For other providers, send a minimal chat request
      const body = JSON.stringify({ model, messages: [{ role: 'user', content: 'Hi' }], max_tokens: 5, stream: false })
      const url = provider === 'openrouter' ? 'https://openrouter.ai/api/v1/chat/completions' : `${base}/v1/chat/completions`
      await httpPost(url, body, authHeaders)
      return { success: true }
    } catch (err: unknown) {
      return { success: false, error: err instanceof Error ? err.message : String(err) }
    }
  })
}
