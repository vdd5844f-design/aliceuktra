import React, { useRef, useEffect, useState } from 'react'
import {
  RotateCcw, Grid3X3, Image as ImageIcon, Camera,
  ChevronDown, ChevronUp, Terminal, RefreshCw,
} from 'lucide-react'
import { motion } from 'framer-motion'
import VrmViewer, { type VrmViewerHandle } from './VrmViewer'
import ModelUploader from './ModelUploader'
import ModelLibrary from './ModelLibrary'
import ModelSourceCards from './ModelSourceCards'
import CharacterSettingsPanel from './CharacterSettingsPanel'
import AnimationStatePanel from './AnimationStatePanel'
import LipSyncPanel from './LipSyncPanel'
import { useModelStore } from './modelStore'
import type { ModelMeta, AnimationState } from './types'

type RightTab = 'ayarlar' | 'animasyon' | 'lipsync'

// ─────────────────────────────────────────────────────────────────────────────
// Section wrapper
// ─────────────────────────────────────────────────────────────────────────────

function Section({
  title,
  children,
  collapsible = false,
}: {
  title: string
  children: React.ReactNode
  collapsible?: boolean
}) {
  const [open, setOpen] = useState(true)
  return (
    <div
      className="rounded-xl overflow-hidden"
      style={{ background: 'rgba(10,14,32,0.7)', border: '1px solid rgba(139,92,246,0.1)' }}
    >
      <button
        className="w-full flex items-center justify-between px-4 py-3"
        onClick={collapsible ? () => setOpen(!open) : undefined}
        style={{ cursor: collapsible ? 'pointer' : 'default' }}
      >
        <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: '#8b5cf6' }}>
          {title}
        </span>
        {collapsible && (
          open ? <ChevronUp size={13} style={{ color: '#64748b' }} />
               : <ChevronDown size={13} style={{ color: '#64748b' }} />
        )}
      </button>
      {(!collapsible || open) && (
        <div className="px-4 pb-4">{children}</div>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Log entry row
// ─────────────────────────────────────────────────────────────────────────────

const LOG_COLORS = {
  info:    '#94a3b8',
  warn:    '#fbbf24',
  error:   '#f87171',
  success: '#10b981',
}

// ─────────────────────────────────────────────────────────────────────────────
// ModelStudioPage
// ─────────────────────────────────────────────────────────────────────────────

export default function ModelStudioPage() {
  const viewerRef = useRef<VrmViewerHandle>(null)
  const logsEndRef = useRef<HTMLDivElement>(null)
  const {
    autoRotate, setAutoRotate,
    showGrid, setShowGrid,
    transparentBg, setTransparentBg,
    logs, clearLogs,
    activeModelId, models,
    setActiveModelId, setModels,
    addLog,
  } = useModelStore()

  const [rightTab, setRightTab] = useState<RightTab>('ayarlar')
  const [logsOpen, setLogsOpen] = useState(true)

  const alice = () =>
    (window as unknown as Record<string, Record<string, (...a: unknown[]) => unknown>>)['alice']

  // ── On mount: load existing models from Electron
  useEffect(() => {
    const init = async () => {
      try {
        const list = await alice().model.list() as ModelMeta[]
        if (Array.isArray(list)) {
          setModels(list)
          const active = list.find((m) => m.isActive)
          if (active) setActiveModelId(active.id)
          addLog('info', `Kutuphaneden ${list.length} model yuklendi`)
        }
      } catch {
        addLog('info', 'Electron API yok — tarayıcı onizleme modu')
      }
    }
    init()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ── Auto-scroll logs
  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [logs])

  // ── When a model file is ready (just uploaded), load it into viewer
  const handleFileReady = async (buffer: ArrayBuffer, meta: ModelMeta) => {
    addLog('info', 'VRM dogrulanıyor...')
    await viewerRef.current?.loadFromBuffer(buffer, (pct) => {
      if (pct % 25 === 0) addLog('info', `VRM yukleniyor: %${pct}`)
    })
    addLog('success', 'Expression listesi taranıyor...')
  }

  // ── Preview a model from library by file URL
  const handlePreview = async (meta: ModelMeta) => {
    try {
      const url = await alice().model.getFileUrl(meta.id) as string | null
      if (url) {
        addLog('info', `Onizleniyor: ${meta.name}`)
        viewerRef.current?.loadFromFileUrl(url)
      }
    } catch {
      addLog('warn', 'Dosya URL alinamadi — tarayici modu')
    }
  }

  // ── Capture screenshot
  const handleScreenshot = () => {
    const img = viewerRef.current?.capturePreview()
    if (!img) return
    const link = document.createElement('a')
    link.href = img
    link.download = `vrm-preview-${Date.now()}.png`
    link.click()
    addLog('success', 'Ekran goruntüsü alindi')
    // Also save as model preview if active
    const active = models.find((m) => m.id === activeModelId)
    if (active) {
      alice().model.savePreview(active.id, img).catch(() => null)
    }
  }

  const handleAnimState = (s: AnimationState) => {
    viewerRef.current?.setAnimState(s)
  }

  return (
    <div
      className="flex flex-col w-full h-full overflow-hidden"
      style={{ background: '#05070a' }}
    >
      {/* ── Header */}
      <div
        className="flex items-center gap-3 px-5 py-3 flex-shrink-0"
        style={{ borderBottom: '1px solid rgba(139,92,246,0.12)', background: 'rgba(5,7,10,0.9)' }}
      >
        <div className="flex flex-col">
          <span className="text-sm font-bold" style={{ color: '#f1f5f9', fontFamily: 'Rajdhani, sans-serif', letterSpacing: '0.05em' }}>
            3D MODEL STUDYOSU
          </span>
          <span className="text-[10px]" style={{ color: '#475569' }}>VRM tabanlı karakter sistemi</span>
        </div>
        <div className="flex-1" />
        {/* Viewer controls */}
        <div className="flex items-center gap-1">
          <ViewerToggle active={autoRotate} label="Doner" onClick={() => setAutoRotate(!autoRotate)}>
            <RotateCcw size={13} />
          </ViewerToggle>
          <ViewerToggle active={showGrid} label="Grid" onClick={() => setShowGrid(!showGrid)}>
            <Grid3X3 size={13} />
          </ViewerToggle>
          <ViewerToggle active={transparentBg} label="Saydam" onClick={() => setTransparentBg(!transparentBg)}>
            <ImageIcon size={13} />
          </ViewerToggle>
          <button
            onClick={handleScreenshot}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs transition-all"
            style={{ background: 'rgba(6,182,212,0.1)', border: '1px solid rgba(6,182,212,0.25)', color: '#06b6d4' }}
          >
            <Camera size={12} />
            Goruntu Al
          </button>
        </div>
      </div>

      {/* ── Main body */}
      <div className="flex flex-1 overflow-hidden">

        {/* ── LEFT panel */}
        <div
          className="flex flex-col gap-3 p-3 overflow-y-auto flex-shrink-0"
          style={{ width: 260, borderRight: '1px solid rgba(139,92,246,0.08)' }}
        >
          <Section title="Model Yukle">
            <ModelUploader onFileReady={handleFileReady} />
          </Section>

          <Section title="Kutuphane" collapsible>
            <ModelLibrary onPreview={handlePreview} />
          </Section>

          <Section title="Model Kaynaklari" collapsible>
            <ModelSourceCards />
          </Section>
        </div>

        {/* ── CENTER — 3D Viewer */}
        <div className="flex-1 relative overflow-hidden">
          <VrmViewer
            ref={viewerRef}
            quality="high"
            autoRotate={autoRotate}
            showGrid={showGrid}
            transparentBg={transparentBg}
            onLoaded={() => addLog('success', 'VRM sahneye yuklendi')}
            onError={(msg) => addLog('error', `Hata: ${msg}`)}
          />
        </div>

        {/* ── RIGHT panel */}
        <div
          className="flex flex-col flex-shrink-0 overflow-hidden"
          style={{ width: 260, borderLeft: '1px solid rgba(139,92,246,0.08)' }}
        >
          {/* Tab bar */}
          <div
            className="flex flex-shrink-0"
            style={{ borderBottom: '1px solid rgba(139,92,246,0.1)' }}
          >
            {(['ayarlar', 'animasyon', 'lipsync'] as RightTab[]).map((t) => (
              <button
                key={t}
                onClick={() => setRightTab(t)}
                className="flex-1 py-2.5 text-[11px] font-medium uppercase tracking-wider transition-all"
                style={{
                  background: rightTab === t ? 'rgba(139,92,246,0.1)' : 'transparent',
                  borderBottom: rightTab === t ? '2px solid #8b5cf6' : '2px solid transparent',
                  color: rightTab === t ? '#8b5cf6' : '#475569',
                }}
              >
                {t === 'ayarlar' ? 'Ayarlar' : t === 'animasyon' ? 'Animasyon' : 'Lip Sync'}
              </button>
            ))}
          </div>

          <div className="flex-1 overflow-y-auto p-3">
            {rightTab === 'ayarlar' && <CharacterSettingsPanel />}
            {rightTab === 'animasyon' && <AnimationStatePanel onSetState={handleAnimState} />}
            {rightTab === 'lipsync' && <LipSyncPanel viewerRef={viewerRef} />}
          </div>
        </div>
      </div>

      {/* ── BOTTOM — Log panel */}
      <div
        className="flex-shrink-0 border-t"
        style={{
          borderColor: 'rgba(139,92,246,0.1)',
          background: 'rgba(5,7,10,0.95)',
          maxHeight: logsOpen ? 160 : 36,
          transition: 'max-height 0.2s ease',
          overflow: 'hidden',
        }}
      >
        {/* Log header */}
        <div
          className="flex items-center gap-2 px-4 py-2 cursor-pointer"
          onClick={() => setLogsOpen(!logsOpen)}
        >
          <Terminal size={12} style={{ color: '#8b5cf6' }} />
          <span className="text-[11px] uppercase tracking-widest" style={{ color: '#64748b' }}>
            Sistem Gunlugu
          </span>
          <span
            className="text-[10px] px-1.5 py-0.5 rounded"
            style={{ background: 'rgba(139,92,246,0.1)', color: '#8b5cf6', border: '1px solid rgba(139,92,246,0.2)' }}
          >
            {logs.length}
          </span>
          <div className="flex-1" />
          <button
            onClick={(e) => { e.stopPropagation(); clearLogs() }}
            className="p-0.5 rounded transition-all"
            style={{ color: '#475569' }}
            title="Temizle"
          >
            <RefreshCw size={11} />
          </button>
          {logsOpen ? <ChevronDown size={13} style={{ color: '#475569' }} />
                    : <ChevronUp size={13} style={{ color: '#475569' }} />}
        </div>

        {/* Log entries */}
        {logsOpen && (
          <div className="overflow-y-auto px-4 pb-3" style={{ maxHeight: 120 }}>
            {logs.length === 0 ? (
              <span className="text-[11px]" style={{ color: '#334155' }}>Henuz log yok.</span>
            ) : (
              logs.map((entry) => (
                <div key={entry.id} className="flex items-start gap-2 text-[11px] leading-5">
                  <span className="flex-shrink-0" style={{ color: '#334155' }}>
                    {new Date(entry.timestamp).toLocaleTimeString('tr-TR')}
                  </span>
                  <span className="flex-shrink-0 uppercase font-bold text-[9px]"
                    style={{ color: LOG_COLORS[entry.level], marginTop: 3 }}>
                    {entry.level}
                  </span>
                  <span style={{ color: LOG_COLORS[entry.level] }}>{entry.message}</span>
                </div>
              ))
            )}
            <div ref={logsEndRef} />
          </div>
        )}
      </div>
    </div>
  )
}

// ── Small helper component — viewer toolbar toggle button
function ViewerToggle({
  active, label, onClick, children,
}: {
  active: boolean
  label: string
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      onClick={onClick}
      title={label}
      className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs transition-all"
      style={{
        background: active ? 'rgba(139,92,246,0.15)' : 'rgba(15,20,40,0.5)',
        border: `1px solid ${active ? 'rgba(139,92,246,0.4)' : 'rgba(139,92,246,0.1)'}`,
        color: active ? '#8b5cf6' : '#475569',
      }}
    >
      {children}
    </button>
  )
}
