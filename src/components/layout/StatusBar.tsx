import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useAppStore } from '../../stores/appStore'

export default function StatusBar() {
  const { connectionStatus, settings, isTalking, characters, activeCharacterId, activeOutfitId, scanResult } = useAppStore()
  const [timeStr, setTimeStr] = useState('')
  const [fps, setFps] = useState(60)

  useEffect(() => {
    const tick = () => setTimeStr(new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }))
    tick()
    const t = setInterval(tick, 1000)
    return () => clearInterval(t)
  }, [])

  useEffect(() => {
    let frames = 0; let lastTime = performance.now()
    const loop = () => {
      frames++
      const now = performance.now()
      if (now - lastTime >= 1000) { setFps(frames); frames = 0; lastTime = now }
      requestAnimationFrame(loop)
    }
    const id = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(id)
  }, [])

  const statusColor = connectionStatus === 'connected' ? '#10b981' : connectionStatus === 'disconnected' ? '#ec4899' : '#f59e0b'
  const char = characters.find(c => c.id === activeCharacterId)
  const outfit = char?.outfits.find(o => o.id === activeOutfitId)

  return (
    <div className="flex items-center h-6 px-4 gap-3 flex-shrink-0 text-[10px] select-none"
      style={{ background: 'rgba(8,12,32,0.98)', borderTop: '1px solid rgba(139,92,246,0.12)', color: '#475569', fontFamily: 'Rajdhani, sans-serif' }}>
      {/* Ses */}
      <div className="flex items-center gap-1">
        <motion.div className="w-1.5 h-1.5 rounded-full"
          style={{ background: isTalking ? '#10b981' : '#374151', boxShadow: isTalking ? '0 0 4px #10b981' : 'none' }}
          animate={{ opacity: isTalking ? [1, 0.3, 1] : 1 }}
          transition={{ duration: 0.6, repeat: isTalking ? Infinity : 0 }} />
        <span style={{ color: isTalking ? '#10b981' : '#475569' }}>Ses: {isTalking ? 'Konusuyor' : 'Bekliyor'}</span>
      </div>
      <div className="w-px h-3" style={{ background: 'rgba(139,92,246,0.1)' }} />
      {/* Baglantı */}
      <div className="flex items-center gap-1">
        <div className="w-1.5 h-1.5 rounded-full" style={{ background: statusColor, boxShadow: connectionStatus === 'connected' ? `0 0 4px ${statusColor}` : 'none' }} />
        <span>{settings.provider} / {settings.model}</span>
      </div>
      <div className="w-px h-3" style={{ background: 'rgba(139,92,246,0.1)' }} />
      {/* Karakter */}
      {char && <span style={{ color: '#8b5cf6' }}>{char.name}{outfit ? ` · ${outfit.name}` : ''}</span>}
      <div className="w-px h-3" style={{ background: 'rgba(139,92,246,0.1)' }} />
      {/* Varlıklar */}
      <span>{scanResult?.totalPng ?? 0} PNG · {scanResult?.characters.length ?? 0} karakter</span>
      <div className="flex-1" />
      {/* FPS */}
      <span style={{ color: fps >= 55 ? '#10b981' : fps >= 30 ? '#f59e0b' : '#ec4899' }}>FPS: {fps}</span>
      <div className="w-px h-3" style={{ background: 'rgba(139,92,246,0.1)' }} />
      {/* Saat */}
      <span style={{ color: '#06b6d4', textShadow: '0 0 6px rgba(6,182,212,0.3)' }}>{timeStr}</span>
    </div>
  )
}
