import React, { useEffect, useRef, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAppStore } from '../../stores/appStore'
import { EMOTION_LABELS, type Emotion, type SpriteEntry } from '../../types'

const alice = () => (window as unknown as Record<string, unknown>)['alice'] as Record<string, Record<string, (...args: unknown[]) => unknown>>

const EMOTIONS: Emotion[] = ['idle', 'happy', 'talk', 'angry', 'sad', 'sleep', 'fear']

// Talk loop: cycles between open-mouth frames for static outfits
const TALK_KEYWORDS = ['open', 'closed_open', 'shout']

export default function CharacterPanel() {
  const {
    activeCharacterId, activeOutfitId, activeEmotion, setActiveEmotion,
    isTalking, characters,
  } = useAppStore()

  const char = characters.find(c => c.id === activeCharacterId)
  const outfit = char?.outfits.find(o => o.id === activeOutfitId)

  const [displaySrc, setDisplaySrc] = useState<string | null>(null)
  const [frameIndex, setFrameIndex] = useState(0)
  const frameTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const talkTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // ── Resolve sprite for current emotion
  const resolveSprite = useCallback(
    async (emotion: Emotion): Promise<SpriteEntry | null> => {
      if (!activeCharacterId || !activeOutfitId) return null
      try {
        const result = await alice().assets.getSprite(activeCharacterId, activeOutfitId, emotion) as SpriteEntry | null
        return result
      } catch {
        return null
      }
    },
    [activeCharacterId, activeOutfitId]
  )

  // ── Frame animation for normalized (frame_N.png) outfits
  const startFrameAnimation = useCallback((sprites: SpriteEntry[], fps = 8) => {
    if (frameTimerRef.current) clearInterval(frameTimerRef.current)
    if (sprites.length <= 1) {
      setDisplaySrc(sprites[0]?.fileUrl ?? null)
      return
    }
    let idx = 0
    setDisplaySrc(sprites[0].fileUrl)
    frameTimerRef.current = setInterval(() => {
      idx = (idx + 1) % sprites.length
      setDisplaySrc(sprites[idx].fileUrl)
    }, 1000 / fps)
  }, [])

  // ── Talk loop for static outfits (mouth open/close)
  const startTalkLoop = useCallback((outfit: NonNullable<typeof outfit>) => {
    if (talkTimerRef.current) clearInterval(talkTimerRef.current)
    const talkSprites = outfit.sprites['talk'] ?? []
    const idleSprites = outfit.sprites['idle'] ?? []
    const openFrames = talkSprites.filter(s => TALK_KEYWORDS.some(k => s.filename.toLowerCase().includes(k)))
    const closedFrames = idleSprites.length > 0 ? idleSprites : talkSprites.filter(s => !TALK_KEYWORDS.some(k => s.filename.toLowerCase().includes(k)))

    if (openFrames.length === 0 && talkSprites.length === 0) return
    const frameA = openFrames[0] ?? talkSprites[0]
    const frameB = closedFrames[0] ?? talkSprites[Math.min(1, talkSprites.length - 1)]

    let toggle = false
    setDisplaySrc(frameA.fileUrl)
    talkTimerRef.current = setInterval(() => {
      setDisplaySrc(toggle ? frameA.fileUrl : frameB.fileUrl)
      toggle = !toggle
    }, 300)
  }, [])

  // ── Stop all loops
  const stopLoops = useCallback(() => {
    if (frameTimerRef.current) { clearInterval(frameTimerRef.current); frameTimerRef.current = null }
    if (talkTimerRef.current) { clearInterval(talkTimerRef.current); talkTimerRef.current = null }
  }, [])

  // ── Main effect: update sprite when char/outfit/emotion/isTalking changes
  useEffect(() => {
    if (!outfit) {
      setDisplaySrc('/alice.jpg')
      return
    }
    stopLoops()

    const targetEmotion: Emotion = isTalking ? 'talk' : activeEmotion

    if (outfit.mode === 'frames') {
      // Normalized: real frame animation
      const sprites = outfit.sprites[targetEmotion] ?? outfit.sprites['idle'] ?? []
      if (sprites.length > 0) {
        startFrameAnimation(sprites, isTalking ? 6 : 5)
      } else {
        setDisplaySrc(outfit.previewUrl ?? '/alice.jpg')
      }
    } else {
      // Static expression mode
      if (isTalking) {
        startTalkLoop(outfit)
      } else {
        resolveSprite(targetEmotion).then(sprite => {
          setDisplaySrc(sprite?.fileUrl ?? outfit.previewUrl ?? '/alice.jpg')
        })
      }
    }

    return () => stopLoops()
  }, [activeCharacterId, activeOutfitId, activeEmotion, isTalking, outfit, stopLoops, startFrameAnimation, startTalkLoop, resolveSprite])

  // ── Cleanup on unmount
  useEffect(() => () => stopLoops(), [stopLoops])

  return (
    <div className="flex flex-col flex-shrink-0 overflow-hidden"
      style={{ width: 300, background: 'rgba(14,22,45,0.6)', borderRight: '1px solid rgba(139,92,246,0.15)' }}>

      {/* Stage */}
      <div className="relative flex-1 flex items-end justify-center overflow-hidden"
        style={{ minHeight: 320, background: 'radial-gradient(ellipse at 50% 80%, rgba(139,92,246,0.08) 0%, transparent 70%)' }}>

        {/* Ambient glow */}
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-48 h-24 pointer-events-none"
          style={{ background: 'radial-gradient(ellipse, rgba(139,92,246,0.25) 0%, transparent 70%)', filter: 'blur(12px)' }} />

        {/* Scan line */}
        <motion.div className="absolute left-0 right-0 h-px pointer-events-none"
          style={{ background: 'linear-gradient(90deg, transparent, rgba(6,182,212,0.2), transparent)' }}
          animate={{ top: ['0%', '100%'] }}
          transition={{ duration: 5, repeat: Infinity, ease: 'linear' }} />

        {/* Character image */}
        <AnimatePresence mode="wait">
          {displaySrc ? (
            <motion.img
              key={displaySrc}
              src={displaySrc}
              alt={char?.name ?? 'Karakter'}
              className="relative object-contain"
              style={{
                maxHeight: 460, maxWidth: 280,
                filter: 'drop-shadow(0 0 24px rgba(139,92,246,0.45))',
                imageRendering: 'pixelated',
              }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: outfit?.mode === 'frames' ? 0.04 : 0.15 }}
            />
          ) : (
            <motion.div key="empty"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center gap-3 pb-8"
              style={{ color: '#64748b', height: 280 }}>
              <div className="w-20 h-28 rounded-2xl"
                style={{ background: 'rgba(139,92,246,0.06)', border: '1px dashed rgba(139,92,246,0.2)' }} />
              <p className="text-xs text-center" style={{ color: '#475569' }}>
                Varlık bulunamadi<br />
                <span style={{ fontSize: '10px' }}>assets/ klasorunu kontrol edin</span>
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Name badge */}
        {char && (
          <div className="absolute top-3 left-3 flex items-center gap-2">
            <div className="px-2 py-1 rounded-lg text-xs font-semibold"
              style={{
                background: 'rgba(139,92,246,0.15)', border: '1px solid rgba(139,92,246,0.25)',
                color: '#8b5cf6', fontFamily: 'Rajdhani, sans-serif', letterSpacing: '0.05em',
              }}>
              {char.name.toUpperCase()}
            </div>
            {isTalking && (
              <motion.div className="flex gap-0.5 items-center"
                animate={{ opacity: [0.5, 1, 0.5] }} transition={{ duration: 0.8, repeat: Infinity }}>
                {[0, 1, 2].map(i => (
                  <div key={i} className="w-1 rounded-full"
                    style={{ height: 4 + i * 3, background: '#10b981', boxShadow: '0 0 4px #10b981' }} />
                ))}
              </motion.div>
            )}
          </div>
        )}

        {/* Outfit badge */}
        {outfit && (
          <div className="absolute top-3 right-3">
            <div className="px-2 py-1 rounded-lg text-[10px]"
              style={{ background: 'rgba(6,182,212,0.1)', border: '1px solid rgba(6,182,212,0.2)', color: '#06b6d4' }}>
              {outfit.name}
              {outfit.isCat && <span className="ml-1" style={{ color: '#ec4899' }}>neko</span>}
            </div>
          </div>
        )}
      </div>

      {/* Emotion selector */}
      <div className="flex-shrink-0 px-3 py-2" style={{ borderTop: '1px solid rgba(139,92,246,0.12)' }}>
        <p className="text-[10px] mb-2 uppercase tracking-wider" style={{ color: '#475569', fontFamily: 'Rajdhani, sans-serif' }}>Duygu</p>
        <div className="grid grid-cols-4 gap-1">
          {EMOTIONS.map((e) => {
            const available = outfit?.emotions.includes(e) ?? false
            const active = activeEmotion === e
            return (
              <button
                key={e}
                onClick={() => setActiveEmotion(e)}
                disabled={!available}
                className="text-[10px] py-1 px-1 rounded-lg cursor-pointer transition-all"
                style={{
                  background: active ? 'rgba(139,92,246,0.2)' : 'rgba(139,92,246,0.05)',
                  border: `1px solid ${active ? 'rgba(139,92,246,0.5)' : 'rgba(139,92,246,0.08)'}`,
                  color: active ? '#8b5cf6' : available ? '#94a3b8' : '#374151',
                  fontFamily: 'Rajdhani, sans-serif',
                  opacity: available ? 1 : 0.4,
                  cursor: available ? 'pointer' : 'not-allowed',
                  boxShadow: active ? '0 0 8px rgba(139,92,246,0.2)' : 'none',
                }}>
                {EMOTION_LABELS[e]}
              </button>
            )
          })}
        </div>
      </div>

      {/* Outfit info */}
      {outfit && (
        <div className="flex-shrink-0 px-3 pb-3">
          <div className="rounded-xl p-2.5 text-xs"
            style={{ background: 'rgba(139,92,246,0.06)', border: '1px solid rgba(139,92,246,0.1)' }}>
            <div className="flex justify-between">
              <span style={{ color: '#64748b' }}>Mod</span>
              <span style={{ color: outfit.mode === 'frames' ? '#10b981' : '#06b6d4' }}>
                {outfit.mode === 'frames' ? 'Animasyon' : 'Statik'}
              </span>
            </div>
            <div className="flex justify-between mt-1">
              <span style={{ color: '#64748b' }}>Toplam PNG</span>
              <span style={{ color: '#94a3b8' }}>{outfit.totalPng}</span>
            </div>
            <div className="flex justify-between mt-1">
              <span style={{ color: '#64748b' }}>Duygular</span>
              <span style={{ color: '#94a3b8' }}>{outfit.emotions.length}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
