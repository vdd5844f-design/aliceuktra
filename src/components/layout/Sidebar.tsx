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
        background: 'rgba(20,30,60,0.4)',
        borderRight: '1px solid rgba(139,92,246,0.15)',
      }}>
      {TABS.map((tab) => {
        const active = activeTab === tab.id
        const Icon = tab.icon
        return (
          <motion.button
            key={tab.id}
            whileHover={{ scale: 1.1, x: 2 }}
            whileTap={{ scale: 0.92 }}
            onClick={() => setActiveTab(tab.id)}
            title={tab.label}
            className="relative flex flex-col items-center justify-center w-12 h-12 rounded-lg gap-0.5 cursor-pointer transition-all"
            style={{
              background: active ? 'rgba(139,92,246,0.15)' : 'transparent',
              border: active ? '1px solid rgba(139,92,246,0.35)' : '1px solid rgba(139,92,246,0.08)',
              color: active ? '#8b5cf6' : '#64748b',
              boxShadow: active ? '0 0 16px rgba(139,92,246,0.2)' : 'none',
            }}>
            {/* Active indicator line */}
            {active && (
              <motion.div
                layoutId="sidebar-active"
                className="absolute left-0 top-2 bottom-2 w-0.5 rounded-full"
                style={{ background: '#8b5cf6', boxShadow: '0 0 8px #8b5cf6' }}
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
