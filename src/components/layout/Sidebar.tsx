import React from 'react'
import { motion } from 'framer-motion'
import {
  MessageSquare, User, Shirt, Smile, Volume2, Brain, Code2
} from 'lucide-react'
import { useAppStore } from '@/stores/appStore'
import type { SidebarTab } from '@/types'

const TABS: { id: SidebarTab; label: string; icon: React.ComponentType<{ size?: number }> }[] = [
  { id: 'sohbet',     label: 'Sohbet',      icon: MessageSquare },
  { id: 'karakter',   label: 'Karakter',    icon: User },
  { id: 'kiyafet',    label: 'Kıyafet',     icon: Shirt },
  { id: 'duygu',      label: 'Duygu',       icon: Smile },
  { id: 'ses',        label: 'Ses',         icon: Volume2 },
  { id: 'hafiza',     label: 'Hafıza',      icon: Brain },
  { id: 'gelistirici',label: 'Geliştirici', icon: Code2 },
]

export default function Sidebar() {
  const { activeTab, setActiveTab } = useAppStore()

  return (
    <div className="flex flex-col items-center py-4 gap-1 flex-shrink-0"
      style={{
        width: 64,
        background: 'rgba(5,7,10,0.9)',
        borderRight: '1px solid rgba(124,58,237,0.2)',
      }}>
      {TABS.map((tab) => {
        const active = activeTab === tab.id
        const Icon = tab.icon
        return (
          <motion.button
            key={tab.id}
            whileHover={{ scale: 1.08, x: 2 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setActiveTab(tab.id)}
            title={tab.label}
            className="relative flex flex-col items-center justify-center w-12 h-12 rounded-lg gap-0.5 cursor-pointer transition-all"
            style={{
              background: active ? 'rgba(124,58,237,0.2)' : 'transparent',
              border: active ? '1px solid rgba(124,58,237,0.5)' : '1px solid transparent',
              color: active ? '#a855f7' : '#475569',
              boxShadow: active ? '0 0 12px rgba(124,58,237,0.3)' : 'none',
            }}>
            {/* Active indicator line */}
            {active && (
              <motion.div
                layoutId="sidebar-active"
                className="absolute left-0 top-2 bottom-2 w-0.5 rounded-full"
                style={{ background: '#a855f7', boxShadow: '0 0 6px #a855f7' }}
              />
            )}
            <Icon size={18} />
            <span className="text-[9px] leading-none font-medium" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
              {tab.label.slice(0, 6)}
            </span>
          </motion.button>
        )
      })}
    </div>
  )
}
