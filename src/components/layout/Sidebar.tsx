import React from 'react'
import { motion } from 'framer-motion'
import { MessageSquare, User, Shirt, Volume2, Brain, Settings, Code2 } from 'lucide-react'
import { useAppStore } from '../../stores/appStore'
import type { SidebarTab } from '../../types'

const TABS: { id: SidebarTab; label: string; icon: React.ElementType }[] = [
  { id: 'sohbet',     label: 'Sohbet',      icon: MessageSquare },
  { id: 'karakter',   label: 'Karakter',    icon: User },
  { id: 'kiyafet',    label: 'Kıyafet',     icon: Shirt },
  { id: 'ses',        label: 'Ses',         icon: Volume2 },
  { id: 'hafiza',     label: 'Hafıza',      icon: Brain },
  { id: 'ayarlar',    label: 'Ayarlar',     icon: Settings },
  { id: 'gelistirici',label: 'Geliştirici', icon: Code2 },
]

export default function Sidebar() {
  const { activeTab, setActiveTab } = useAppStore()
  return (
    <div className="flex flex-col items-center py-3 gap-0.5 flex-shrink-0"
      style={{ width: 62, background: 'rgba(8,12,32,0.8)', borderRight: '1px solid rgba(139,92,246,0.12)' }}>
      {TABS.map(tab => {
        const active = activeTab === tab.id
        const Icon = tab.icon
        return (
          <motion.button key={tab.id}
            whileHover={{ x: 2 }} whileTap={{ scale: 0.93 }}
            onClick={() => setActiveTab(tab.id)}
            title={tab.label}
            className="relative flex flex-col items-center justify-center w-12 h-12 rounded-xl gap-0.5 cursor-pointer"
            style={{
              background: active ? 'rgba(139,92,246,0.15)' : 'transparent',
              border: active ? '1px solid rgba(139,92,246,0.3)' : '1px solid transparent',
              color: active ? '#8b5cf6' : '#64748b',
              boxShadow: active ? '0 0 12px rgba(139,92,246,0.15)' : 'none',
              transition: 'all 0.15s',
            }}>
            {active && (
              <motion.div layoutId="sidebar-indicator"
                className="absolute left-0 top-3 bottom-3 w-0.5 rounded-r-full"
                style={{ background: '#8b5cf6', boxShadow: '0 0 6px #8b5cf6' }} />
            )}
            <Icon size={17} />
            <span className="text-[9px] leading-none" style={{ fontFamily: 'Rajdhani, sans-serif', letterSpacing: '0.03em' }}>
              {tab.label.slice(0, 7)}
            </span>
          </motion.button>
        )
      })}
    </div>
  )
}
