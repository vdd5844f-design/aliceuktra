import React from 'react'
import { motion } from 'framer-motion'
import { MessageSquare, User, Shirt, Volume2, Brain, Settings, Code2, Boxes } from 'lucide-react'
import { useAppStore } from '../../stores/appStore'
import type { SidebarTab } from '../../types'

interface TabDef {
  id: SidebarTab
  label: string
  icon: React.ElementType
}

const TABS: TabDef[] = [
  { id: 'sohbet',      label: 'Sohbet',       icon: MessageSquare },
  { id: 'karakter',    label: 'Karakter',     icon: User },
  { id: 'kiyafet',     label: 'Kıyafet',      icon: Shirt },
  { id: 'ses',         label: 'Ses',          icon: Volume2 },
  { id: 'hafiza',      label: 'Hafıza',       icon: Brain },
  { id: 'ayarlar',     label: 'Ayarlar',      icon: Settings },
  { id: 'gelistirici',   label: 'Gelişt.',      icon: Code2 },
  { id: 'model-studio', label: '3D Stüdyo',   icon: Boxes },
]

export default function Sidebar() {
  const { activeTab, setActiveTab } = useAppStore()

  return (
    <div
      className="flex flex-col items-center py-3 gap-0.5 flex-shrink-0"
      style={{
        width: 62,
        background: 'rgba(7,10,28,0.92)',
        borderRight: '1px solid rgba(139,92,246,0.1)',
      }}
    >
      {TABS.map(tab => {
        const active = activeTab === tab.id
        const Icon = tab.icon
        return (
          <motion.button
            key={tab.id}
            whileHover={{ x: 1.5 }}
            whileTap={{ scale: 0.92 }}
            onClick={() => setActiveTab(tab.id)}
            title={tab.label}
            className="relative flex flex-col items-center justify-center w-12 h-12 rounded-xl gap-0.5 cursor-pointer transition-all"
            style={{
              background: active ? 'rgba(139,92,246,0.14)' : 'transparent',
              border: `1px solid ${active ? 'rgba(139,92,246,0.32)' : 'transparent'}`,
              color: active ? '#8b5cf6' : '#64748b',
              boxShadow: active ? '0 0 14px rgba(139,92,246,0.13)' : 'none',
            }}
          >
            {/* Active indicator bar */}
            {active && (
              <motion.div
                layoutId="sidebar-indicator"
                className="absolute left-0 top-3 bottom-3 w-0.5 rounded-r-full"
                style={{ background: '#8b5cf6', boxShadow: '0 0 6px #8b5cf6' }}
              />
            )}
            <Icon size={17} strokeWidth={active ? 2.2 : 1.8} />
            <span
              className="text-[9px] leading-none"
              style={{ fontFamily: 'Rajdhani, sans-serif', letterSpacing: '0.02em' }}
            >
              {tab.label}
            </span>
          </motion.button>
        )
      })}
    </div>
  )
}
