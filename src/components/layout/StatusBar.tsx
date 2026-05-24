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
        background: 'rgba(5,7,10,0.95)',
        borderTop: '1px solid rgba(124,58,237,0.2)',
        color: '#475569',
        fontFamily: 'Rajdhani, sans-serif',
      }}>

      {/* Voice status */}
      <div className="flex items-center gap-1.5">
        <motion.div
          animate={{ opacity: isTalking ? [1, 0.3, 1] : 1 }}
          transition={{ duration: 0.6, repeat: isTalking ? Infinity : 0 }}
          className="w-1.5 h-1.5 rounded-full"
          style={{ background: isTalking ? '#00ff99' : '#475569', boxShadow: isTalking ? '0 0 4px #00ff99' : 'none' }}
        />
        <span style={{ color: isTalking ? '#00ff99' : '#475569' }}>
          Ses: {isTalking ? 'Konuşuyor' : 'Bekliyor'}
        </span>
      </div>

      <div className="w-px h-3" style={{ background: 'rgba(124,58,237,0.2)' }} />

      {/* Connection */}
      <div className="flex items-center gap-1.5">
        <div className="w-1.5 h-1.5 rounded-full"
          style={{
            background: connectionStatus === 'connected' ? '#00ff99' : connectionStatus === 'disconnected' ? '#ff4d6d' : '#f59e0b',
            boxShadow: connectionStatus === 'connected' ? '0 0 4px #00ff99' : 'none',
          }} />
        <span>{settings.provider} / {settings.model}</span>
      </div>

      <div className="w-px h-3" style={{ background: 'rgba(124,58,237,0.2)' }} />

      {/* FPS */}
      <div className="flex items-center gap-1">
        <span style={{ color: '#a855f7' }}>FPS:</span>
        <span>{fps}</span>
      </div>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Clock */}
      <div className="flex items-center gap-2">
        <span style={{ color: '#94a3b8' }}>{dateStr}</span>
        <span style={{ color: '#00e5ff', textShadow: '0 0 6px rgba(0,229,255,0.6)' }}>{timeStr}</span>
      </div>
    </div>
  )
}
