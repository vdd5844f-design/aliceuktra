import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { Settings, Monitor, Minus, Maximize2, X, Wifi, WifiOff, Loader2 } from 'lucide-react'
import { useAppStore } from '@/stores/appStore'
import type { Provider } from '@/types'

const PROVIDERS: { value: Provider; label: string }[] = [
  { value: 'ollama', label: 'Ollama' },
  { value: 'openai', label: 'OpenAI' },
  { value: 'anthropic', label: 'Anthropic' },
  { value: 'gemini', label: 'Gemini' },
  { value: 'openrouter', label: 'OpenRouter' },
  { value: 'openai-compatible', label: 'Uyumlu API' },
]

export default function Toolbar() {
  const { characters, activeCharacter, activeOutfit, settings, connectionStatus,
    setActiveCharacter, setActiveOutfit, setSettings, setConnectionStatus, setPetMode, petModeOpen } = useAppStore()

  const charList = Object.keys(characters)
  const outfitList = characters[activeCharacter] ? Object.keys(characters[activeCharacter].outfits) : ['default']

  async function testConnection() {
    if (!window.alice) return
    setConnectionStatus('testing')
    try {
      const res = await window.alice.ai.test({ provider: settings.provider, baseUrl: settings.baseUrl, apiKey: settings.apiKey, model: settings.model })
      setConnectionStatus(res.success ? 'connected' : 'disconnected')
    } catch {
      setConnectionStatus('disconnected')
    }
  }

  function togglePet() {
    if (petModeOpen) {
      window.alice?.pet.close()
      setPetMode(false)
    } else {
      window.alice?.pet.open()
      setPetMode(true)
    }
  }

  const statusColor = connectionStatus === 'connected' ? '#10b981' : connectionStatus === 'disconnected' ? '#ec4899' : connectionStatus === 'testing' ? '#f59e0b' : '#94a3b8'

  return (
    <div className="drag-region flex items-center h-12 px-4 gap-3 relative z-20 flex-shrink-0"
      style={{ background: 'rgba(10,14,39,0.95)', borderBottom: '1px solid rgba(139,92,246,0.15)' }}>

      {/* Logo */}
      <div className="no-drag flex items-center gap-2 mr-2">
        <div className="w-7 h-7 rounded-lg flex items-center justify-center glow-purple"
          style={{ background: 'linear-gradient(135deg, #8b5cf6, #06b6d4)', border: '1px solid rgba(139,92,246,0.3)' }}>
          <span className="text-white font-bold text-xs" style={{ fontFamily: 'Rajdhani, sans-serif' }}>A</span>
        </div>
        <span className="text-sm font-bold tracking-widest"
          style={{ fontFamily: 'Rajdhani, sans-serif', color: '#f1f5f9' }}>
          ALICE AI ULTRA
        </span>
      </div>

      {/* Character select */}
      <div className="no-drag flex items-center gap-1">
        <span className="text-xs" style={{ color: '#cbd5e1' }}>Karakter:</span>
        <select
          value={activeCharacter}
          onChange={(e) => setActiveCharacter(e.target.value)}
          className="text-xs px-2 py-1 rounded outline-none no-drag"
          style={{ background: 'rgba(26,40,84,0.5)', color: '#f1f5f9', border: '1px solid rgba(139,92,246,0.2)', cursor: 'pointer' }}>
          {charList.length === 0 ? <option value="alice">Alice</option> : charList.map((c) => (
            <option key={c} value={c}>{characters[c].name}</option>
          ))}
        </select>
      </div>

      {/* Outfit select */}
      <div className="no-drag flex items-center gap-1">
        <span className="text-xs" style={{ color: '#cbd5e1' }}>Kıyafet:</span>
        <select
          value={activeOutfit}
          onChange={(e) => setActiveOutfit(e.target.value)}
          className="text-xs px-2 py-1 rounded outline-none no-drag"
          style={{ background: 'rgba(26,40,84,0.5)', color: '#f1f5f9', border: '1px solid rgba(139,92,246,0.2)', cursor: 'pointer' }}>
          {outfitList.map((o) => (
            <option key={o} value={o}>{characters[activeCharacter]?.outfits[o]?.name || o}</option>
          ))}
        </select>
      </div>

      {/* Provider select */}
      <div className="no-drag flex items-center gap-1">
        <span className="text-xs" style={{ color: '#cbd5e1' }}>Sağlayıcı:</span>
        <select
          value={settings.provider}
          onChange={(e) => setSettings({ provider: e.target.value as Provider })}
          className="text-xs px-2 py-1 rounded outline-none no-drag"
          style={{ background: 'rgba(26,40,84,0.5)', color: '#f1f5f9', border: '1px solid rgba(139,92,246,0.2)', cursor: 'pointer' }}>
          {PROVIDERS.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
        </select>
      </div>

      {/* Model input */}
      <div className="no-drag flex items-center gap-1">
        <span className="text-xs" style={{ color: '#cbd5e1' }}>Model:</span>
        <input
          value={settings.model}
          onChange={(e) => setSettings({ model: e.target.value })}
          className="text-xs px-2 py-1 rounded outline-none w-32 no-drag"
          style={{ background: 'rgba(26,40,84,0.5)', color: '#f1f5f9', border: '1px solid rgba(139,92,246,0.2)' }}
          placeholder="model adı"
        />
      </div>

      {/* Connection badge */}
      <motion.button
        whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.95 }}
        onClick={testConnection}
        className="no-drag flex items-center gap-1.5 px-3 py-1 rounded-full text-xs cursor-pointer transition-all"
        style={{ background: 'rgba(26,40,84,0.4)', border: `1px solid ${statusColor}50`, color: statusColor, boxShadow: `0 0 8px ${statusColor}20` }}>
        {connectionStatus === 'testing'
          ? <Loader2 size={12} className="animate-spin" />
          : connectionStatus === 'connected' ? <Wifi size={12} /> : <WifiOff size={12} />}
        {connectionStatus === 'testing' ? 'Test...' : connectionStatus === 'connected' ? 'Bağlı' : connectionStatus === 'disconnected' ? 'Bağlantı Yok' : 'Test Et'}
      </motion.button>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Pet mode button */}
      <motion.button
        whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
        onClick={togglePet}
        className="no-drag flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer"
        style={{
          background: petModeOpen ? 'rgba(0,229,255,0.15)' : 'rgba(15,23,42,0.8)',
          border: `1px solid ${petModeOpen ? 'rgba(0,229,255,0.5)' : 'rgba(124,58,237,0.3)'}`,
          color: petModeOpen ? '#00e5ff' : '#94a3b8',
        }}>
        <Monitor size={14} />
        Pet Modu
      </motion.button>

      {/* Settings */}
      <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
        className="no-drag p-1.5 rounded-lg cursor-pointer"
        style={{ background: 'rgba(15,23,42,0.8)', border: '1px solid rgba(124,58,237,0.3)', color: '#94a3b8' }}
        onClick={() => useAppStore.getState().setActiveTab('gelistirici')}>
        <Settings size={15} />
      </motion.button>

      {/* Window controls */}
      <div className="no-drag flex items-center gap-1 ml-2">
        <button onClick={() => window.alice?.window.minimize()}
          className="w-6 h-6 rounded flex items-center justify-center transition-colors cursor-pointer"
          style={{ background: 'rgba(15,23,42,0.8)', color: '#94a3b8' }}>
          <Minus size={11} />
        </button>
        <button onClick={() => window.alice?.window.maximize()}
          className="w-6 h-6 rounded flex items-center justify-center transition-colors cursor-pointer"
          style={{ background: 'rgba(15,23,42,0.8)', color: '#94a3b8' }}>
          <Maximize2 size={11} />
        </button>
        <button onClick={() => window.alice?.window.close()}
          className="w-6 h-6 rounded flex items-center justify-center transition-colors cursor-pointer"
          style={{ background: 'rgba(15,23,42,0.8)' }}
          onMouseEnter={(e) => (e.currentTarget.style.background = '#ff4d6d')}
          onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(15,23,42,0.8)')}>
          <X size={11} style={{ color: '#94a3b8' }} />
        </button>
      </div>
    </div>
  )
}
