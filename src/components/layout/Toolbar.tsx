import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { Minimize2, Maximize2, X, Wifi, WifiOff, Loader2, RefreshCw } from 'lucide-react'
import { useAppStore } from '../../stores/appStore'
import { PROVIDERS } from '../../types'

const alice = () => (window as unknown as Record<string, unknown>)['alice'] as Record<string, Record<string, (...args: unknown[]) => unknown>>

export default function Toolbar() {
  const { settings, setSettings, connectionStatus, setConnectionStatus, characters, activeCharacterId, setActiveCharacterId, activeOutfitId, setActiveOutfitId, setScanResult } = useAppStore()
  const activeChar = characters.find(c => c.id === activeCharacterId)
  const [reloading, setReloading] = useState(false)

  const testConnection = async () => {
    setConnectionStatus('testing')
    try {
      const result = await alice().ai.test({ provider: settings.provider, baseUrl: settings.baseUrl, apiKey: settings.apiKey, model: settings.model }) as { success: boolean }
      setConnectionStatus(result.success ? 'connected' : 'disconnected')
    } catch {
      setConnectionStatus('disconnected')
    }
  }

  const reloadAssets = async () => {
    setReloading(true)
    try {
      const result = await alice().assets.reload() as Parameters<typeof setScanResult>[0]
      setScanResult(result)
    } finally {
      setReloading(false)
    }
  }

  const statusColor = connectionStatus === 'connected' ? '#10b981' : connectionStatus === 'disconnected' ? '#ec4899' : connectionStatus === 'testing' ? '#f59e0b' : '#64748b'

  return (
    <div className="drag-region flex items-center h-12 px-4 gap-3 relative z-20 flex-shrink-0"
      style={{ background: 'rgba(8,12,32,0.98)', borderBottom: '1px solid rgba(139,92,246,0.12)' }}>

      {/* Logo */}
      <div className="no-drag flex items-center gap-2 mr-1">
        <div className="w-6 h-6 rounded-md flex items-center justify-center"
          style={{ background: 'linear-gradient(135deg, #8b5cf6, #06b6d4)' }}>
          <span style={{ color: '#fff', fontWeight: 700, fontSize: 11, fontFamily: 'Rajdhani, sans-serif' }}>A</span>
        </div>
        <span className="text-sm font-bold tracking-widest"
          style={{ fontFamily: 'Rajdhani, sans-serif', color: '#f1f5f9', letterSpacing: '0.08em' }}>
          ALICE AI ULTRA
        </span>
      </div>

      <div className="w-px h-5 mx-1" style={{ background: 'rgba(139,92,246,0.2)' }} />

      {/* Karakter secimi */}
      <div className="no-drag flex items-center gap-1.5">
        <span className="text-xs" style={{ color: '#94a3b8' }}>Karakter:</span>
        <select value={activeCharacterId} onChange={e => setActiveCharacterId(e.target.value)}
          className="text-xs px-2 py-1 rounded-lg outline-none no-drag"
          style={{ background: 'rgba(20,32,70,0.7)', color: '#f1f5f9', border: '1px solid rgba(139,92,246,0.2)', cursor: 'pointer' }}>
          {characters.length === 0
            ? <option value="">Taranıyor...</option>
            : characters.map(c => <option key={c.id} value={c.id}>{c.name}</option>)
          }
        </select>
      </div>

      {/* Kıyafet secimi */}
      <div className="no-drag flex items-center gap-1.5">
        <span className="text-xs" style={{ color: '#94a3b8' }}>Kıyafet:</span>
        <select value={activeOutfitId} onChange={e => setActiveOutfitId(e.target.value)}
          className="text-xs px-2 py-1 rounded-lg outline-none no-drag"
          style={{ background: 'rgba(20,32,70,0.7)', color: '#f1f5f9', border: '1px solid rgba(139,92,246,0.2)', cursor: 'pointer', maxWidth: 160 }}>
          {activeChar?.outfits.length === 0
            ? <option value="">Kıyafet yok</option>
            : activeChar?.outfits.map(o => <option key={o.id} value={o.id}>{o.name}</option>)
          }
        </select>
      </div>

      {/* Saglayıcı */}
      <div className="no-drag flex items-center gap-1.5">
        <span className="text-xs" style={{ color: '#94a3b8' }}>Sağlayıcı:</span>
        <select value={settings.provider} onChange={e => setSettings({ provider: e.target.value as typeof settings.provider })}
          className="text-xs px-2 py-1 rounded-lg outline-none no-drag"
          style={{ background: 'rgba(20,32,70,0.7)', color: '#f1f5f9', border: '1px solid rgba(139,92,246,0.2)', cursor: 'pointer' }}>
          {PROVIDERS.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
        </select>
      </div>

      {/* Model */}
      <div className="no-drag flex items-center gap-1.5">
        <span className="text-xs" style={{ color: '#94a3b8' }}>Model:</span>
        <input value={settings.model} onChange={e => setSettings({ model: e.target.value })}
          className="text-xs px-2 py-1 rounded-lg outline-none w-28 no-drag"
          style={{ background: 'rgba(20,32,70,0.7)', color: '#f1f5f9', border: '1px solid rgba(139,92,246,0.2)' }}
          placeholder="model adı" />
      </div>

      <div className="flex-1" />

      {/* Varlıkları yenile */}
      <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
        onClick={reloadAssets}
        className="no-drag flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs cursor-pointer"
        style={{ background: 'rgba(6,182,212,0.08)', border: '1px solid rgba(6,182,212,0.2)', color: '#06b6d4' }}>
        <RefreshCw size={12} className={reloading ? 'animate-spin' : ''} />
        Varlıkları Yenile
      </motion.button>

      {/* Baglantı testi */}
      <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
        onClick={testConnection}
        className="no-drag flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs cursor-pointer"
        style={{ background: 'rgba(20,32,70,0.5)', border: `1px solid ${statusColor}50`, color: statusColor, boxShadow: `0 0 8px ${statusColor}15` }}>
        {connectionStatus === 'testing' ? <Loader2 size={12} className="animate-spin" /> : connectionStatus === 'connected' ? <Wifi size={12} /> : <WifiOff size={12} />}
        {connectionStatus === 'testing' ? 'Test...' : connectionStatus === 'connected' ? 'Bağlı' : connectionStatus === 'disconnected' ? 'Bağlantı Yok' : 'Yapay Zeka Testi'}
      </motion.button>

      {/* Pencere kontrolleri */}
      <div className="no-drag flex items-center gap-1 ml-1">
        {[{ Icon: Minimize2, action: () => alice().window.minimize(), color: '#64748b' },
          { Icon: Maximize2, action: () => alice().window.maximize(), color: '#64748b' },
          { Icon: X, action: () => alice().window.close(), color: '#ec4899' }].map(({ Icon, action, color }, i) => (
          <motion.button key={i} whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
            onClick={action}
            className="w-7 h-7 rounded-lg flex items-center justify-center cursor-pointer"
            style={{ color, background: 'rgba(139,92,246,0.06)', border: '1px solid rgba(139,92,246,0.1)' }}>
            <Icon size={13} />
          </motion.button>
        ))}
      </div>
    </div>
  )
}
