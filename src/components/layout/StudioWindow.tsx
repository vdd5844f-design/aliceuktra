import React, { useEffect } from 'react'
import Toolbar from './Toolbar'
import Sidebar from './Sidebar'
import StatusBar from './StatusBar'
import CharacterPanel from '../character/CharacterPanel'
import ChatPanel from '../chat/ChatPanel'
import RightPanel from '../settings/RightPanel'
import { useAppStore } from '../../stores/appStore'

const alice = () => (window as unknown as Record<string, unknown>)['alice'] as Record<string, Record<string, (...args: unknown[]) => unknown>>

export default function StudioWindow() {
  const { activeTab, setScanResult } = useAppStore()
  const showRight = activeTab !== 'sohbet'

  // Scan assets on mount
  useEffect(() => {
    const run = async () => {
      try {
        const result = await alice().assets.scan() as Parameters<typeof setScanResult>[0]
        setScanResult(result)
      } catch (e) {
        console.log('[v0] Asset scan failed:', e)
      }
    }
    run()
  }, [setScanResult])

  return (
    <div className="flex flex-col w-full h-screen overflow-hidden"
      style={{ background: '#0a0e27' }}>
      <Toolbar />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <CharacterPanel />
        <ChatPanel />
        {showRight && <RightPanel />}
      </div>
      <StatusBar />
    </div>
  )
}
