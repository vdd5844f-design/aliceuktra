import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useAppStore } from '@/stores/appStore'

export default function StatusBar() {
  const { settings, isTalking, connectionStatus } = useAppStore()
  const [time, setTime] = useState(new Date())
  const [fps] = useState(60)

  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(t)
  }, [])

  const timeStr = time.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
  const dateStr = time.toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric' })

  return (
    <div className="flex items-center h-7 px-4 gap-4 flex-shrink-0 text-xs"
      style={{
        background: 'rgba(10,14,39,0.95)',
        borderTop: '1px solid rgba(139,92,246,0.15)',
        color: '#64748b',
        fontFamily: 'Rajdhani, sans-serif',
      }}>

      {/* Voice status */}
      <div className="flex items-center gap-1.5">
        <motion.div
          animate={{ opacity: isTalking ? [1, 0.3, 1] : 1 }}
          transition={{ duration: 0.6, repeat: isTalking ? Infinity : 0 }}
          className="w-1.5 h-1.5 rounded-full"
          style={{ background: isTalking ? '#10b981' : '#64748b', boxShadow: isTalking ? '0 0 6px #10b981' : 'none' }}
        />
        <span style={{ color: isTalking ? '#10b981' : '#64748b' }}>
          Ses: {isTalking ? 'Konuşuyor' : 'Bekliyor'}
        </span>
      </div>

      <div className="w-px h-3" style={{ background: 'rgba(139,92,246,0.15)' }} />

      {/* Connection */}
      <div className="flex items-center gap-1.5">
        <div className="w-1.5 h-1.5 rounded-full"
          style={{
            background: connectionStatus === 'connected' ? '#10b981' : connectionStatus === 'disconnected' ? '#ec4899' : '#f59e0b',
            boxShadow: connectionStatus === 'connected' ? '0 0 6px #10b981' : 'none',
          }} />
        <span>{settings.provider} / {settings.model}</span>
      </div>

      <div className="w-px h-3" style={{ background: 'rgba(139,92,246,0.15)' }} />

      {/* FPS */}
      <div className="flex items-center gap-1">
        <span style={{ color: '#8b5cf6' }}>FPS:</span>
        <span>{fps}</span>
      </div>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Clock */}
      <div className="flex items-center gap-2">
        <span style={{ color: '#64748b' }}>{dateStr}</span>
        <span style={{ color: '#06b6d4', textShadow: '0 0 8px rgba(6,182,212,0.4)' }}>{timeStr}</span>
      </div>
    </div>
  )
}
