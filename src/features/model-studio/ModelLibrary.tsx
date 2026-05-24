import React, { useState } from 'react'
import { Star, Eye, Trash2, Info, HardDrive, Calendar } from 'lucide-react'
import { useModelStore } from './modelStore'
import { LICENSE_LABELS } from './types'
import type { ModelMeta } from './types'

interface Props {
  onPreview?: (meta: ModelMeta) => void
}

export default function ModelLibrary({ onPreview }: Props) {
  const { models, activeModelId, setActiveModelId, removeModel, addLog, updateModel } = useModelStore()
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)

  const alice = () =>
    (window as unknown as Record<string, Record<string, (...a: unknown[]) => unknown>>)['alice']

  const handleSetActive = async (id: string) => {
    try {
      await alice().model.setActive(id)
    } catch { /* browser preview */ }
    // Update local state
    models.forEach((m) => updateModel(m.id, { isActive: m.id === id }))
    setActiveModelId(id)
    addLog('success', `Aktif karakter degistirildi: ${models.find((m) => m.id === id)?.name}`)
  }

  const handleDelete = async (id: string) => {
    const meta = models.find((m) => m.id === id)
    try {
      await alice().model.delete(id)
    } catch { /* browser preview */ }
    removeModel(id)
    if (activeModelId === id) setActiveModelId(null)
    addLog('info', `Model silindi: ${meta?.name}`)
    setConfirmDelete(null)
  }

  if (models.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 py-10" style={{ color: '#475569' }}>
        <HardDrive size={28} strokeWidth={1.2} />
        <span className="text-xs">Henuz model yuklenmedi</span>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-2">
      {models.map((meta) => {
        const isActive = meta.id === activeModelId
        return (
          <div
            key={meta.id}
            className="rounded-xl overflow-hidden transition-all"
            style={{
              background: 'rgba(15,20,40,0.6)',
              border: isActive
                ? '1px solid rgba(139,92,246,0.7)'
                : '1px solid rgba(139,92,246,0.12)',
              boxShadow: isActive
                ? '0 0 20px rgba(139,92,246,0.18), inset 0 0 12px rgba(139,92,246,0.04)'
                : 'none',
            }}
          >
            <div className="flex gap-3 p-3">
              {/* Preview image */}
              <div
                className="flex-shrink-0 rounded-lg overflow-hidden flex items-center justify-center"
                style={{ width: 56, height: 56, background: 'rgba(139,92,246,0.08)', border: '1px solid rgba(139,92,246,0.15)' }}
              >
                {meta.previewImage ? (
                  <img src={meta.previewImage} alt={meta.name} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-xl" style={{ color: 'rgba(139,92,246,0.3)' }}>3D</span>
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0 flex flex-col justify-between">
                <div className="flex items-start gap-2">
                  <span className="text-sm font-semibold truncate flex-1" style={{ color: '#f1f5f9' }}>
                    {meta.name}
                  </span>
                  {isActive && (
                    <span
                      className="flex-shrink-0 text-[10px] px-1.5 py-0.5 rounded font-bold"
                      style={{ background: 'rgba(139,92,246,0.2)', color: '#8b5cf6', border: '1px solid rgba(139,92,246,0.4)' }}
                    >
                      AKTIF
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-3 text-[11px]" style={{ color: '#64748b' }}>
                  <span className="flex items-center gap-1">
                    <HardDrive size={10} />
                    {(meta.fileSize / (1024 * 1024)).toFixed(1)} MB
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar size={10} />
                    {new Date(meta.createdAt).toLocaleDateString('tr-TR')}
                  </span>
                </div>

                <span
                  className="text-[10px] px-1.5 py-0.5 rounded w-fit"
                  style={{
                    background: meta.licenseType === 'unknown' ? 'rgba(239,68,68,0.1)' : 'rgba(6,182,212,0.1)',
                    color: meta.licenseType === 'unknown' ? '#f87171' : '#06b6d4',
                    border: `1px solid ${meta.licenseType === 'unknown' ? 'rgba(239,68,68,0.25)' : 'rgba(6,182,212,0.2)'}`,
                  }}
                >
                  {LICENSE_LABELS[meta.licenseType]}
                </span>
              </div>
            </div>

            {/* Actions */}
            <div
              className="flex items-center gap-1 px-3 py-2 border-t"
              style={{ borderColor: 'rgba(139,92,246,0.08)' }}
            >
              {!isActive && (
                <button
                  onClick={() => handleSetActive(meta.id)}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all"
                  style={{ background: 'rgba(139,92,246,0.15)', color: '#8b5cf6', border: '1px solid rgba(139,92,246,0.3)' }}
                >
                  <Star size={11} />
                  Aktif Karakter Yap
                </button>
              )}

              <button
                onClick={() => onPreview?.(meta)}
                className="flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] transition-all"
                style={{ background: 'rgba(6,182,212,0.1)', color: '#06b6d4', border: '1px solid rgba(6,182,212,0.2)' }}
              >
                <Eye size={11} />
                Onizle
              </button>

              {meta.sourceUrl && (
                <a
                  href={meta.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] transition-all"
                  style={{ background: 'rgba(100,116,139,0.1)', color: '#94a3b8', border: '1px solid rgba(100,116,139,0.2)' }}
                >
                  <Info size={11} />
                  Lisans
                </a>
              )}

              <div className="flex-1" />

              {confirmDelete === meta.id ? (
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleDelete(meta.id)}
                    className="px-2 py-1 rounded-lg text-[11px]"
                    style={{ background: 'rgba(239,68,68,0.2)', color: '#f87171', border: '1px solid rgba(239,68,68,0.4)' }}
                  >
                    Evet, Sil
                  </button>
                  <button
                    onClick={() => setConfirmDelete(null)}
                    className="px-2 py-1 rounded-lg text-[11px]"
                    style={{ background: 'transparent', color: '#64748b', border: '1px solid rgba(100,116,139,0.2)' }}
                  >
                    Iptal
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setConfirmDelete(meta.id)}
                  className="p-1.5 rounded-lg transition-all"
                  style={{ background: 'transparent', color: '#475569', border: '1px solid transparent' }}
                >
                  <Trash2 size={12} />
                </button>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
