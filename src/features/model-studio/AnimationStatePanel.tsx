import React from 'react'
import { Clock, Zap } from 'lucide-react'
import { useModelStore } from './modelStore'
import type { AnimationState } from './types'

const STATES: { id: AnimationState; label: string; color: string; desc: string }[] = [
  { id: 'idle',      label: 'Bosta',      color: '#94a3b8', desc: 'Hafif nefes, yavaş blink' },
  { id: 'listening', label: 'Dinliyor',   color: '#06b6d4', desc: 'Bas ileri, goz acik' },
  { id: 'thinking',  label: 'Dusunuyor',  color: '#8b5cf6', desc: 'Goz kisik, kafa sallama' },
  { id: 'talking',   label: 'Konusuyor',  color: '#10b981', desc: 'Lip sync aktif, body sway' },
  { id: 'happy',     label: 'Mutlu',      color: '#f59e0b', desc: 'Happy expression + blink' },
  { id: 'angry',     label: 'Kizgin',     color: '#ef4444', desc: 'Angry expression' },
  { id: 'sad',       label: 'Uzgun',      color: '#3b82f6', desc: 'Sad expression, yavaş hareket' },
  { id: 'sleeping',  label: 'Uyuyor',     color: '#6366f1', desc: 'Goz kapali, nefes ritmi' },
  { id: 'moving',    label: 'Hareket',    color: '#ec4899', desc: 'Yonelme hareketi' },
]

const COMING_SOON = [
  'Mixamo animasyon import',
  'VRMA animasyon destegi',
  'FBX animasyon destegi',
]

interface Props {
  onSetState?: (s: AnimationState) => void
}

export default function AnimationStatePanel({ onSetState }: Props) {
  const { animState, setAnimState, addLog } = useModelStore()

  const handleSet = (s: AnimationState) => {
    setAnimState(s)
    onSetState?.(s)
    addLog('info', `Animasyon state: ${s}`)
  }

  return (
    <div className="flex flex-col gap-4">
      {/* State grid */}
      <div>
        <h4 className="text-[11px] uppercase tracking-widest mb-3" style={{ color: '#64748b' }}>
          State Machine
        </h4>
        <div className="grid grid-cols-3 gap-1.5">
          {STATES.map((st) => {
            const active = animState === st.id
            return (
              <button
                key={st.id}
                onClick={() => handleSet(st.id)}
                title={st.desc}
                className="flex flex-col items-center gap-1 py-2.5 rounded-lg text-center transition-all"
                style={{
                  background: active ? `${st.color}18` : 'rgba(15,20,40,0.5)',
                  border: `1px solid ${active ? st.color + '60' : 'rgba(139,92,246,0.1)'}`,
                  boxShadow: active ? `0 0 12px ${st.color}20` : 'none',
                  color: active ? st.color : '#64748b',
                }}
              >
                <span className="text-[11px] font-medium">{st.label}</span>
                {active && (
                  <div
                    className="w-1.5 h-1.5 rounded-full"
                    style={{ background: st.color, boxShadow: `0 0 6px ${st.color}` }}
                  />
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* Current state info */}
      <div
        className="flex items-center gap-2 rounded-lg px-3 py-2.5 text-xs"
        style={{ background: 'rgba(139,92,246,0.06)', border: '1px solid rgba(139,92,246,0.15)' }}
      >
        <Zap size={13} style={{ color: '#8b5cf6' }} />
        <span style={{ color: '#94a3b8' }}>
          Aktif state: <strong style={{ color: '#8b5cf6' }}>{animState}</strong>
          {' — '}
          {STATES.find((s) => s.id === animState)?.desc}
        </span>
      </div>

      {/* Coming soon */}
      <div>
        <h4 className="text-[11px] uppercase tracking-widest mb-2" style={{ color: '#475569' }}>
          Yakindan
        </h4>
        <div className="flex flex-col gap-1.5">
          {COMING_SOON.map((item) => (
            <div
              key={item}
              className="flex items-center gap-2 rounded-lg px-3 py-2 text-xs"
              style={{ background: 'rgba(15,20,40,0.4)', border: '1px solid rgba(100,116,139,0.1)', color: '#475569' }}
            >
              <Clock size={11} />
              <span>{item}</span>
              <span
                className="ml-auto text-[10px] px-1.5 py-0.5 rounded"
                style={{ background: 'rgba(100,116,139,0.1)', color: '#475569', border: '1px solid rgba(100,116,139,0.15)' }}
              >
                Yakindan
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
