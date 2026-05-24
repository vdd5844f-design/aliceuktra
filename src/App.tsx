import React, { useEffect } from 'react'
import { useAppStore } from '@/stores/appStore'
import StudioWindow from '@/components/layout/StudioWindow'
import PetWindow from '@/components/layout/PetWindow'

// Detect if this is the pet window via hash
const isPetMode = typeof window !== 'undefined' && window.location.hash === '#/pet'

export default function App() {
  const { setSettings, setCharacters, setConnectionStatus } = useAppStore()

  useEffect(() => {
    // Load settings from Electron store if available
    if (window.alice) {
      window.alice.settings.get().then((s) => {
        if (s) setSettings(s)
      }).catch(() => {})

      // Scan assets
      window.alice.assets.scan().then((result) => {
        if (result.success) setCharacters(result.characters)
      }).catch(() => {})

      // Voice event listeners
      window.alice.voice.onDone(() => {
        useAppStore.getState().setIsTalking(false)
        const prev = useAppStore.getState().emotion
        if (prev === 'talk') useAppStore.getState().setEmotion('idle')
      })
    }
  }, [])

  if (isPetMode) return <PetWindow />
  return <StudioWindow />
}
