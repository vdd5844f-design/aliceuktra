import React, { useEffect, useRef, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Shuffle } from 'lucide-react'
import { useAppStore } from '@/stores/appStore'
import type { Emotion } from '@/types'

const EMOTIONS: Emotion[] = ['idle', 'talk', 'happy', 'angry', 'sleep', 'move']
const EMOTION_LABELS: Record<Emotion, string> = {
  idle: 'Normal', talk: 'Konuşma', happy: 'Mutlu', angry: 'Kızgın', sleep: 'Uyku', move: 'Hareket'
}

export default function CharacterPanel() {
  const { characters, activeCharacter, activeOutfit, emotion, isTalking, setEmotion, setCurrentFrame, currentFrame } = useAppStore()
  const frameRef = useRef<number>(0)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const [displayFrame, setDisplayFrame] = useState<string>('')

  const character = characters[activeCharacter]
  const outfit = character?.outfits[activeOutfit] || character?.outfits['default']
  const frames = outfit?.emotions[isTalking ? 'talk' : emotion] || outfit?.emotions['idle'] || []
  const isFrameAnimation = character?.mode === 'frame_animation'
  const isStaticExpression = character?.mode === 'static_expression'

  // Load frame as base64
  async function loadFrame(framePath: string) {
    if (!window.alice || !framePath) return
    const res = await window.alice.assets.getFrame(framePath).catch(() => null)
    if (res?.success && res.data) {
      setDisplayFrame(res.data)
      setCurrentFrame(res.data)
    }
  }

  // Animation loop for Alice (frame_animation)
  useEffect(() => {
    if (timerRef.current) clearInterval(timerRef.current)
    if (!frames.length) { setDisplayFrame(''); return }

    if (isStaticExpression) {
      // Aiko: pick best single frame
      const best = frames[0]
      if (best) loadFrame(best.path)
      return
    }

    // Alice: loop frames
    frameRef.current = 0
    loadFrame(frames[0].path)
    const fps = isTalking ? 12 : 8
    timerRef.current = setInterval(() => {
      frameRef.current = (frameRef.current + 1) % frames.length
      loadFrame(frames[frameRef.current].path)
    }, 1000 / fps)

    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [frames, emotion, isTalking, activeCharacter, activeOutfit])

  function randomOutfit() {
    if (!character) return
    const outfits = Object.keys(character.outfits)
    const random = outfits[Math.floor(Math.random() * outfits.length)]
    useAppStore.getState().setActiveOutfit(random)
  }

  function randomEmotion() {
    const emotions = EMOTIONS.filter((e) => e !== 'talk')
    setEmotion(emotions[Math.floor(Math.random() * emotions.length)])
  }

  return (
    <div className="flex flex-col flex-shrink-0 overflow-hidden"
      style={{
        width: 300,
        background: 'rgba(5,7,10,0.6)',
        borderRight: '1px solid rgba(124,58,237,0.2)',
      }}>

      {/* Character viewport */}
      <div className="relative flex-1 flex items-end justify-center overflow-hidden">

        {/* Holographic rings */}
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-64 h-32 pointer-events-none">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 12, repeat: Infinity, ease: 'linear' }}
            className="absolute inset-0 rounded-full border animate-hologram"
            style={{ borderColor: 'rgba(124,58,237,0.3)', transform: 'rotateX(70deg)' }}
          />
          <motion.div
            animate={{ rotate: -360 }}
            transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
            className="absolute inset-4 rounded-full border"
            style={{ borderColor: 'rgba(0,229,255,0.25)', transform: 'rotateX(70deg)' }}
          />
        </div>

        {/* Platform glow */}
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-48 h-4 rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(ellipse, rgba(124,58,237,0.5) 0%, transparent 70%)', filter: 'blur(8px)' }} />

        {/* Character image */}
        <div className="relative z-10 flex items-end justify-center pb-4" style={{ height: '100%', maxHeight: 480 }}>
          <AnimatePresence mode="wait">
            {displayFrame ? (
              <motion.img
                key={displayFrame}
                src={displayFrame}
                alt="karakter"
                className="object-contain animate-float"
                style={{ maxHeight: 440, maxWidth: 280, imageRendering: 'pixelated', filter: 'drop-shadow(0 0 16px rgba(168,85,247,0.4))' }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.05 }}
              />
            ) : (
              <motion.div
                key="placeholder"
                className="flex flex-col items-center justify-center gap-3"
                style={{ height: 320, width: 200 }}
                initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                {/* Placeholder silhouette */}
                <div className="w-28 h-48 rounded-2xl flex items-center justify-center"
                  style={{ background: 'rgba(124,58,237,0.08)', border: '1px dashed rgba(124,58,237,0.3)' }}>
                  <div className="text-center">
                    <div className="w-12 h-12 rounded-full mx-auto mb-2"
                      style={{ background: 'rgba(124,58,237,0.15)', border: '1px dashed rgba(124,58,237,0.3)' }} />
                    <div className="text-xs" style={{ color: '#475569' }}>Varlık yok</div>
                  </div>
                </div>
                <p className="text-xs text-center" style={{ color: '#475569' }}>
                  assets/alice veya<br />assets/aiko klasörü ekleyin
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Scan line effect */}
        <motion.div
          className="absolute left-0 right-0 h-px pointer-events-none"
          style={{ background: 'linear-gradient(90deg, transparent, rgba(0,229,255,0.3), transparent)' }}
          animate={{ top: ['0%', '100%'] }}
          transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
        />
      </div>

      {/* Emotion indicator */}
      <div className="px-3 py-1 flex items-center justify-center gap-1">
        {EMOTIONS.filter(e => e !== 'talk').map((e) => (
          <motion.button
            key={e}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setEmotion(e)}
            className="text-[10px] px-2 py-0.5 rounded cursor-pointer transition-all"
            style={{
              background: emotion === e ? 'rgba(124,58,237,0.3)' : 'transparent',
              border: `1px solid ${emotion === e ? 'rgba(124,58,237,0.6)' : 'rgba(124,58,237,0.15)'}`,
              color: emotion === e ? '#a855f7' : '#475569',
              fontFamily: 'Rajdhani, sans-serif',
            }}>
            {EMOTION_LABELS[e]}
          </motion.button>
        ))}
      </div>

      {/* Action buttons */}
      <div className="flex gap-2 px-3 pb-3">
        <motion.button
          whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
          onClick={randomOutfit}
          className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium cursor-pointer"
          style={{ background: 'rgba(124,58,237,0.15)', border: '1px solid rgba(124,58,237,0.3)', color: '#a855f7', fontFamily: 'Rajdhani, sans-serif' }}>
          <Shuffle size={13} /> Rastgele Kıyafet
        </motion.button>
        <motion.button
          whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
          onClick={randomEmotion}
          className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium cursor-pointer"
          style={{ background: 'rgba(0,229,255,0.1)', border: '1px solid rgba(0,229,255,0.25)', color: '#00e5ff', fontFamily: 'Rajdhani, sans-serif' }}>
          <Shuffle size={13} /> Rastgele Duygu
        </motion.button>
      </div>
    </div>
  )
}
