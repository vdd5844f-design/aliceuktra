import React, { useEffect, useRef, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAppStore } from '../../stores/appStore'
import { EMOTION_LABELS, type Emotion, type SpriteEntry } from '../../types'

const alice = () =>
  (window as unknown as Record<string, unknown>)['alice'] as
    Record<string, Record<string, (...args: unknown[]) => unknown>>

const EMOTIONS: Emotion[] = ['idle', 'happy', 'talk', 'angry', 'sad', 'sleep', 'fear']

// Keywords that indicate an "open mouth" frame in talk loop
const TALK_OPEN_KEYWORDS = ['_open', 'closed_open', 'shout', 'mouthopen', 'mouth_open']
const TALK_CLOSED_KEYWORDS = ['closed_smile', 'closedsmile', 'neutral', '_neutral', 'character_neutral']

// fps for frame animation
const FRAME_FPS_IDLE  = 5
const FRAME_FPS_TALK  = 7
const TALK_LOOP_INTERVAL_MS = 280

export default function CharacterPanel() {
  const {
    activeCharacterId,
    activeOutfitId,
    activeEmotion,
    setActiveEmotion,
    isTalking,
    characters,
    setCurrentSprite,
  } = useAppStore()

  const char   = characters.find(c => c.id === activeCharacterId)
  const outfit = char?.outfits.find(o => o.id === activeOutfitId)

  const [displaySrc, setDisplaySrc] = useState<string | null>(null)
  const frameTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const talkTimerRef  = useRef<ReturnType<typeof setInterval> | null>(null)

  // ── Stop all running timers
  const stopLoops = useCallback(() => {
    if (frameTimerRef.current) { clearInterval(frameTimerRef.current); frameTimerRef.current = null }
    if (talkTimerRef.current)  { clearInterval(talkTimerRef.current);  talkTimerRef.current  = null }
  }, [])

  // ── IPC: get best sprite for a given emotion (uses fallback chain in main)
  const resolveSprite = useCallback(
    async (emotion: Emotion): Promise<SpriteEntry | null> => {
      if (!activeCharacterId || !activeOutfitId) return null
      try {
        return await alice().assets.getSprite(activeCharacterId, activeOutfitId, emotion) as SpriteEntry | null
      } catch { return null }
    },
    [activeCharacterId, activeOutfitId],
  )

  // ── Frame animation for normalized outfits (frame_0, frame_1 …)
  const startFrameAnimation = useCallback((sprites: SpriteEntry[], fps = FRAME_FPS_IDLE) => {
    stopLoops()
    if (sprites.length === 0) return
    if (sprites.length === 1) {
      setDisplaySrc(sprites[0].fileUrl)
      return
    }
    let idx = 0
    setDisplaySrc(sprites[0].fileUrl)
    frameTimerRef.current = setInterval(() => {
      idx = (idx + 1) % sprites.length
      setDisplaySrc(sprites[idx].fileUrl)
    }, Math.round(1000 / fps))
  }, [stopLoops])

  // ── Talk mouth-loop for static expression outfits
  const startTalkLoop = useCallback((o: NonNullable<typeof outfit>) => {
    stopLoops()
    const talkSprites = o.sprites['talk'] ?? []
    const idleSprites = o.sprites['idle'] ?? []

    // Open-mouth frame: prefer explicit open keywords, fall back to first talk sprite
    const openFrame = (
      talkSprites.find(s => TALK_OPEN_KEYWORDS.some(k => s.filename.toLowerCase().includes(k)))
      ?? talkSprites[0]
    )
    // Closed-mouth frame: prefer idle neutral, fall back to second talk sprite
    const closedFrame = (
      idleSprites.find(s => TALK_CLOSED_KEYWORDS.some(k => s.filename.toLowerCase().includes(k)))
      ?? idleSprites[0]
      ?? talkSprites.find(s => !TALK_OPEN_KEYWORDS.some(k => s.filename.toLowerCase().includes(k)))
      ?? talkSprites[Math.min(1, talkSprites.length - 1)]
    )

    if (!openFrame) return

    let toggle = true
    setDisplaySrc(openFrame.fileUrl)
    talkTimerRef.current = setInterval(() => {
      const next = toggle ? (closedFrame ?? openFrame) : openFrame
      setDisplaySrc(next.fileUrl)
      toggle = !toggle
    }, TALK_LOOP_INTERVAL_MS)
  }, [stopLoops])

  // ── Main effect: react to any change in char/outfit/emotion/isTalking
  useEffect(() => {
    if (!outfit) {
      stopLoops()
      setDisplaySrc(null)
      setCurrentSprite(null)
      return
    }

    const targetEmotion: Emotion = isTalking ? 'talk' : activeEmotion

    if (outfit.mode === 'frames') {
      // Alice / normalized outfit: play actual frame animation
      const sprites = outfit.sprites[targetEmotion] ?? outfit.sprites['idle'] ?? []
      if (sprites.length > 0) {
        startFrameAnimation(sprites, isTalking ? FRAME_FPS_TALK : FRAME_FPS_IDLE)
        setCurrentSprite(sprites[0])
      } else {
        stopLoops()
        const fallback = outfit.previewUrl
        setDisplaySrc(fallback)
      }
    } else {
      // Static expression pack (Aiko, Drift, Miho, Natsumi, Sumi …)
      if (isTalking) {
        startTalkLoop(outfit)
        const talkSprite = outfit.sprites['talk']?.[0] ?? null
        setCurrentSprite(talkSprite)
      } else {
        stopLoops()
        resolveSprite(targetEmotion).then(sprite => {
          const src = sprite?.fileUrl ?? outfit.previewUrl ?? null
          setDisplaySrc(src)
          setCurrentSprite(sprite)
        })
      }
    }

    return () => stopLoops()
  }, [
    activeCharacterId, activeOutfitId, activeEmotion, isTalking,
    outfit, stopLoops, startFrameAnimation, startTalkLoop, resolveSprite, setCurrentSprite,
  ])

  // Keep displaySrc in sync when frame animation updates
  useEffect(() => {
    // frameTimerRef callback updates displaySrc directly — nothing extra needed here
  }, [])

  // Propagate displaySrc to currentSprite for debug panel
  useEffect(() => {
    if (displaySrc && outfit?.mode === 'frames') {
      const entry = Object.values(outfit.sprites).flat().find(s => s.fileUrl === displaySrc)
      if (entry) setCurrentSprite(entry)
    }
  }, [displaySrc, outfit, setCurrentSprite])

  // Cleanup on unmount
  useEffect(() => () => stopLoops(), [stopLoops])

  return (
    <div
      className="flex flex-col flex-shrink-0 overflow-hidden"
      style={{
        width: 300,
        background: 'rgba(10,16,40,0.75)',
        borderRight: '1px solid rgba(139,92,246,0.12)',
        backdropFilter: 'blur(16px)',
      }}
    >
      {/* ── Stage ─────────────────────────────────── */}
      <div
        className="relative flex flex-1 items-end justify-center overflow-hidden"
        style={{
          minHeight: 320,
          background: 'radial-gradient(ellipse at 50% 85%, rgba(139,92,246,0.07) 0%, transparent 68%)',
        }}
      >
        {/* Ambient floor glow */}
        <div
          className="absolute bottom-0 left-1/2 -translate-x-1/2 pointer-events-none"
          style={{
            width: 200, height: 28,
            background: 'radial-gradient(ellipse, rgba(139,92,246,0.3) 0%, transparent 70%)',
            filter: 'blur(10px)',
          }}
        />

        {/* Horizontal scan line */}
        <motion.div
          className="absolute left-0 right-0 h-px pointer-events-none"
          style={{ background: 'linear-gradient(90deg, transparent, rgba(6,182,212,0.18), transparent)' }}
          animate={{ top: ['0%', '100%'] }}
          transition={{ duration: 6, repeat: Infinity, ease: 'linear' }}
        />

        {/* Character image */}
        <AnimatePresence mode="wait">
          {displaySrc ? (
            <motion.img
              key={displaySrc}
              src={displaySrc}
              alt={char?.name ?? 'Karakter'}
              className="relative object-contain select-none"
              style={{
                maxHeight: 460,
                maxWidth: 280,
                filter: 'drop-shadow(0 0 22px rgba(139,92,246,0.42))',
                imageRendering: 'pixelated',
              }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: outfit?.mode === 'frames' ? 0.04 : 0.12 }}
            />
          ) : (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center gap-3 pb-8"
              style={{ height: 280 }}
            >
              <div
                className="w-20 h-28 rounded-2xl flex items-center justify-center"
                style={{ background: 'rgba(139,92,246,0.05)', border: '1px dashed rgba(139,92,246,0.18)' }}
              >
                <span style={{ fontSize: 28, color: '#374151' }}>?</span>
              </div>
              <p className="text-xs text-center" style={{ color: '#475569' }}>
                Varlık bulunamadı<br />
                <span style={{ fontSize: 10 }}>assets/ klasörünü kontrol edin</span>
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Character name badge */}
        {char && (
          <div className="absolute top-3 left-3 flex items-center gap-2">
            <div
              className="px-2 py-1 rounded-lg text-xs font-semibold"
              style={{
                background: 'rgba(139,92,246,0.14)',
                border: '1px solid rgba(139,92,246,0.26)',
                color: '#8b5cf6',
                fontFamily: 'Rajdhani, sans-serif',
                letterSpacing: '0.06em',
              }}
            >
              {char.name.toUpperCase()}
            </div>

            {isTalking && (
              <motion.div
                className="flex gap-0.5 items-center"
                animate={{ opacity: [0.4, 1, 0.4] }}
                transition={{ duration: 0.7, repeat: Infinity }}
              >
                {[0, 1, 2].map(i => (
                  <div
                    key={i}
                    className="w-1 rounded-full"
                    style={{ height: 4 + i * 3, background: '#10b981', boxShadow: '0 0 4px #10b981' }}
                  />
                ))}
              </motion.div>
            )}
          </div>
        )}

        {/* Outfit badge */}
        {outfit && (
          <div className="absolute top-3 right-3">
            <div
              className="px-2 py-1 rounded-lg text-[10px]"
              style={{ background: 'rgba(6,182,212,0.08)', border: '1px solid rgba(6,182,212,0.18)', color: '#06b6d4' }}
            >
              {outfit.name}
              {outfit.isCat && <span className="ml-1" style={{ color: '#ec4899' }}>neko</span>}
            </div>
          </div>
        )}
      </div>

      {/* ── Emotion selector ──────────────────────── */}
      <div
        className="flex-shrink-0 px-3 py-2"
        style={{ borderTop: '1px solid rgba(139,92,246,0.1)' }}
      >
        <p
          className="text-[10px] mb-2 uppercase tracking-wider"
          style={{ color: '#475569', fontFamily: 'Rajdhani, sans-serif' }}
        >
          Duygu
        </p>
        <div className="grid grid-cols-4 gap-1">
          {EMOTIONS.map(e => {
            const available = outfit?.emotions.includes(e) ?? false
            const active = activeEmotion === e
            return (
              <button
                key={e}
                onClick={() => available && setActiveEmotion(e)}
                disabled={!available}
                className="text-[10px] py-1 rounded-lg transition-all"
                style={{
                  background: active ? 'rgba(139,92,246,0.22)' : 'rgba(139,92,246,0.04)',
                  border: `1px solid ${active ? 'rgba(139,92,246,0.52)' : 'rgba(139,92,246,0.07)'}`,
                  color: active ? '#8b5cf6' : available ? '#94a3b8' : '#374151',
                  fontFamily: 'Rajdhani, sans-serif',
                  opacity: available ? 1 : 0.4,
                  cursor: available ? 'pointer' : 'not-allowed',
                  boxShadow: active ? '0 0 8px rgba(139,92,246,0.2)' : 'none',
                }}
              >
                {EMOTION_LABELS[e]}
              </button>
            )
          })}
        </div>
      </div>

      {/* ── Outfit info strip ─────────────────────── */}
      {outfit && (
        <div className="flex-shrink-0 px-3 pb-3">
          <div
            className="rounded-xl px-3 py-2 text-[10px] flex gap-4 justify-between"
            style={{ background: 'rgba(139,92,246,0.05)', border: '1px solid rgba(139,92,246,0.09)' }}
          >
            <div>
              <span style={{ color: '#475569' }}>Mod: </span>
              <span style={{ color: outfit.mode === 'frames' ? '#10b981' : '#06b6d4' }}>
                {outfit.mode === 'frames' ? 'Animasyon' : 'Statik'}
              </span>
            </div>
            <div>
              <span style={{ color: '#475569' }}>PNG: </span>
              <span style={{ color: '#94a3b8' }}>{outfit.totalPng}</span>
            </div>
            <div>
              <span style={{ color: '#475569' }}>Duygu: </span>
              <span style={{ color: '#94a3b8' }}>{outfit.emotions.length}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
