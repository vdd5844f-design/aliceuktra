import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { Smile, Volume2, Zap, FlaskConical, RefreshCw, Trash2, Mic, CheckSquare, Square, ChevronDown, ChevronUp } from 'lucide-react'
import { useAppStore } from '@/stores/appStore'
import type { Emotion } from '@/types'
import SettingsPanel from './SettingsPanel'
import MemoryPanel from './MemoryPanel'

const EMOTIONS: { id: Emotion; label: string; color: string }[] = [
  { id: 'idle',  label: 'Normal',    color: '#94a3b8' },
  { id: 'talk',  label: 'Konuşma',   color: '#00e5ff' },
  { id: 'happy', label: 'Mutlu',     color: '#00ff99' },
  { id: 'angry', label: 'Kızgın',    color: '#ff4d6d' },
  { id: 'sleep', label: 'Uyku',      color: '#a855f7' },
  { id: 'move',  label: 'Hareket',   color: '#f59e0b' },
]

function Card({ title, icon, children, defaultOpen = true }: { title: string; icon: React.ReactNode; children: React.ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className="rounded-xl overflow-hidden glass-card mb-2" style={{ border: '1px solid rgba(124,58,237,0.2)' }}>
      <button onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-3 py-2.5 cursor-pointer"
        style={{ borderBottom: open ? '1px solid rgba(124,58,237,0.15)' : 'none' }}>
        <div className="flex items-center gap-2">
          <span style={{ color: '#a855f7' }}>{icon}</span>
          <span className="text-xs font-semibold tracking-wider" style={{ fontFamily: 'Rajdhani, sans-serif', color: '#e5e7eb' }}>{title}</span>
        </div>
        {open ? <ChevronUp size={13} style={{ color: '#475569' }} /> : <ChevronDown size={13} style={{ color: '#475569' }} />}
      </button>
      {open && <div className="px-3 py-3">{children}</div>}
    </div>
  )
}

export default function RightPanel() {
  const { activeTab, emotion, setEmotion, settings, setSettings, setCharacters, clearMessages, setIsTalking } = useAppStore()

  // Waveform bars
  const waveBarCount = 20

  async function testVoice() {
    if (!window.alice) return
    setIsTalking(true)
    setEmotion('talk')
    await window.alice.voice.speak({
      text: 'Merhaba Ertu, ben Alice. Bugün ne yapmak istiyorsun?',
      voice: settings.voice.voiceName,
      rate: settings.voice.rate,
      pitch: settings.voice.pitch,
      volume: settings.voice.volume,
    })
  }

  async function testAI() {
    if (!window.alice) return
    const res = await window.alice.ai.test({ provider: settings.provider, baseUrl: settings.baseUrl, apiKey: settings.apiKey, model: settings.model })
    alert(res.success ? 'AI bağlantısı başarılı!' : `AI bağlantı hatası: ${res.error}`)
  }

  async function refreshAssets() {
    if (!window.alice) return
    const res = await window.alice.assets.scan(settings.assetsPath || undefined)
    if (res.success) { setCharacters(res.characters); alert('Varlıklar yenilendi!') }
    else alert(`Hata: ${res.error}`)
  }

  function clearMemory() {
    clearMessages()
  }

  async function saveSettings() {
    if (!window.alice) return
    await window.alice.settings.set(settings)
  }

  // Render different content based on active tab
  if (activeTab === 'gelistirici') return <SettingsPanel />
  if (activeTab === 'hafiza') return <MemoryPanel />

  return (
    <div className="flex flex-col overflow-y-auto flex-shrink-0 p-3"
      style={{ width: 260, background: 'rgba(5,7,10,0.5)' }}>

      {/* Emotion card */}
      <Card title="DUYGU" icon={<Smile size={14} />}>
        <div className="grid grid-cols-3 gap-1.5">
          {EMOTIONS.map((e) => (
            <motion.button key={e.id}
              whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
              onClick={() => setEmotion(e.id)}
              className="py-1.5 rounded-lg text-[11px] font-medium cursor-pointer transition-all"
              style={{
                fontFamily: 'Rajdhani, sans-serif',
                background: emotion === e.id ? `${e.color}20` : 'rgba(15,23,42,0.6)',
                border: `1px solid ${emotion === e.id ? e.color + '60' : 'rgba(124,58,237,0.15)'}`,
                color: emotion === e.id ? e.color : '#94a3b8',
                boxShadow: emotion === e.id ? `0 0 8px ${e.color}30` : 'none',
              }}>
              {e.label}
            </motion.button>
          ))}
        </div>
      </Card>

      {/* Voice card */}
      <Card title="SES" icon={<Volume2 size={14} />}>
        {/* Voice name */}
        <div className="mb-2">
          <label className="text-[10px] mb-1 block" style={{ color: '#94a3b8' }}>Ses Motoru</label>
          <div className="text-xs px-2 py-1.5 rounded"
            style={{ background: 'rgba(15,23,42,0.6)', border: '1px solid rgba(124,58,237,0.2)', color: '#00e5ff' }}>
            Edge TTS
          </div>
        </div>

        <div className="mb-2">
          <label className="text-[10px] mb-1 block" style={{ color: '#94a3b8' }}>Ses</label>
          <input value={settings.voice.voiceName}
            onChange={(e) => setSettings({ voice: { ...settings.voice, voiceName: e.target.value } })}
            className="w-full text-xs px-2 py-1.5 rounded outline-none"
            style={{ background: 'rgba(15,23,42,0.6)', border: '1px solid rgba(124,58,237,0.2)', color: '#e5e7eb' }}
          />
        </div>

        {/* Waveform visual */}
        <div className="flex items-center gap-0.5 h-6 mb-3">
          {Array.from({ length: waveBarCount }).map((_, i) => (
            <motion.div key={i}
              className="flex-1 rounded-full"
              style={{ background: 'rgba(0,229,255,0.5)', minWidth: 2 }}
              animate={{ height: useAppStore.getState().isTalking ? `${Math.random() * 80 + 20}%` : '20%' }}
              transition={{ duration: 0.15, delay: i * 0.02, repeat: useAppStore.getState().isTalking ? Infinity : 0 }}
            />
          ))}
        </div>

        {/* Volume slider */}
        <div className="mb-2">
          <label className="text-[10px] mb-1 flex justify-between" style={{ color: '#94a3b8' }}>
            <span>Ses Seviyesi</span>
            <span style={{ color: '#00e5ff' }}>{settings.voice.volume}</span>
          </label>
          <input type="range" min="-50" max="50" step="1"
            value={parseInt(settings.voice.volume?.replace('%', '').replace('+', '') || '8')}
            onChange={(e) => setSettings({ voice: { ...settings.voice, volume: `+${e.target.value}%` } })}
            className="w-full h-1 rounded cursor-pointer outline-none"
            style={{ accentColor: '#00e5ff' }}
          />
        </div>

        {/* Auto speak */}
        <motion.button whileTap={{ scale: 0.98 }}
          onClick={() => setSettings({ voice: { ...settings.voice, autoSpeak: !settings.voice.autoSpeak } })}
          className="flex items-center gap-2 w-full py-1.5 px-2 rounded-lg cursor-pointer mb-2"
          style={{
            background: settings.voice.autoSpeak ? 'rgba(0,229,255,0.1)' : 'rgba(15,23,42,0.6)',
            border: `1px solid ${settings.voice.autoSpeak ? 'rgba(0,229,255,0.3)' : 'rgba(124,58,237,0.2)'}`,
          }}>
          {settings.voice.autoSpeak
            ? <CheckSquare size={13} style={{ color: '#00e5ff' }} />
            : <Square size={13} style={{ color: '#475569' }} />}
          <span className="text-xs" style={{ color: settings.voice.autoSpeak ? '#00e5ff' : '#94a3b8' }}>Otomatik Konuş</span>
        </motion.button>

        <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
          onClick={testVoice}
          className="w-full flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-medium cursor-pointer"
          style={{ background: 'rgba(0,229,255,0.1)', border: '1px solid rgba(0,229,255,0.3)', color: '#00e5ff', fontFamily: 'Rajdhani, sans-serif' }}>
          <Mic size={13} /> Test Sesi
        </motion.button>
      </Card>

      {/* Quick actions */}
      <Card title="HIZLI İŞLEMLER" icon={<Zap size={14} />}>
        <div className="flex flex-col gap-2">
          <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
            onClick={testAI}
            className="flex items-center gap-2 py-2 px-3 rounded-lg text-xs cursor-pointer"
            style={{ background: 'rgba(124,58,237,0.1)', border: '1px solid rgba(124,58,237,0.3)', color: '#a855f7', fontFamily: 'Rajdhani, sans-serif' }}>
            <FlaskConical size={13} /> Yapay Zeka Testi
          </motion.button>

          <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
            onClick={refreshAssets}
            className="flex items-center gap-2 py-2 px-3 rounded-lg text-xs cursor-pointer"
            style={{ background: 'rgba(0,229,255,0.1)', border: '1px solid rgba(0,229,255,0.25)', color: '#00e5ff', fontFamily: 'Rajdhani, sans-serif' }}>
            <RefreshCw size={13} /> Varlıkları Yenile
          </motion.button>

          <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
            onClick={clearMemory}
            className="flex items-center gap-2 py-2 px-3 rounded-lg text-xs cursor-pointer"
            style={{ background: 'rgba(255,77,109,0.1)', border: '1px solid rgba(255,77,109,0.25)', color: '#ff4d6d', fontFamily: 'Rajdhani, sans-serif' }}>
            <Trash2 size={13} /> Hafızayı Temizle
          </motion.button>

          <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
            onClick={saveSettings}
            className="flex items-center gap-2 py-2 px-3 rounded-lg text-xs cursor-pointer"
            style={{ background: 'rgba(0,255,153,0.08)', border: '1px solid rgba(0,255,153,0.2)', color: '#00ff99', fontFamily: 'Rajdhani, sans-serif' }}>
            <Zap size={13} /> Ayarları Kaydet
          </motion.button>
        </div>
      </Card>
    </div>
  )
}
