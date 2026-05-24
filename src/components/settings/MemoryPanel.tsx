import React from 'react'
import { motion } from 'framer-motion'
import { Trash2, Brain } from 'lucide-react'
import { useAppStore } from '@/stores/appStore'

export default function MemoryPanel() {
  const { messages, clearMessages } = useAppStore()

  return (
    <div className="flex flex-col overflow-y-auto flex-shrink-0 p-4"
      style={{ width: 260, background: 'rgba(5,7,10,0.5)' }}>
      <div className="flex items-center gap-2 mb-4">
        <Brain size={16} style={{ color: '#a855f7' }} />
        <span className="text-xs font-bold tracking-widest" style={{ fontFamily: 'Rajdhani, sans-serif', color: '#a855f7' }}>
          HAFIZA
        </span>
      </div>

      <div className="glass-card rounded-xl p-3 mb-3" style={{ border: '1px solid rgba(124,58,237,0.2)' }}>
        <div className="text-xs mb-1" style={{ color: '#94a3b8' }}>Konuşma Geçmişi</div>
        <div className="text-2xl font-bold" style={{ color: '#a855f7', fontFamily: 'Rajdhani, sans-serif' }}>
          {messages.length}
        </div>
        <div className="text-[10px]" style={{ color: '#475569' }}>mesaj</div>
      </div>

      <div className="text-xs mb-3" style={{ color: '#475569' }}>
        Konuşma geçmişi bellekte tutulur. Temizlediğinizde AI önceki mesajları hatırlamayacak.
      </div>

      <motion.button
        whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
        onClick={clearMessages}
        className="flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-bold cursor-pointer"
        style={{
          background: 'rgba(255,77,109,0.1)',
          border: '1px solid rgba(255,77,109,0.3)',
          color: '#ff4d6d',
          fontFamily: 'Rajdhani, sans-serif',
        }}>
        <Trash2 size={14} /> Hafızayı Temizle
      </motion.button>
    </div>
  )
}
