import React, { useRef, useState, useCallback } from 'react'
import { Upload, FileWarning } from 'lucide-react'
import { v4 as uuidv4 } from 'uuid'
import type { LicenseType, ModelMeta } from './types'
import { DEFAULT_MODEL_SETTINGS, LICENSE_LABELS } from './types'
import { useModelStore } from './modelStore'
import LicenseWarning from './LicenseWarning'

// Inline tiny uuid implementation if uuid isn't installed
function genId(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0
    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16)
  })
}

const MB = 1024 * 1024
const LARGE_FILE_THRESHOLD = 50 * MB  // warn at 50 MB

interface Props {
  onFileReady?: (buffer: ArrayBuffer, meta: ModelMeta) => void
}

export default function ModelUploader({ onFileReady }: Props) {
  const { addLog, addModel } = useModelStore()
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = useState(false)
  const [saving, setSaving]   = useState(false)

  // Form state
  const [name, setName]         = useState('')
  const [sourceUrl, setSourceUrl] = useState('')
  const [licenseType, setLicense] = useState<LicenseType>('unknown')
  const [sizeWarn, setSizeWarn]   = useState(false)
  const [pendingFile, setPending]  = useState<File | null>(null)

  const alice = () =>
    (window as unknown as Record<string, Record<string, (...a: unknown[]) => unknown>>)['alice']

  const handleFile = useCallback(async (file: File) => {
    if (!file.name.endsWith('.vrm')) {
      addLog('error', `Hata: "${file.name}" bir .vrm dosyası değil`)
      return
    }
    setSizeWarn(file.size > LARGE_FILE_THRESHOLD)
    setPending(file)
    if (!name) setName(file.name.replace(/\.vrm$/i, ''))
    addLog('info', `Model dosyası seçildi: ${file.name} (${(file.size / MB).toFixed(1)} MB)`)
  }, [addLog, name])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }, [handleFile])

  const handleSave = useCallback(async () => {
    if (!pendingFile) return
    setSaving(true)

    const buffer = await pendingFile.arrayBuffer()
    const meta: ModelMeta = {
      id: genId(),
      name: name.trim() || pendingFile.name.replace(/\.vrm$/i, ''),
      sourceUrl: sourceUrl.trim(),
      licenseType,
      fileName: pendingFile.name,
      fileSize: pendingFile.size,
      createdAt: new Date().toISOString(),
      isActive: false,
      previewImage: '',
      settings: { ...DEFAULT_MODEL_SETTINGS },
    }

    try {
      const result = await alice().model.save(buffer, meta) as { success: boolean; error?: string }
      if (result.success) {
        addModel(meta)
        addLog('success', `Model kaydedildi: ${meta.name}`)
        onFileReady?.(buffer, meta)
        // Reset form
        setPending(null)
        setName('')
        setSourceUrl('')
        setLicense('unknown')
        setSizeWarn(false)
      } else {
        addLog('error', `Hata: Model silinemedi — ${result.error}`)
      }
    } catch {
      addLog('error', 'Hata: Electron API mevcut değil (tarayıcı önizlemesi)')
      // In browser preview: still call onFileReady with the buffer
      addModel(meta)
      onFileReady?.(buffer, meta)
    } finally {
      setSaving(false)
    }
  }, [pendingFile, name, sourceUrl, licenseType, addLog, addModel, onFileReady])

  return (
    <div className="flex flex-col gap-4">
      {/* Drop zone */}
      <div
        role="button"
        tabIndex={0}
        onClick={() => inputRef.current?.click()}
        onKeyDown={(e) => e.key === 'Enter' && inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        className="flex flex-col items-center justify-center gap-2 rounded-xl p-6 cursor-pointer transition-all"
        style={{
          border: `2px dashed ${dragging ? '#8b5cf6' : pendingFile ? '#06b6d4' : 'rgba(139,92,246,0.25)'}`,
          background: dragging ? 'rgba(139,92,246,0.06)' : pendingFile ? 'rgba(6,182,212,0.04)' : 'transparent',
          minHeight: 120,
        }}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".vrm"
          className="hidden"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f) }}
        />
        {pendingFile ? (
          <>
            <div className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ background: 'rgba(6,182,212,0.15)', color: '#06b6d4' }}>
              <Upload size={16} />
            </div>
            <span className="text-xs text-center" style={{ color: '#06b6d4' }}>
              {pendingFile.name}
            </span>
            <span className="text-[10px]" style={{ color: '#64748b' }}>
              {(pendingFile.size / MB).toFixed(1)} MB
            </span>
          </>
        ) : (
          <>
            <Upload size={22} style={{ color: 'rgba(139,92,246,0.5)' }} />
            <span className="text-xs text-center" style={{ color: '#64748b' }}>
              .vrm dosyasını buraya sürükle veya tıkla
            </span>
            <span className="text-[10px]" style={{ color: '#475569' }}>
              Sadece .vrm formatı kabul edilir
            </span>
          </>
        )}
      </div>

      {/* Size warning */}
      {sizeWarn && (
        <div className="flex items-start gap-2 rounded-lg p-3 text-xs"
          style={{ background: 'rgba(234,179,8,0.08)', border: '1px solid rgba(234,179,8,0.3)', color: '#fbbf24' }}>
          <FileWarning size={13} className="flex-shrink-0 mt-0.5" />
          <span>Bu dosya 50 MB&apos;dan büyük. Yükleme biraz uzun sürebilir.</span>
        </div>
      )}

      {/* Form fields */}
      <div className="flex flex-col gap-3">
        {/* Model adı */}
        <div className="flex flex-col gap-1">
          <label className="text-[11px] uppercase tracking-wider" style={{ color: '#64748b' }}>
            Model Adı
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Alice, Miku..."
            className="w-full rounded-lg px-3 py-2 text-sm outline-none"
            style={{
              background: 'rgba(15,20,40,0.6)',
              border: '1px solid rgba(139,92,246,0.2)',
              color: '#f1f5f9',
            }}
          />
        </div>

        {/* Kaynak URL */}
        <div className="flex flex-col gap-1">
          <label className="text-[11px] uppercase tracking-wider" style={{ color: '#64748b' }}>
            Kaynak URL (opsiyonel)
          </label>
          <input
            type="url"
            value={sourceUrl}
            onChange={(e) => setSourceUrl(e.target.value)}
            placeholder="https://booth.pm/..."
            className="w-full rounded-lg px-3 py-2 text-sm outline-none"
            style={{
              background: 'rgba(15,20,40,0.6)',
              border: '1px solid rgba(139,92,246,0.2)',
              color: '#f1f5f9',
            }}
          />
        </div>

        {/* Lisans tipi */}
        <div className="flex flex-col gap-1">
          <label className="text-[11px] uppercase tracking-wider" style={{ color: '#64748b' }}>
            Lisans Tipi
          </label>
          <select
            value={licenseType}
            onChange={(e) => setLicense(e.target.value as LicenseType)}
            className="w-full rounded-lg px-3 py-2 text-sm outline-none"
            style={{
              background: 'rgba(15,20,40,0.9)',
              border: `1px solid ${licenseType === 'unknown' ? 'rgba(239,68,68,0.4)' : 'rgba(139,92,246,0.2)'}`,
              color: '#f1f5f9',
            }}
          >
            {(Object.entries(LICENSE_LABELS) as [LicenseType, string][]).map(([val, label]) => (
              <option key={val} value={val}>{label}</option>
            ))}
          </select>
        </div>

        <LicenseWarning licenseType={licenseType} />
      </div>

      {/* Save button */}
      <button
        onClick={handleSave}
        disabled={!pendingFile || saving}
        className="w-full py-2.5 rounded-xl text-sm font-semibold transition-all"
        style={{
          background: !pendingFile || saving ? 'rgba(139,92,246,0.1)' : 'rgba(139,92,246,0.2)',
          border: `1px solid ${!pendingFile || saving ? 'rgba(139,92,246,0.15)' : 'rgba(139,92,246,0.5)'}`,
          color: !pendingFile || saving ? '#64748b' : '#8b5cf6',
          boxShadow: pendingFile && !saving ? '0 0 16px rgba(139,92,246,0.15)' : 'none',
          cursor: !pendingFile || saving ? 'not-allowed' : 'pointer',
        }}
      >
        {saving ? 'Kaydediliyor...' : 'Modeli Kaydet'}
      </button>
    </div>
  )
}
