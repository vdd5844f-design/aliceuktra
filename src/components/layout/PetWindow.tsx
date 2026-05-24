import React, { useRef, useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAppStore } from '@/stores/appStore'

interface ContextMenuItem {
  label: string
  action: () => void
  danger?: boolean
}

export default function PetWindow() {
  const { currentFrame, emotion, isTalking, setEmotion } = useAppStore()
  const [scale, setScale] = useState(1)
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number } | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const dragStart = useRef<{ mx: number; my: number; wx: number; wy: number } | null>(null)

  function onMouseDown(e: React.MouseEvent) {
    if (e.button !== 0) return
    setIsDragging(true)
    dragStart.current = { mx: e.screenX, my: e.screenY, wx: window.screenX, wy: window.screenY }
  }

  function onMouseMove(e: MouseEvent) {
    if (!isDragging || !dragStart.current) return
    const dx = e.screenX - dragStart.current.mx
    const dy = e.screenY - dragStart.current.my
    window.alice?.pet.move(dragStart.current.wx + dx, dragStart.current.wy + dy)
  }

  function onMouseUp() {
    setIsDragging(false)
    dragStart.current = null
  }

  useEffect(() => {
    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('mouseup', onMouseUp)
    return () => {
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('mouseup', onMouseUp)
    }
  }, [isDragging])

  function onWheel(e: React.WheelEvent) {
    e.preventDefault()
    setScale((s) => Math.min(2, Math.max(0.4, s - e.deltaY * 0.001)))
  }

  function onContextMenu(e: React.MouseEvent) {
    e.preventDefault()
    setContextMenu({ x: e.clientX, y: e.clientY })
  }

  function onDoubleClick() {
    window.alice?.studio.open()
  }

  const menuItems: ContextMenuItem[] = [
    { label: 'Sohbeti Aç', action: () => { window.alice?.studio.open(); setContextMenu(null) } },
    { label: 'Studio Modunu Aç', action: () => { window.alice?.studio.open(); setContextMenu(null) } },
    { label: 'Normal', action: () => { setEmotion('idle'); setContextMenu(null) } },
    { label: 'Mutlu', action: () => { setEmotion('happy'); setContextMenu(null) } },
    { label: 'Kızgın', action: () => { setEmotion('angry'); setContextMenu(null) } },
    { label: 'Uyku', action: () => { setEmotion('sleep'); setContextMenu(null) } },
    { label: 'Küçük', action: () => { setScale(0.6); setContextMenu(null) } },
    { label: 'Normal Boyut', action: () => { setScale(1); setContextMenu(null) } },
    { label: 'Büyük', action: () => { setScale(1.4); setContextMenu(null) } },
    { label: 'Her Zaman Üstte', action: () => { window.alice?.pet.alwaysOnTop(true); setContextMenu(null) } },
    { label: 'Kapat', action: () => { window.alice?.pet.close(); setContextMenu(null) }, danger: true },
  ]

  return (
    <div
      className="w-full h-full flex items-end justify-center"
      style={{ background: 'transparent' }}
      onContextMenu={onContextMenu}
      onClick={() => contextMenu && setContextMenu(null)}>

      {/* Character */}
      <motion.div
        onMouseDown={onMouseDown}
        onDoubleClick={onDoubleClick}
        onWheel={onWheel}
        animate={{ scale }}
        style={{ cursor: isDragging ? 'grabbing' : 'grab', transformOrigin: 'bottom center' }}
        className="select-none">

        <AnimatePresence mode="wait">
          {currentFrame ? (
            <motion.img
              key={currentFrame}
              src={currentFrame}
              alt="pet"
              className="animate-float"
              style={{
                maxHeight: 360,
                maxWidth: 260,
                imageRendering: 'pixelated',
                filter: `drop-shadow(0 0 12px rgba(168,85,247,${isTalking ? 0.7 : 0.4}))`,
              }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.05 }}
            />
          ) : (
            <motion.div
              key="placeholder"
              className="flex items-center justify-center rounded-2xl"
              style={{ width: 160, height: 240, background: 'rgba(124,58,237,0.15)', border: '1px dashed rgba(124,58,237,0.4)' }}>
              <span className="text-xs" style={{ color: '#475569' }}>Alice</span>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Context menu */}
      <AnimatePresence>
        {contextMenu && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.1 }}
            className="fixed z-50 rounded-xl overflow-hidden py-1"
            style={{
              left: contextMenu.x,
              top: contextMenu.y,
              background: 'rgba(11,16,32,0.98)',
              border: '1px solid rgba(124,58,237,0.4)',
              boxShadow: '0 8px 32px rgba(0,0,0,0.6), 0 0 16px rgba(124,58,237,0.2)',
              minWidth: 160,
            }}>
            {menuItems.map((item, i) => (
              <motion.button
                key={i}
                whileHover={{ x: 3 }}
                onClick={item.action}
                className="w-full text-left px-4 py-2 text-xs cursor-pointer transition-colors"
                style={{
                  color: item.danger ? '#ff4d6d' : '#e5e7eb',
                  fontFamily: 'Rajdhani, sans-serif',
                  letterSpacing: '0.03em',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = item.danger ? 'rgba(255,77,109,0.1)' : 'rgba(124,58,237,0.15)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'transparent'
                }}>
                {item.label}
              </motion.button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
