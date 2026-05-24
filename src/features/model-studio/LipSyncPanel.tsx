import React, { useRef, useState } from 'react'
import { Play, Square, Mic } from 'lucide-react'
import { useModelStore } from './modelStore'
import type { VrmViewerHandle } from './VrmViewer'

const TEST_TEXT = 'Merhaba Ertu, ben Alice. Bugün ne yapmak istersin?'

interface Props {
  viewerRef: React.RefObject<VrmViewerHandle | null>
}

export default function LipSyncPanel({ viewerRef }: Props) {
  const { addLog, setAnimState } = useModelStore()
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const [running, setRunning] = useState(false)
  const [mode, setMode] = useState<'test' | 'audio'>('test')
  const utterRef = useRef<SpeechSynthesisUtterance | null>(null)

  const startTest = () => {
    if (running) return
    setRunning(true)
    setAnimState('talking')
    addLog('info', 'Lip sync baslatildi')

    viewerRef.current?.setAnimState('talking')

    if (mode === 'audio' && 'speechSynthesis' in window) {
      // Use Web Speech API to produce real audio, feed into analyser
      const utterance = new SpeechSynthesisUtterance(TEST_TEXT)
      utterance.lang = 'tr-TR'
      utterance.rate = 0.9
      utterRef.current = utterance

      utterance.onstart = () => {
        viewerRef.current?.startLipSync()
      }
      utterance.onend = () => {
        viewerRef.current?.stopLipSync()
        viewerRef.current?.setAnimState('idle')
        setAnimState('idle')
        setRunning(false)
        addLog('info', 'Lip sync tamamlandi')
      }
      utterance.onerror = () => {
        stopTest()
      }

      window.speechSynthesis.speak(utterance)
    } else {
      // Pure test mode — no audio, just animation
      viewerRef.current?.startLipSync()
      const timer = setTimeout(() => {
        stopTest()
      }, 5000) // 5s test
      return () => clearTimeout(timer)
    }
  }

  const stopTest = () => {
    if (utterRef.current) window.speechSynthesis?.cancel()
    viewerRef.current?.stopLipSync()
    viewerRef.current?.setAnimState('idle')
    setAnimState('idle')
    setRunning(false)
    addLog('info', 'Lip sync durduruldu')
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Mode selector */}
      <div>
        <h4 className="text-[11px] uppercase tracking-widest mb-3" style={{ color: '#64748b' }}>
          Test Modu
        </h4>
        <div className="flex gap-2">
          {(['test', 'audio'] as const).map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className="flex-1 py-2 rounded-lg text-xs font-medium transition-all"
              style={{
                background: mode === m ? 'rgba(6,182,212,0.15)' : 'rgba(15,20,40,0.5)',
                border: `1px solid ${mode === m ? 'rgba(6,182,212,0.4)' : 'rgba(139,92,246,0.1)'}`,
                color: mode === m ? '#06b6d4' : '#64748b',
              }}
            >
              {m === 'test' ? 'Sine Dalgasi' : 'TTS Ses'}
            </button>
          ))}
        </div>
        <p className="text-[11px] mt-2 leading-relaxed" style={{ color: '#475569' }}>
          {mode === 'test'
            ? 'Gercek ses olmadan agiz animasyonunu test eder (sine + random amplitude).'
            : 'Web Speech API ile Turkce TTS uretir ve agiz animasyonuna bagler.'}
        </p>
      </div>

      {/* Test text */}
      <div className="flex flex-col gap-1">
        <label className="text-[11px] uppercase tracking-widest" style={{ color: '#64748b' }}>
          Test Metni
        </label>
        <div
          className="rounded-lg px-3 py-2 text-xs leading-relaxed"
          style={{
            background: 'rgba(15,20,40,0.5)',
            border: '1px solid rgba(139,92,246,0.15)',
            color: '#94a3b8',
          }}
        >
          {TEST_TEXT}
        </div>
      </div>

      {/* Controls */}
      <div className="flex gap-2">
        <button
          onClick={running ? stopTest : startTest}
          className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all"
          style={{
            background: running ? 'rgba(239,68,68,0.15)' : 'rgba(16,185,129,0.15)',
            border: `1px solid ${running ? 'rgba(239,68,68,0.4)' : 'rgba(16,185,129,0.4)'}`,
            color: running ? '#f87171' : '#10b981',
            boxShadow: running ? '0 0 14px rgba(239,68,68,0.12)' : '0 0 14px rgba(16,185,129,0.12)',
          }}
        >
          {running ? (
            <><Square size={14} /> Durdur</>
          ) : (
            <><Play size={14} /> Konusma Testi</>
          )}
        </button>
      </div>

      {/* Status indicator */}
      {running && (
        <div
          className="flex items-center gap-2 rounded-lg px-3 py-2 text-xs"
          style={{ background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.2)', color: '#10b981' }}
        >
          <Mic size={12} className="animate-pulse" />
          <span>Lip sync aktif — agiz animasyonu calisıyor...</span>
        </div>
      )}

      {/* Hidden audio element for future real TTS binding */}
      <audio ref={audioRef} className="hidden" />
    </div>
  )
}
