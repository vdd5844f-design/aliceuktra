import React from 'react'
import { motion } from 'framer-motion'
import { Save } from 'lucide-react'
import { useAppStore } from '@/stores/appStore'
import { PROVIDERS, type Provider } from '@/types'

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="mb-3">
      <label
        className="text-[10px] block mb-1 tracking-wider"
        style={{ color: '#94a3b8', fontFamily: 'Rajdhani, sans-serif' }}
      >
        {label}
      </label>
      {children}
    </div>
  )
}

const inputStyle = {
  background: 'rgba(15,23,42,0.6)',
  border: '1px solid rgba(124,58,237,0.25)',
  color: '#e5e7eb',
  borderRadius: 6,
}

export default function SettingsPanel() {
  const { settings, setSettings } = useAppStore()

  async function save() {
    if (!(window as unknown as Record<string, unknown>)['alice']) return
    const alice = (window as unknown as Record<string, unknown>)['alice'] as Record<string, Record<string, (...args: unknown[]) => unknown>>
    await alice.settings.set(settings)
    alert('Ayarlar kaydedildi.')
  }

  return (
    <div
      className="flex flex-col flex-shrink-0 overflow-y-auto p-4"
      style={{ width: 260, background: 'rgba(5,7,10,0.5)' }}
    >
      <div
        className="text-xs font-bold tracking-widest mb-4"
        style={{ fontFamily: 'Rajdhani, sans-serif', color: '#a855f7', letterSpacing: '0.15em' }}
      >
        GELISTIRİCİ AYARLARI
      </div>

      {/* AI Settings */}
      <div className="mb-4 pb-4" style={{ borderBottom: '1px solid rgba(124,58,237,0.15)' }}>
        <div className="text-[10px] mb-3 tracking-wider" style={{ color: '#7c3aed' }}>YAPAY ZEKA</div>

        <Field label="SAĞLAYICI">
          <select
            value={settings.provider}
            onChange={(e) => setSettings({ provider: e.target.value as Provider })}
            className="w-full text-xs px-2 py-1.5 rounded outline-none cursor-pointer"
            style={inputStyle}
          >
            {PROVIDERS.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
          </select>
        </Field>

        <Field label="BASE URL">
          <input
            value={settings.baseUrl}
            onChange={(e) => setSettings({ baseUrl: e.target.value })}
            className="w-full text-xs px-2 py-1.5 rounded outline-none"
            style={inputStyle}
            placeholder="http://127.0.0.1:11434"
          />
        </Field>

        <Field label="API ANAHTARI">
          <input
            value={settings.apiKey}
            onChange={(e) => setSettings({ apiKey: e.target.value })}
            type="password"
            className="w-full text-xs px-2 py-1.5 rounded outline-none"
            style={inputStyle}
            placeholder="sk-..."
          />
        </Field>

        <Field label="MODEL">
          <input
            value={settings.model}
            onChange={(e) => setSettings({ model: e.target.value })}
            className="w-full text-xs px-2 py-1.5 rounded outline-none"
            style={inputStyle}
            placeholder="gemma3:4b"
          />
        </Field>

        <Field label={`SICAKLIK: ${settings.temperature}`}>
          <input
            type="range" min="0" max="1" step="0.1"
            value={settings.temperature}
            onChange={(e) => setSettings({ temperature: parseFloat(e.target.value) })}
            className="w-full h-1 rounded cursor-pointer"
            style={{ accentColor: '#a855f7' }}
          />
        </Field>

        <Field label={`MAKSİMUM TOKEN: ${settings.maxTokens}`}>
          <input
            type="range" min="64" max="2048" step="64"
            value={settings.maxTokens}
            onChange={(e) => setSettings({ maxTokens: parseInt(e.target.value) })}
            className="w-full h-1 rounded cursor-pointer"
            style={{ accentColor: '#a855f7' }}
          />
        </Field>
      </div>

      {/* Persona */}
      <div className="mb-4 pb-4" style={{ borderBottom: '1px solid rgba(124,58,237,0.15)' }}>
        <div className="text-[10px] mb-3 tracking-wider" style={{ color: '#7c3aed' }}>PERSONA</div>
        <textarea
          value={settings.persona}
          onChange={(e) => setSettings({ persona: e.target.value })}
          rows={6}
          className="w-full text-xs p-2 rounded outline-none resize-none"
          style={{ ...inputStyle, lineHeight: 1.6, fontFamily: 'Inter, sans-serif' }}
        />
      </div>

      {/* Voice settings */}
      <div className="mb-4 pb-4" style={{ borderBottom: '1px solid rgba(124,58,237,0.15)' }}>
        <div className="text-[10px] mb-3 tracking-wider" style={{ color: '#7c3aed' }}>SES AYARLARI</div>

        <Field label="SES ADI">
          <input
            value={settings.voice.voiceName}
            onChange={(e) => setSettings({ voice: { ...settings.voice, voiceName: e.target.value } })}
            className="w-full text-xs px-2 py-1.5 rounded outline-none"
            style={inputStyle}
          />
        </Field>

        <Field label="KONUŞMA HIZI">
          <input
            value={settings.voice.rate}
            onChange={(e) => setSettings({ voice: { ...settings.voice, rate: e.target.value } })}
            className="w-full text-xs px-2 py-1.5 rounded outline-none"
            style={inputStyle}
            placeholder="-10%"
          />
        </Field>

        <Field label="PİTCH">
          <input
            value={settings.voice.pitch}
            onChange={(e) => setSettings({ voice: { ...settings.voice, pitch: e.target.value } })}
            className="w-full text-xs px-2 py-1.5 rounded outline-none"
            style={inputStyle}
            placeholder="+6Hz"
          />
        </Field>
      </div>

      {/* Assets path */}
      <div className="mb-4">
        <div className="text-[10px] mb-3 tracking-wider" style={{ color: '#7c3aed' }}>VARLIKLAR</div>
        <Field label="VARLIK KLASÖRÜ">
          <input
            value={settings.assetsPath}
            onChange={(e) => setSettings({ assetsPath: e.target.value })}
            className="w-full text-xs px-2 py-1.5 rounded outline-none"
            style={inputStyle}
            placeholder="Varsayılan (assets/)"
          />
        </Field>
      </div>

      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={save}
        className="flex items-center justify-center gap-2 w-full py-2.5 rounded-lg text-xs font-bold cursor-pointer"
        style={{
          background: 'linear-gradient(135deg, rgba(124,58,237,0.4), rgba(0,229,255,0.2))',
          border: '1px solid rgba(124,58,237,0.5)',
          color: '#e5e7eb',
          fontFamily: 'Rajdhani, sans-serif',
          letterSpacing: '0.1em',
          boxShadow: '0 0 16px rgba(124,58,237,0.2)',
        }}
      >
        <Save size={14} /> AYARLARI KAYDET
      </motion.button>
    </div>
  )
}
