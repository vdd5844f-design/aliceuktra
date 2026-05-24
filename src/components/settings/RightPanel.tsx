import React, { useState } from 'react'
import { motion } from 'framer-motion'
import {
  Cat, Check, Volume2, Brain, Settings, Trash2, RefreshCw,
  User, Shirt, Zap, Code2, FolderOpen,
} from 'lucide-react'
import { useAppStore } from '../../stores/appStore'
import { PROVIDERS, EMOTION_LABELS, type Emotion } from '../../types'

// ── Electron IPC accessor
const alice = () =>
  (window as unknown as Record<string, unknown>)['alice'] as
    Record<string, Record<string, (...args: unknown[]) => unknown>>

// ─────────────────────────────────────────────
// Shared primitives
// ─────────────────────────────────────────────

const CARD = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
  <div
    className={`rounded-xl p-3 ${className}`}
    style={{ background: 'rgba(14,22,48,0.7)', border: '1px solid rgba(139,92,246,0.12)', backdropFilter: 'blur(10px)' }}
  >
    {children}
  </div>
)

const SECTION = ({ children }: { children: React.ReactNode }) => (
  <p
    className="text-[10px] font-semibold uppercase tracking-widest mb-2"
    style={{ color: '#475569', fontFamily: 'Rajdhani, sans-serif', letterSpacing: '0.08em' }}
  >
    {children}
  </p>
)

const FIELD = ({
  label, value, onChange, type = 'text', placeholder = '',
}: {
  label: string; value: string; onChange: (v: string) => void
  type?: string; placeholder?: string
}) => (
  <div className="mb-2">
    <p className="text-[10px] mb-1" style={{ color: '#64748b' }}>{label}</p>
    <input
      type={type}
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full text-xs px-3 py-2 rounded-lg outline-none"
      style={{ background: 'rgba(8,12,32,0.7)', color: '#f1f5f9', border: '1px solid rgba(139,92,246,0.15)' }}
    />
  </div>
)

const TOGGLE = ({
  label, value, onChange,
}: {
  label: string; value: boolean; onChange: (v: boolean) => void
}) => (
  <div className="flex items-center justify-between py-0.5">
    <span className="text-xs" style={{ color: '#94a3b8' }}>{label}</span>
    <button
      onClick={() => onChange(!value)}
      className="w-9 h-5 rounded-full relative cursor-pointer transition-all"
      style={{
        background: value ? 'rgba(139,92,246,0.55)' : 'rgba(55,65,81,0.5)',
        border: `1px solid ${value ? 'rgba(139,92,246,0.8)' : 'rgba(55,65,81,0.7)'}`,
        boxShadow: value ? '0 0 8px rgba(139,92,246,0.25)' : 'none',
      }}
    >
      <div
        className="absolute top-0.5 w-4 h-4 rounded-full transition-all"
        style={{ background: '#fff', left: value ? '18px' : '2px' }}
      />
    </button>
  </div>
)

const BTN = ({
  onClick, children, color = '#8b5cf6', glow = false, disabled = false, fullWidth = true,
}: {
  onClick: () => void; children: React.ReactNode
  color?: string; glow?: boolean; disabled?: boolean; fullWidth?: boolean
}) => (
  <motion.button
    whileHover={{ scale: disabled ? 1 : 1.02 }}
    whileTap={{ scale: disabled ? 1 : 0.97 }}
    onClick={onClick}
    disabled={disabled}
    className={`flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-medium cursor-pointer ${fullWidth ? 'w-full' : 'flex-1'}`}
    style={{
      background: `${color}15`,
      border: `1px solid ${color}30`,
      color,
      boxShadow: glow ? `0 0 14px ${color}25` : 'none',
      opacity: disabled ? 0.5 : 1,
    }}
  >
    {children}
  </motion.button>
)

// ─────────────────────────────────────────────
// Karakter sekmesi
// ─────────────────────────────────────────────
function KarakterTab() {
  const { characters, activeCharacterId, setActiveCharacterId } = useAppStore()

  if (characters.length === 0)
    return (
      <div className="flex flex-col items-center justify-center py-12 gap-3" style={{ color: '#475569' }}>
        <User size={28} style={{ color: '#374151' }} />
        <p className="text-sm">Karakter bulunamadı</p>
        <p className="text-xs text-center" style={{ color: '#374151' }}>
          assets/ klasörünü kontrol edin ve<br />Varlıkları Yenile butonuna tıklayın
        </p>
      </div>
    )

  return (
    <div className="flex flex-col gap-2">
      {characters.map(char => {
        const active = activeCharacterId === char.id
        return (
          <motion.div
            key={char.id}
            whileHover={{ x: 2 }}
            onClick={() => setActiveCharacterId(char.id)}
            className="flex items-center gap-3 p-2.5 rounded-xl cursor-pointer transition-all"
            style={{
              background: active ? 'rgba(139,92,246,0.14)' : 'rgba(139,92,246,0.04)',
              border: `1px solid ${active ? 'rgba(139,92,246,0.38)' : 'rgba(139,92,246,0.08)'}`,
              boxShadow: active ? '0 0 12px rgba(139,92,246,0.1)' : 'none',
            }}
          >
            {/* Preview thumbnail */}
            <div
              className="w-12 h-16 rounded-lg overflow-hidden flex-shrink-0 flex items-center justify-center"
              style={{ background: 'rgba(8,12,32,0.7)', border: '1px solid rgba(139,92,246,0.15)' }}
            >
              {char.previewUrl ? (
                <img
                  src={char.previewUrl}
                  alt={char.name}
                  className="w-full h-full object-contain"
                  style={{ imageRendering: 'pixelated' }}
                />
              ) : (
                <User size={16} style={{ color: '#374151' }} />
              )}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <p
                className="text-sm font-semibold truncate"
                style={{ color: active ? '#8b5cf6' : '#e2e8f0', fontFamily: 'Rajdhani, sans-serif' }}
              >
                {char.name}
              </p>
              <p className="text-[10px] mt-0.5" style={{ color: '#64748b' }}>
                {char.outfits.length} kıyafet
              </p>
              <p className="text-[10px]" style={{ color: '#475569' }}>
                {char.totalPng} PNG
              </p>

              {/* Aktif Yap button */}
              {!active && (
                <button
                  onClick={e => { e.stopPropagation(); setActiveCharacterId(char.id) }}
                  className="mt-1 px-2 py-0.5 rounded-md text-[10px] cursor-pointer"
                  style={{ background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.2)', color: '#8b5cf6' }}
                >
                  Aktif Yap
                </button>
              )}
            </div>

            {active && (
              <div className="flex flex-col items-center gap-1 flex-shrink-0">
                <Check size={14} style={{ color: '#8b5cf6' }} />
                <span className="text-[9px]" style={{ color: '#8b5cf6' }}>Aktif</span>
              </div>
            )}
          </motion.div>
        )
      })}
    </div>
  )
}

// ─────────────────────────────────────────────
// Kıyafet sekmesi
// ─────────────────────────────────────────────
function KiyafetTab() {
  const { characters, activeCharacterId, activeOutfitId, setActiveOutfitId } = useAppStore()
  const char = characters.find(c => c.id === activeCharacterId)

  if (!char)
    return (
      <p className="text-xs text-center py-8" style={{ color: '#475569' }}>
        Önce bir karakter seçin
      </p>
    )

  if (char.outfits.length === 0)
    return (
      <div className="flex flex-col items-center gap-2 py-8" style={{ color: '#475569' }}>
        <Shirt size={24} style={{ color: '#374151' }} />
        <p className="text-xs">Bu karakter için kıyafet bulunamadı</p>
      </div>
    )

  const EMOTION_BADGE_KEYS: Emotion[] = ['idle', 'talk', 'happy', 'angry', 'sleep']

  return (
    <div className="flex flex-col gap-2">
      <p className="text-[10px] mb-1" style={{ color: '#475569' }}>
        {char.name} — {char.outfits.length} kıyafet
      </p>
      {char.outfits.map(outfit => {
        const active = activeOutfitId === outfit.id
        return (
          <motion.div
            key={outfit.id}
            whileHover={{ x: 2 }}
            onClick={() => setActiveOutfitId(outfit.id)}
            className="flex gap-3 p-2.5 rounded-xl cursor-pointer transition-all"
            style={{
              background: active ? 'rgba(139,92,246,0.12)' : 'rgba(139,92,246,0.03)',
              border: `1px solid ${active ? 'rgba(139,92,246,0.3)' : 'rgba(139,92,246,0.07)'}`,
              boxShadow: active ? '0 0 10px rgba(139,92,246,0.08)' : 'none',
            }}
          >
            {/* Thumbnail */}
            <div
              className="w-14 h-18 rounded-lg overflow-hidden flex-shrink-0 flex items-center justify-center"
              style={{ width: 52, height: 64, background: 'rgba(8,12,32,0.7)', border: '1px solid rgba(139,92,246,0.12)' }}
            >
              {outfit.previewUrl ? (
                <img
                  src={outfit.previewUrl}
                  alt={outfit.name}
                  className="w-full h-full object-contain"
                  style={{ imageRendering: 'pixelated' }}
                />
              ) : (
                <Shirt size={14} style={{ color: '#374151' }} />
              )}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              {/* Name + badges row */}
              <div className="flex items-center gap-1.5 flex-wrap mb-1.5">
                <p
                  className="text-xs font-semibold"
                  style={{ color: active ? '#8b5cf6' : '#e2e8f0', fontFamily: 'Rajdhani, sans-serif' }}
                >
                  {outfit.name}
                </p>

                {outfit.isCat && (
                  <span
                    className="flex items-center gap-0.5 text-[9px] px-1.5 py-0.5 rounded-full"
                    style={{ background: 'rgba(236,72,153,0.1)', border: '1px solid rgba(236,72,153,0.2)', color: '#ec4899' }}
                  >
                    <Cat size={8} />
                    Neko
                  </span>
                )}

                <span
                  className="text-[9px] px-1.5 py-0.5 rounded-full"
                  style={{
                    background: outfit.mode === 'frames' ? 'rgba(16,185,129,0.1)' : 'rgba(6,182,212,0.1)',
                    border: `1px solid ${outfit.mode === 'frames' ? 'rgba(16,185,129,0.2)' : 'rgba(6,182,212,0.2)'}`,
                    color: outfit.mode === 'frames' ? '#10b981' : '#06b6d4',
                  }}
                >
                  {outfit.mode === 'frames' ? 'Animasyon' : 'Statik'}
                </span>
              </div>

              {/* Emotion coverage badges */}
              <div className="flex gap-1 flex-wrap mb-1.5">
                {EMOTION_BADGE_KEYS.map(e => {
                  const has = outfit.emotions.includes(e)
                  return (
                    <span
                      key={e}
                      className="text-[9px] px-1.5 py-0.5 rounded-full"
                      style={{
                        background: has ? 'rgba(139,92,246,0.12)' : 'rgba(30,40,80,0.5)',
                        border: `1px solid ${has ? 'rgba(139,92,246,0.28)' : 'rgba(55,65,81,0.4)'}`,
                        color: has ? '#a78bfa' : '#374151',
                      }}
                    >
                      {EMOTION_LABELS[e]}
                    </span>
                  )
                })}
              </div>

              <p className="text-[10px]" style={{ color: '#475569' }}>
                {outfit.totalPng} PNG · {outfit.packName}
              </p>

              {!active && (
                <button
                  onClick={e => { e.stopPropagation(); setActiveOutfitId(outfit.id) }}
                  className="mt-1 px-2 py-0.5 rounded-md text-[10px] cursor-pointer"
                  style={{ background: 'rgba(6,182,212,0.08)', border: '1px solid rgba(6,182,212,0.2)', color: '#06b6d4' }}
                >
                  Aktif Yap
                </button>
              )}
            </div>

            {active && <Check size={13} style={{ color: '#8b5cf6', flexShrink: 0 }} />}
          </motion.div>
        )
      })}
    </div>
  )
}

// ─────────────────────────────────────────────
// Ses sekmesi
// ─────────────────────────────────────────────
function SesTab() {
  const { settings, setSettings, isTalking } = useAppStore()
  const voice = settings.voice

  const testSpeak = () => {
    alice().voice.speak({
      text: 'Merhaba! Ben Alice, yapay zeka arkadaşınım.',
      voice: voice.voiceName,
      rate: voice.rate,
      pitch: voice.pitch,
      volume: voice.volume,
    })
  }

  const stopSpeak = () => {
    alice().voice.stop()
  }

  return (
    <div className="flex flex-col gap-3">
      <CARD>
        <SECTION>Ses Motoru</SECTION>
        <div className="mb-3">
          <TOGGLE
            label="Otomatik Konuş"
            value={voice.autoSpeak}
            onChange={v => setSettings({ voice: { ...voice, autoSpeak: v } })}
          />
        </div>
        <FIELD
          label="Ses Adı"
          value={voice.voiceName}
          onChange={v => setSettings({ voice: { ...voice, voiceName: v } })}
          placeholder="tr-TR-EmelNeural"
        />
        <FIELD
          label="Konuşma Hızı"
          value={voice.rate}
          onChange={v => setSettings({ voice: { ...voice, rate: v } })}
          placeholder="-10%"
        />
        <FIELD
          label="Pitch"
          value={voice.pitch}
          onChange={v => setSettings({ voice: { ...voice, pitch: v } })}
          placeholder="+6Hz"
        />
        <FIELD
          label="Ses Seviyesi"
          value={voice.volume}
          onChange={v => setSettings({ voice: { ...voice, volume: v } })}
          placeholder="+8%"
        />
      </CARD>

      <div className="flex gap-2">
        <BTN onClick={testSpeak} color="#06b6d4" fullWidth={false}>
          <Volume2 size={12} /> Test Sesi
        </BTN>
        <BTN onClick={stopSpeak} color="#ec4899" fullWidth={false}>
          Durdur
        </BTN>
      </div>

      {/* Talking indicator */}
      <div
        className="flex items-center gap-2 px-3 py-2 rounded-xl"
        style={{
          background: isTalking ? 'rgba(16,185,129,0.08)' : 'rgba(30,42,84,0.4)',
          border: `1px solid ${isTalking ? 'rgba(16,185,129,0.2)' : 'rgba(55,65,81,0.2)'}`,
        }}
      >
        <motion.div
          className="w-2 h-2 rounded-full"
          style={{ background: isTalking ? '#10b981' : '#374151' }}
          animate={{ opacity: isTalking ? [1, 0.3, 1] : 1 }}
          transition={{ duration: 0.6, repeat: isTalking ? Infinity : 0 }}
        />
        <span className="text-xs" style={{ color: isTalking ? '#10b981' : '#475569' }}>
          {isTalking ? 'Konuşuyor...' : 'Bekliyor'}
        </span>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────
// Hafıza sekmesi
// ─────────────────────────────────────────────
function HafizaTab() {
  const { messages, clearMessages } = useAppStore()
  const userCount = messages.filter(m => m.role === 'user').length
  const assistantCount = messages.filter(m => m.role === 'assistant').length

  return (
    <div className="flex flex-col gap-3">
      <CARD>
        <SECTION>Sohbet Hafızası</SECTION>
        <div className="flex flex-col gap-1.5">
          {[
            { label: 'Toplam mesaj', value: messages.length, color: '#8b5cf6' },
            { label: 'Kullanıcı', value: userCount, color: '#06b6d4' },
            { label: 'Asistan', value: assistantCount, color: '#8b5cf6' },
          ].map(({ label, value, color }) => (
            <div key={label} className="flex justify-between items-center">
              <span className="text-xs" style={{ color: '#94a3b8' }}>{label}</span>
              <span className="text-xs font-semibold" style={{ color }}>{value}</span>
            </div>
          ))}
        </div>
        <p className="text-[10px] mt-3 leading-relaxed" style={{ color: '#374151' }}>
          Hafıza temizlendiğinde AI önceki mesajları hatırlamaz.
        </p>
      </CARD>

      <BTN onClick={clearMessages} color="#ec4899">
        <Trash2 size={12} /> Hafızayı Temizle
      </BTN>
    </div>
  )
}

// ─────────────────────────────────────────────
// Ayarlar sekmesi
// ─────────────────────────────────────────────
function AyarlarTab() {
  const { settings, setSettings } = useAppStore()

  const saveToElectron = async () => {
    try {
      await alice().settings.set(settings)
    } catch { /* tarayıcıda IPC yok */ }
  }

  return (
    <div className="flex flex-col gap-3">
      {/* AI */}
      <CARD>
        <SECTION>Yapay Zeka</SECTION>
        <div className="mb-2">
          <p className="text-[10px] mb-1" style={{ color: '#64748b' }}>Sağlayıcı</p>
          <select
            value={settings.provider}
            onChange={e => setSettings({ provider: e.target.value as typeof settings.provider })}
            className="w-full text-xs px-3 py-2 rounded-lg outline-none"
            style={{ background: 'rgba(8,12,32,0.7)', color: '#f1f5f9', border: '1px solid rgba(139,92,246,0.15)', cursor: 'pointer' }}
          >
            {PROVIDERS.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
          </select>
        </div>
        <FIELD label="Sunucu URL" value={settings.baseUrl} onChange={v => setSettings({ baseUrl: v })} />
        <FIELD label="API Anahtarı" value={settings.apiKey} onChange={v => setSettings({ apiKey: v })} type="password" />
        <FIELD label="Model" value={settings.model} onChange={v => setSettings({ model: v })} placeholder="gemma3:4b" />
      </CARD>

      {/* Persona */}
      <CARD>
        <SECTION>Persona</SECTION>
        <textarea
          value={settings.persona}
          onChange={e => setSettings({ persona: e.target.value })}
          rows={5}
          className="w-full text-xs px-3 py-2 rounded-lg outline-none resize-none"
          style={{
            background: 'rgba(8,12,32,0.7)', color: '#f1f5f9',
            border: '1px solid rgba(139,92,246,0.15)', lineHeight: 1.5,
          }}
        />
      </CARD>

      {/* Pencere */}
      <CARD>
        <SECTION>Pencere</SECTION>
        <TOGGLE
          label="Her Zaman Üstte"
          value={settings.window.alwaysOnTop}
          onChange={v => {
            setSettings({ window: { alwaysOnTop: v } })
            try { alice().window.setAlwaysOnTop(v) } catch { /* ignore */ }
          }}
        />
      </CARD>

      <BTN onClick={saveToElectron} color="#8b5cf6" glow>
        <Zap size={12} /> Kaydet
      </BTN>
      <BTN onClick={() => { try { alice().window.close() } catch { /* ignore */ } }} color="#ec4899">
        Çıkış
      </BTN>
    </div>
  )
}

// ─────────────────────────────────────────────
// Geliştirici sekmesi
// ─────────────────────────────────────────────
function GelistiriciTab() {
  const {
    scanResult, activeCharacterId, activeOutfitId, activeEmotion,
    currentSprite, setScanResult, characters,
  } = useAppStore()

  const [customRoot, setCustomRoot] = useState('')
  const [scanning, setScanning] = useState(false)

  const activeChar = characters.find(c => c.id === activeCharacterId)
  const activeOutfit = activeChar?.outfits.find(o => o.id === activeOutfitId)

  const setRoot = async () => {
    if (!customRoot.trim()) return
    setScanning(true)
    try {
      const result = await alice().assets.setAssetsRoot(customRoot.trim()) as Parameters<typeof setScanResult>[0]
      setScanResult(result)
    } finally { setScanning(false) }
  }

  const reload = async () => {
    setScanning(true)
    try {
      const result = await alice().assets.reload() as Parameters<typeof setScanResult>[0]
      setScanResult(result)
    } finally { setScanning(false) }
  }

  const Row = ({ label, value, color = '#94a3b8' }: { label: string; value: string | number | null | undefined; color?: string }) => (
    <div className="flex justify-between items-start gap-2 py-0.5">
      <span className="text-[10px] flex-shrink-0" style={{ color: '#475569' }}>{label}</span>
      <span className="text-[10px] text-right break-all font-mono" style={{ color, maxWidth: '62%' }}>
        {value ?? '—'}
      </span>
    </div>
  )

  const totalOutfits = scanResult?.characters.reduce((s, c) => s + c.outfits.length, 0) ?? 0

  return (
    <div className="flex flex-col gap-3">
      {/* Assets root setter */}
      <CARD>
        <SECTION>Assets Kök Klasörü</SECTION>
        <div className="flex gap-2">
          <input
            value={customRoot}
            onChange={e => setCustomRoot(e.target.value)}
            placeholder="C:/ALICE-AI/assets"
            className="flex-1 text-xs px-2 py-1.5 rounded-lg outline-none"
            style={{ background: 'rgba(8,12,32,0.7)', color: '#f1f5f9', border: '1px solid rgba(139,92,246,0.15)' }}
          />
          <button
            onClick={setRoot}
            disabled={!customRoot.trim() || scanning}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs cursor-pointer"
            style={{ background: 'rgba(139,92,246,0.14)', border: '1px solid rgba(139,92,246,0.3)', color: '#8b5cf6' }}
          >
            <FolderOpen size={11} /> Seç
          </button>
        </div>
        <p className="text-[10px] mt-1.5 break-all" style={{ color: '#475569' }}>
          Mevcut: {scanResult?.assetsRoot ?? '—'}
        </p>
      </CARD>

      {/* Scan summary */}
      <CARD>
        <SECTION>Tarama Özeti</SECTION>
        <Row label="Assets Root" value={scanResult?.assetsRoot} color="#06b6d4" />
        <Row label="Toplam PNG" value={scanResult?.totalPng} color="#10b981" />
        <Row label="Karakter Sayısı" value={scanResult?.characters.length} color="#10b981" />
        <Row label="Outfit Sayısı" value={totalOutfits} color="#10b981" />
      </CARD>

      {/* Active state */}
      <CARD>
        <SECTION>Aktif Durum</SECTION>
        <Row label="Karakter" value={activeCharacterId} color="#8b5cf6" />
        <Row label="Kıyafet ID" value={activeOutfitId} color="#8b5cf6" />
        <Row label="Kıyafet Adı" value={activeOutfit?.name} color="#a78bfa" />
        <Row label="Duygu" value={activeEmotion} color="#06b6d4" />
        <Row label="Mod" value={activeOutfit?.mode} color="#06b6d4" />
        <Row label="Sprite URL" value={currentSprite?.fileUrl} color="#10b981" />
        <Row label="Sprite Dosyası" value={currentSprite?.filename} color="#10b981" />
      </CARD>

      {/* Errors */}
      {scanResult?.errors && scanResult.errors.length > 0 && (
        <CARD>
          <SECTION>Hatalar</SECTION>
          {scanResult.errors.map((e, i) => (
            <p key={i} className="text-[10px] break-all leading-relaxed" style={{ color: '#ec4899' }}>{e}</p>
          ))}
        </CARD>
      )}

      <BTN onClick={reload} color="#06b6d4" glow>
        <RefreshCw size={12} className={scanning ? 'animate-spin' : ''} />
        {scanning ? 'Taranıyor...' : 'Yeniden Tara'}
      </BTN>
    </div>
  )
}

// ─────────────────────────────────────────────
// Main RightPanel
// ─────────────────────────────────────────────

const TITLE_MAP: Record<string, string> = {
  karakter:    'Karakter Seçimi',
  kiyafet:     'Kıyafet Seçimi',
  ses:         'Ses Ayarları',
  hafiza:      'Hafıza',
  ayarlar:     'Ayarlar',
  gelistirici: 'Geliştirici',
}

const ICON_MAP: Record<string, React.ReactNode> = {
  karakter:    <User size={13} />,
  kiyafet:     <Shirt size={13} />,
  ses:         <Volume2 size={13} />,
  hafiza:      <Brain size={13} />,
  ayarlar:     <Settings size={13} />,
  gelistirici: <Code2 size={13} />,
}

export default function RightPanel() {
  const { activeTab } = useAppStore()

  const content = (() => {
    switch (activeTab) {
      case 'karakter':    return <KarakterTab />
      case 'kiyafet':     return <KiyafetTab />
      case 'ses':         return <SesTab />
      case 'hafiza':      return <HafizaTab />
      case 'ayarlar':     return <AyarlarTab />
      case 'gelistirici': return <GelistiriciTab />
      default:            return null
    }
  })()

  const title = TITLE_MAP[activeTab] ?? ''
  const icon  = ICON_MAP[activeTab] ?? null

  if (!content) return null

  return (
    <div
      className="flex flex-col flex-shrink-0 overflow-hidden"
      style={{
        width: 300,
        background: 'rgba(10,16,38,0.85)',
        borderLeft: '1px solid rgba(139,92,246,0.14)',
        backdropFilter: 'blur(20px)',
      }}
    >
      {/* Panel header */}
      <div
        className="flex items-center gap-2 px-4 py-3 flex-shrink-0"
        style={{ borderBottom: '1px solid rgba(139,92,246,0.1)', background: 'rgba(14,22,48,0.6)' }}
      >
        <span style={{ color: '#8b5cf6' }}>{icon}</span>
        <span
          className="text-xs font-semibold uppercase tracking-widest"
          style={{ fontFamily: 'Rajdhani, sans-serif', color: '#f1f5f9', letterSpacing: '0.09em' }}
        >
          {title}
        </span>
      </div>

      {/* Scrollable content */}
      <div
        className="flex-1 overflow-y-auto p-3"
        style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(139,92,246,0.2) transparent' }}
      >
        {content}
      </div>
    </div>
  )
}
