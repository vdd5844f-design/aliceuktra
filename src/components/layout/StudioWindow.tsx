import React from 'react'
import { motion } from 'framer-motion'
import Toolbar from './Toolbar'
import Sidebar from './Sidebar'
import CharacterPanel from '@/components/character/CharacterPanel'
import ChatPanel from '@/components/chat/ChatPanel'
import RightPanel from '@/components/settings/RightPanel'
import StatusBar from './StatusBar'
import { useAppStore } from '@/stores/appStore'

export default function StudioWindow() {
  const activeTab = useAppStore((s) => s.activeTab)

  return (
    <div className="flex flex-col h-full w-full overflow-hidden" style={{ background: '#05070a' }}>
      {/* Cyber grid background */}
      <div className="absolute inset-0 cyber-grid pointer-events-none opacity-60" />

      {/* Ambient glow blobs */}
      <div className="absolute top-0 left-1/4 w-96 h-96 rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(124,58,237,0.08) 0%, transparent 70%)', filter: 'blur(40px)' }} />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(0,229,255,0.06) 0%, transparent 70%)', filter: 'blur(40px)' }} />

      {/* Toolbar */}
      <Toolbar />

      {/* Main content */}
      <div className="flex flex-1 overflow-hidden relative z-10">
        {/* Left sidebar nav */}
        <Sidebar />

        {/* Character panel */}
        <CharacterPanel />

        {/* Center chat panel */}
        <ChatPanel />

        {/* Right control panel */}
        <RightPanel />
      </div>

      {/* Status bar */}
      <StatusBar />
    </div>
  )
}
