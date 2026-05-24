import React from 'react'
import { useModelStore } from './modelStore'
import type { RenderQuality, PixelRatioMode } from './types'

interface SliderRowProps {
  label: string
  value: number
  min: number
  max: number
  step?: number
  onChange: (v: number) => void
  display?: string
}

function SliderRow({ label, value, min, max, step = 0.01, onChange, display }: SliderRowProps) {
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center justify-between">
        <span className="text-[11px]" style={{ color: '#94a3b8' }}>{label}</span>
        <span className="text-[11px] font-mono" style={{ color: '#8b5cf6' }}>
          {display ?? value.toFixed(2)}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="w-full h-1 rounded-full appearance-none cursor-pointer"
        style={{ accentColor: '#8b5cf6' }}
      />
    </div>
  )
}

export default function CharacterSettingsPanel() {
  const { activeModelId, models, updateModel, addLog } = useModelStore()
  const meta = models.find((m) => m.id === activeModelId)

  if (!meta) {
    return (
      <div className="flex items-center justify-center py-10 text-xs" style={{ color: '#475569' }}>
        Aktif model yok
      </div>
    )
  }

  const s = meta.settings
  const alice = () =>
    (window as unknown as Record<string, Record<string, (...a: unknown[]) => unknown>>)['alice']

  const patch = async (partial: Partial<typeof s>) => {
    const next = { ...s, ...partial }
    updateModel(meta.id, { settings: next })
    try {
      await alice().model.updateSettings(meta.id, { settings: next })
    } catch { /* browser preview */ }
  }

  const patchAndLog = (partial: Partial<typeof s>, msg?: string) => {
    patch(partial)
    if (msg) addLog('info', msg)
  }

  return (
    <div className="flex flex-col gap-5">
      {/* Transform */}
      <section>
        <h4 className="text-[11px] uppercase tracking-widest mb-3" style={{ color: '#64748b' }}>
          Boyut ve Konum
        </h4>
        <div className="flex flex-col gap-3">
          <SliderRow label="Olcek" value={s.scale} min={0.1} max={3} step={0.05}
            display={`x${s.scale.toFixed(2)}`}
            onChange={(v) => patch({ scale: v })} />
          <SliderRow label="Pozisyon X" value={s.positionX} min={-5} max={5} step={0.05}
            onChange={(v) => patch({ positionX: v })} />
          <SliderRow label="Pozisyon Y" value={s.positionY} min={-5} max={5} step={0.05}
            onChange={(v) => patch({ positionY: v })} />
          <SliderRow label="Pozisyon Z" value={s.positionZ ?? 0} min={-5} max={5} step={0.05}
            onChange={(v) => patch({ positionZ: v })} />
          <SliderRow label="Opaklik" value={s.opacity} min={0} max={1} step={0.01}
            display={`${Math.round(s.opacity * 100)}%`}
            onChange={(v) => patch({ opacity: v })} />
        </div>
      </section>

      {/* Behaviour */}
      <section>
        <h4 className="text-[11px] uppercase tracking-widest mb-3" style={{ color: '#64748b' }}>
          Hareket
        </h4>
        <div className="flex flex-col gap-3">
          <SliderRow label="Idle Siddet" value={s.idleIntensity} min={0} max={1}
            onChange={(v) => patch({ idleIntensity: v })} />
          <SliderRow label="Kafa Takip Siddeti" value={s.headFollowIntensity} min={0} max={1}
            onChange={(v) => patch({ headFollowIntensity: v })} />
          <SliderRow label="Goz Kirpma Sikligi (sn)" value={s.blinkInterval} min={1} max={12} step={0.5}
            display={`${s.blinkInterval}s`}
            onChange={(v) => patch({ blinkInterval: v })} />
          <SliderRow label="Agiz Acikligi" value={s.mouthOpenScale} min={0} max={1}
            onChange={(v) => patch({ mouthOpenScale: v })} />
        </div>
      </section>

      {/* Toggles */}
      <section>
        <h4 className="text-[11px] uppercase tracking-widest mb-3" style={{ color: '#64748b' }}>
          Pencere
        </h4>
        <div className="flex flex-col gap-2">
          {([
            { key: 'alwaysOnTop', label: 'Her Zaman Ustte' },
            { key: 'mouseFollow', label: 'Mouse Takip' },
            { key: 'shadow', label: 'Golge' },
          ] as const).map(({ key, label }) => (
            <label key={key} className="flex items-center justify-between cursor-pointer">
              <span className="text-xs" style={{ color: '#94a3b8' }}>{label}</span>
              <button
                onClick={() => patchAndLog({ [key]: !s[key] })}
                className="relative w-9 h-5 rounded-full transition-all"
                style={{
                  background: s[key] ? 'rgba(139,92,246,0.8)' : 'rgba(30,40,70,0.8)',
                  border: `1px solid ${s[key] ? 'rgba(139,92,246,0.6)' : 'rgba(100,116,139,0.3)'}`,
                }}
              >
                <span
                  className="absolute top-0.5 rounded-full transition-all"
                  style={{
                    width: 14, height: 14,
                    background: '#fff',
                    left: s[key] ? 18 : 2,
                    transition: 'left 0.15s',
                  }}
                />
              </button>
            </label>
          ))}
        </div>
      </section>

      {/* Render quality */}
      <section>
        <h4 className="text-[11px] uppercase tracking-widest mb-3" style={{ color: '#64748b' }}>
          Render Kalitesi
        </h4>
        <div className="flex gap-2">
          {(['balanced', 'high', 'ultra'] as RenderQuality[]).map((q) => (
            <button
              key={q}
              onClick={() => patchAndLog({ renderQuality: q }, `Render kalitesi: ${q}`)}
              className="flex-1 py-1.5 rounded-lg text-xs font-medium capitalize transition-all"
              style={{
                background: s.renderQuality === q ? 'rgba(139,92,246,0.2)' : 'rgba(15,20,40,0.5)',
                border: `1px solid ${s.renderQuality === q ? 'rgba(139,92,246,0.5)' : 'rgba(139,92,246,0.1)'}`,
                color: s.renderQuality === q ? '#8b5cf6' : '#64748b',
              }}
            >
              {q === 'balanced' ? 'Dengeli' : q === 'high' ? 'Yuksek' : 'Ultra'}
            </button>
          ))}
        </div>

        <div className="flex gap-2 mt-2">
          {(['device', 'fixed2', 'fixed1'] as PixelRatioMode[]).map((m) => (
            <button
              key={m}
              onClick={() => patch({ pixelRatioMode: m })}
              className="flex-1 py-1.5 rounded-lg text-[10px] font-medium transition-all"
              style={{
                background: s.pixelRatioMode === m ? 'rgba(6,182,212,0.15)' : 'rgba(15,20,40,0.5)',
                border: `1px solid ${s.pixelRatioMode === m ? 'rgba(6,182,212,0.4)' : 'rgba(139,92,246,0.1)'}`,
                color: s.pixelRatioMode === m ? '#06b6d4' : '#64748b',
              }}
            >
              {m === 'device' ? 'Cihaz DPR' : m === 'fixed2' ? 'DPR x2' : 'DPR x1'}
            </button>
          ))}
        </div>
      </section>
    </div>
  )
}
