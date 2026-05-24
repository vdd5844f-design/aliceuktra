import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { Minimize2, Maximize2, X, Wifi, WifiOff, Loader2, RefreshCw } from 'lucide-react'
import { useAppStore } from '../../stores/appStore'

const alice = () =>
  (window as unknown as Record<string, unknown>)['alice'] as
    Record<string, Record<string, (...args: unknown[]) => unknown>>

export default function Toolbar() {
  const {
    settings, setSettings,
    connectionStatus, setConnectionStatus,
    characters, activeCharacterId, setActiveCharacterId,
    activeOutfitId, setActiveOutfitId,
    setScanResult,
  } = useAppStore()

  const activeChar = characters.find(c => c.id === activeCharacterId)
  const [reloading, setReloading] = useState(false)

  const testConnection = async () => {
    setConnectionStatus('testing')
    try {
      const result = await alice().ai.test({
        provider: settings.provider,
        baseUrl: settings.baseUrl,
        apiKey: settings.apiKey,
        model: settings.model,
      }) as { success: boolean }
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

  const statusColor =
    connectionStatus === 'connected'    ? '#10b981' :
    connectionStatus === 'disconnected' ? '#ec4899' :
    connectionStatus === 'testing'      ? '#f59e0b' : '#64748b'

  const statusLabel =
    connectionStatus === 'connected'    ? 'Bağlı' :
    connectionStatus === 'disconnected' ? 'Bağlantı Yok' :
    connectionStatus === 'testing'      ? 'Test...' : 'Yapay Zeka Testi'

  return (
    <div
      className="drag-region flex items-center h-11 px-3 gap-2 relative z-20 flex-shrink-0"
      style={{ background: 'rgba(7,10,28,0.98)', borderBottom: '1px solid rgba(139,92,246,0.1)' }}
    >
      {/* Logo */}
      <div className="no-drag flex items-center gap-2 mr-1 flex-shrink-0">
        <div
          className="w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0"
          style={{ background: 'linear-gradient(135deg, #8b5cf6 0%, #06b6d4 100%)' }}
        >
          <span style={{ color: '#fff', fontWeight: 700, fontSize: 11, fontFamily: 'Rajdhani, sans-serif' }}>A</span>
        </div>
        <span
          className="text-sm font-bold tracking-widest hidden sm:block"
          style={{ fontFamily: 'Rajdhani, sans-serif', color: '#f1f5f9', letterSpacing: '0.1em' }}
        >
          ALICE AI ULTRA
        </span>
      </div>

      <div className="w-px h-4 flex-shrink-0" style={{ background: 'rgba(139,92,246,0.18)' }} />

      {/* Karakter */}
      <div className="no-drag flex items-center gap-1.5 flex-shrink-0">
        <span className="text-[11px]" style={{ color: '#64748b' }}>Karakter</span>
        <select
          value={activeCharacterId}
          onChange={e => setActiveCharacterId(e.target.value)}
          className="text-[11px] px-2 py-1 rounded-lg outline-none cursor-pointer"
          style={{ background: 'rgba(18,28,62,0.8)', color: '#f1f5f9', border: '1px solid rgba(139,92,246,0.2)' }}
        >
          {characters.length === 0
            ? <option value="">Taranıyor...</option>
            : characters.map(c => <option key={c.id} value={c.id}>{c.name}</option>)
          }
        </select>
      </div>

      {/* Kıyafet */}
      <div className="no-drag flex items-center gap-1.5 flex-shrink-0">
        <span className="text-[11px]" style={{ color: '#64748b' }}>Kıyafet</span>
        <select
          value={activeOutfitId}
          onChange={e => setActiveOutfitId(e.target.value)}
          className="text-[11px] px-2 py-1 rounded-lg outline-none cursor-pointer"
          style={{ background: 'rgba(18,28,62,0.8)', color: '#f1f5f9', border: '1px solid rgba(139,92,246,0.2)', maxWidth: 148 }}
        >
          {!activeChar || activeChar.outfits.length === 0
            ? <option value="">Kıyafet yok</option>
            : activeChar.outfits.map(o => <option key={o.id} value={o.id}>{o.name}</option>)
          }
        </select>
      </div>

      {/* Model */}
      <div className="no-drag flex items-center gap-1.5 flex-shrink-0">
        <span className="text-[11px]" style={{ color: '#64748b' }}>Model</span>
        <input
          value={settings.model}
          onChange={e => setSettings({ model: e.target.value })}
          className="text-[11px] px-2 py-1 rounded-lg outline-none w-28"
          style={{ background: 'rgba(18,28,62,0.8)', color: '#f1f5f9', border: '1px solid rgba(139,92,246,0.2)' }}
          placeholder="model adı"
        />
      </div>

      <div className="flex-1" />

      {/* Varlıkları yenile */}
      <motion.button
        whileHover={{ scale: 1.04 }}
        whileTap={{ scale: 0.96 }}
        onClick={reloadAssets}
        className="no-drag flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] cursor-pointer flex-shrink-0"
        style={{ background: 'rgba(6,182,212,0.07)', border: '1px solid rgba(6,182,212,0.2)', color: '#06b6d4' }}
      >
        <RefreshCw size={11} className={reloading ? 'animate-spin' : ''} />
        Yenile
      </motion.button>

      {/* Bağlantı testi */}
      <motion.button
        whileHover={{ scale: 1.04 }}
        whileTap={{ scale: 0.96 }}
        onClick={testConnection}
        className="no-drag flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] cursor-pointer flex-shrink-0"
        style={{
          background: `${statusColor}0d`,
          border: `1px solid ${statusColor}40`,
          color: statusColor,
          boxShadow: connectionStatus === 'connected' ? `0 0 8px ${statusColor}18` : 'none',
        }}
      >
        {connectionStatus === 'testing'
          ? <Loader2 size={11} className="animate-spin" />
          : connectionStatus === 'connected'
            ? <Wifi size={11} />
            : <WifiOff size={11} />
        }
        {statusLabel}
      </motion.button>

      {/* Window controls */}
      <div className="no-drag flex items-center gap-1 ml-1 flex-shrink-0">
        {([
          { Icon: Minimize2, action: () => alice().window.minimize(), color: '#64748b', hover: '#94a3b8' },
          { Icon: Maximize2, action: () => alice().window.maximize(), color: '#64748b', hover: '#94a3b8' },
          { Icon: X,         action: () => alice().window.close(),    color: '#64748b', hover: '#ec4899' },
        ] as const).map(({ Icon, action, color }, i) => (
          <motion.button
            key={i}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={action as () => void}
            className="w-7 h-7 rounded-lg flex items-center justify-center cursor-pointer"
            style={{ color, background: 'rgba(139,92,246,0.05)', border: '1px solid rgba(139,92,246,0.1)' }}
          >
            <Icon size={13} />
          </motion.button>
        ))}
      </div>
    </div>
  )
}
