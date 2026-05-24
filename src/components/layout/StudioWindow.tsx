import React, { useEffect } from 'react'
import Toolbar from './Toolbar'
import Sidebar from './Sidebar'
import StatusBar from './StatusBar'
import CharacterPanel from '../character/CharacterPanel'
import ChatPanel from '../chat/ChatPanel'
import RightPanel from '../settings/RightPanel'
import ModelStudioPage from '../../features/model-studio/ModelStudioPage'
import { useAppStore } from '../../stores/appStore'

const alice = () =>
  (window as unknown as Record<string, unknown>)['alice'] as
    Record<string, Record<string, (...args: unknown[]) => unknown>>

export default function StudioWindow() {
  const { activeTab, setScanResult, setSettings } = useAppStore()
  const showRight = activeTab !== 'sohbet' && activeTab !== 'model-studio'
  const isModelStudio = activeTab === 'model-studio'

  // ── On mount: load saved settings then scan assets
  useEffect(() => {
    const init = async () => {
      // Load persisted settings from Electron
      try {
        const saved = await alice().settings.get() as Record<string, unknown>
        if (saved && typeof saved === 'object') {
          setSettings(saved as Parameters<typeof setSettings>[0])
        }
      } catch { /* browser preview — ignore */ }

      // Scan assets
      try {
        const result = await alice().assets.scan() as Parameters<typeof setScanResult>[0]
        setScanResult(result)
      } catch { /* ignore scan failure */ }
    }
    init()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div
      className="flex flex-col w-full h-screen overflow-hidden cyber-grid"
      style={{ background: '#090d24' }}
    >
      <Toolbar />

      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        {isModelStudio ? (
          <div className="flex-1 overflow-hidden">
            <ModelStudioPage />
          </div>
        ) : (
          <>
            <CharacterPanel />
            <ChatPanel />
            {showRight && <RightPanel />}
          </>
        )}
      </div>

      <StatusBar />
    </div>
  )
}
