import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { Cat, Check, Volume2, Brain, Settings, Code2, Trash2, RefreshCw, User, Shirt } from 'lucide-react'
import { useAppStore } from '../../stores/appStore'
import { PROVIDERS, EMOTION_LABELS, type Emotion } from '../../types'

const alice = () => (window as unknown as Record<string, unknown>)['alice'] as Record<string, Record<string, (...args: unknown[]) => unknown>>

const CARD = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
  <div className={`rounded-xl p-3 ${className}`}
    style={{ background: 'rgba(20,32,70,0.4)', border: '1px solid rgba(139,92,246,0.12)' }}>
    {children}
  </div>
)

const LABEL = ({ children }: { children: React.ReactNode }) => (
  <p className="text-[10px] font-semibold uppercase tracking-widest mb-2"
    style={{ color: '#475569', fontFamily: 'Rajdhani, sans-serif', letterSpacing: '0.08em' }}>
    {children}
  </p>
)

const INPUT = ({ label, value, onChange, type = 'text', placeholder = '' }:
  { label: string; value: string; onChange: (v: string) => void; type?: string; placeholder?: string }) => (
  <div className="mb-2">
    <p className="text-[10px] mb-1" style={{ color: '#64748b' }}>{label}</p>
    <input
      type={type}
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full text-xs px-3 py-2 rounded-lg outline-none"
      style={{ background: 'rgba(8,12,32,0.6)', color: '#f1f5f9', border: '1px solid rgba(139,92,246,0.15)' }}
    />
  </div>
)

const BTN = ({ onClick, children, color = '#8b5cf6', glow = false, disabled = false }:
  { onClick: () => void; children: React.ReactNode; color?: string; glow?: boolean; disabled?: boolean }) => (
  <motion.button whileHover={{ scale: disabled ? 1 : 1.02 }} whileTap={{ scale: disabled ? 1 : 0.97 }}
    onClick={onClick} disabled={disabled}
    className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-medium cursor-pointer w-full"
    style={{
      background: `${color}15`,
      border: `1px solid ${color}30`,
      color,
      boxShadow: glow ? `0 0 12px ${color}25` : 'none',
      opacity: disabled ? 0.5 : 1,
    }}>
    {children}
  </motion.button>
)

// ── Karakter sekmesi
function KarakterTab() {
  const { characters, activeCharacterId, setActiveCharacterId } = useAppStore()
  if (characters.length === 0) return (
    <div className="text-center py-8" style={{ color: '#475569' }}>
      <p className="text-sm mb-1">Karakter bulunamadı</p>
      <p className="text-xs">assets/ klasörünü kontrol edin</p>
    </div>
  )
  return (
    <div className="flex flex-col gap-2">
      {characters.map(char => {
        const active = activeCharacterId === char.id
        return (
          <motion.div key={char.id} whileHover={{ x: 2 }}
            onClick={() => setActiveCharacterId(char.id)}
            className="flex items-center gap-3 p-2.5 rounded-xl cursor-pointer"
            style={{
              background: active ? 'rgba(139,92,246,0.15)' : 'rgba(139,92,246,0.04)',
              border: `1px solid ${active ? 'rgba(139,92,246,0.35)' : 'rgba(139,92,246,0.08)'}`,
            }}>
            {/* Preview */}
            <div className="w-12 h-14 rounded-lg overflow-hidden flex-shrink-0"
              style={{ background: 'rgba(8,12,32,0.6)', border: '1px solid rgba(139,92,246,0.15)' }}>
              {char.previewUrl ? (
                <img src={char.previewUrl} alt={char.name} className="w-full h-full object-cover" style={{ imageRendering: 'pixelated' }} />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <User size={16} style={{ color: '#475569' }} />
                </div>
              )}
            </div>
            {/* Info */}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold truncate" style={{ color: active ? '#8b5cf6' : '#f1f5f9', fontFamily: 'Rajdhani, sans-serif' }}>
                {char.name}
              </p>
              <p className="text-[10px]" style={{ color: '#64748b' }}>{char.outfits.length} kıyafet · {char.totalPng} PNG</p>
            </div>
            {active && <Check size={14} style={{ color: '#8b5cf6', flexShrink: 0 }} />}
          </motion.div>
        )
      })}
    </div>
  )
}

// ── Kıyafet sekmesi
function KiyafetTab() {
  const { characters, activeCharacterId, activeOutfitId, setActiveOutfitId } = useAppStore()
  const char = characters.find(c => c.id === activeCharacterId)
  if (!char) return <p className="text-xs text-center py-8" style={{ color: '#475569' }}>Önce bir karakter seçin</p>
  if (char.outfits.length === 0) return <p className="text-xs text-center py-8" style={{ color: '#475569' }}>Bu karakter için kıyafet bulunamadı</p>
  return (
    <div className="flex flex-col gap-2">
      {char.outfits.map(outfit => {
        const active = activeOutfitId === outfit.id
        const emotionIcons: Emotion[] = ['idle', 'happy', 'talk', 'angry', 'sleep']
        return (
          <motion.div key={outfit.id} whileHover={{ x: 2 }}
            onClick={() => setActiveOutfitId(outfit.id)}
            className="flex gap-3 p-2.5 rounded-xl cursor-pointer"
            style={{
              background: active ? 'rgba(139,92,246,0.12)' : 'rgba(139,92,246,0.03)',
              border: `1px solid ${active ? 'rgba(139,92,246,0.3)' : 'rgba(139,92,246,0.07)'}`,
            }}>
            {/* Thumbnail */}
            <div className="w-14 h-16 rounded-lg overflow-hidden flex-shrink-0"
              style={{ background: 'rgba(8,12,32,0.6)', border: '1px solid rgba(139,92,246,0.12)' }}>
              {outfit.previewUrl ? (
                <img src={outfit.previewUrl} alt={outfit.name} className="w-full h-full object-cover" style={{ imageRendering: 'pixelated' }} />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Shirt size={14} style={{ color: '#475569' }} />
                </div>
              )}
            </div>
            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap mb-1">
                <p className="text-xs font-semibold truncate" style={{ color: active ? '#8b5cf6' : '#f1f5f9', fontFamily: 'Rajdhani, sans-serif' }}>
                  {outfit.name}
                </p>
                {outfit.isCat && (
                  <span className="flex items-center gap-0.5 text-[9px] px-1.5 py-0.5 rounded-full"
                    style={{ background: 'rgba(236,72,153,0.1)', border: '1px solid rgba(236,72,153,0.2)', color: '#ec4899' }}>
                    <Cat size={9} /> Neko
                  </span>
                )}
                <span className="text-[9px] px-1.5 py-0.5 rounded-full"
                  style={{ background: outfit.mode === 'frames' ? 'rgba(16,185,129,0.1)' : 'rgba(6,182,212,0.1)', border: `1px solid ${outfit.mode === 'frames' ? 'rgba(16,185,129,0.2)' : 'rgba(6,182,212,0.2)'}`, color: outfit.mode === 'frames' ? '#10b981' : '#06b6d4' }}>
                  {outfit.mode === 'frames' ? 'Animasyon' : 'Statik'}
                </span>
              </div>
              {/* Emotion coverage badges */}
              <div className="flex gap-1 flex-wrap">
                {emotionIcons.map(e => {
                  const has = outfit.emotions.includes(e)
                  return (
                    <span key={e} className="text-[9px] px-1.5 py-0.5 rounded-full"
                      style={{
                        background: has ? 'rgba(139,92,246,0.12)' : 'rgba(55,65,81,0.3)',
                        border: `1px solid ${has ? 'rgba(139,92,246,0.25)' : 'rgba(55,65,81,0.5)'}`,
                        color: has ? '#8b5cf6' : '#374151',
                      }}>
                      {EMOTION_LABELS[e]}
                    </span>
                  )
                })}
              </div>
              <p className="text-[10px] mt-1" style={{ color: '#475569' }}>{outfit.totalPng} PNG</p>
            </div>
            {active && <Check size={13} style={{ color: '#8b5cf6', flexShrink: 0 }} />}
          </motion.div>
        )
      })}
    </div>
  )
}

// ── Ses sekmesi
function SesTab() {
  const { settings, setSettings, isTalking } = useAppStore()
  return (
    <div className="flex flex-col gap-3">
      <CARD>
        <LABEL>Ses Motoru</LABEL>
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs" style={{ color: '#94a3b8' }}>Ses Aktif</span>
          <button onClick={() => setSettings({ voiceEnabled: !settings.voiceEnabled })}
            className="w-9 h-5 rounded-full relative cursor-pointer transition-all"
            style={{ background: settings.voiceEnabled ? 'rgba(139,92,246,0.5)' : 'rgba(55,65,81,0.5)', border: `1px solid ${settings.voiceEnabled ? 'rgba(139,92,246,0.7)' : 'rgba(55,65,81,0.8)'}` }}>
            <div className="absolute top-0.5 w-4 h-4 rounded-full transition-all"
              style={{ background: '#fff', left: settings.voiceEnabled ? '18px' : '2px' }} />
          </button>
        </div>
        <INPUT label="Ses" value={settings.voice} onChange={v => setSettings({ voice: v })} placeholder="tr-TR-EmelNeural" />
      </CARD>
      <div className="flex gap-2">
        <BTN onClick={() => alice().voice.speak('Merhaba! Ben Alice.', settings.voice)} color="#06b6d4">
          <Volume2 size={12} /> Test Sesi
        </BTN>
        <BTN onClick={() => alice().voice.stop()} color="#ec4899">
          Durdur
        </BTN>
      </div>
      <div className="flex items-center gap-2 px-3 py-2 rounded-xl"
        style={{ background: isTalking ? 'rgba(16,185,129,0.08)' : 'rgba(55,65,81,0.1)', border: `1px solid ${isTalking ? 'rgba(16,185,129,0.2)' : 'rgba(55,65,81,0.2)'}` }}>
        <motion.div className="w-2 h-2 rounded-full"
          style={{ background: isTalking ? '#10b981' : '#374151' }}
          animate={{ opacity: isTalking ? [1, 0.3, 1] : 1 }} transition={{ duration: 0.6, repeat: isTalking ? Infinity : 0 }} />
        <span className="text-xs" style={{ color: isTalking ? '#10b981' : '#475569' }}>
          {isTalking ? 'Konusuyor...' : 'Bekliyor'}
        </span>
      </div>
    </div>
  )
}

// ── Hafıza sekmesi
function HafizaTab() {
  const { messages, clearMessages } = useAppStore()
  return (
    <div className="flex flex-col gap-3">
      <CARD>
        <LABEL>Sohbet Hafızası</LABEL>
        <div className="flex justify-between mb-2">
          <span className="text-xs" style={{ color: '#94a3b8' }}>Mesaj sayısı</span>
          <span className="text-xs" style={{ color: '#8b5cf6' }}>{messages.length}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-xs" style={{ color: '#94a3b8' }}>Kullanıcı</span>
          <span className="text-xs" style={{ color: '#06b6d4' }}>{messages.filter(m => m.role === 'user').length}</span>
        </div>
        <div className="flex justify-between mt-1">
          <span className="text-xs" style={{ color: '#94a3b8' }}>Asistan</span>
          <span className="text-xs" style={{ color: '#8b5cf6' }}>{messages.filter(m => m.role === 'assistant').length}</span>
        </div>
      </CARD>
      <BTN onClick={clearMessages} color="#ec4899">
        <Trash2 size={12} /> Hafızayı Temizle
      </BTN>
    </div>
  )
}

// ── Ayarlar sekmesi
function AyarlarTab() {
  const { settings, setSettings } = useAppStore()
  return (
    <div className="flex flex-col gap-3">
      <CARD>
        <LABEL>Yapay Zeka</LABEL>
        <div className="mb-2">
          <p className="text-[10px] mb-1" style={{ color: '#64748b' }}>Sağlayıcı</p>
          <select value={settings.provider} onChange={e => setSettings({ provider: e.target.value as typeof settings.provider })}
            className="w-full text-xs px-3 py-2 rounded-lg outline-none"
            style={{ background: 'rgba(8,12,32,0.6)', color: '#f1f5f9', border: '1px solid rgba(139,92,246,0.15)', cursor: 'pointer' }}>
            {PROVIDERS.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
          </select>
        </div>
        <INPUT label="Sunucu URL" value={settings.baseUrl} onChange={v => setSettings({ baseUrl: v })} />
        <INPUT label="API Anahtarı" value={settings.apiKey} onChange={v => setSettings({ apiKey: v })} type="password" />
        <INPUT label="Model" value={settings.model} onChange={v => setSettings({ model: v })} placeholder="örn. gemma3:4b" />
      </CARD>
      <CARD>
        <LABEL>Sistem Mesajı</LABEL>
        <textarea value={settings.systemPrompt} onChange={e => setSettings({ systemPrompt: e.target.value })}
          rows={3} className="w-full text-xs px-3 py-2 rounded-lg outline-none resize-none"
          style={{ background: 'rgba(8,12,32,0.6)', color: '#f1f5f9', border: '1px solid rgba(139,92,246,0.15)' }} />
      </CARD>
      <CARD>
        <LABEL>Pencere</LABEL>
        <div className="flex items-center justify-between">
          <span className="text-xs" style={{ color: '#94a3b8' }}>Her Zaman Üstte</span>
          <button onClick={() => { setSettings({ alwaysOnTop: !settings.alwaysOnTop }); alice().window.setAlwaysOnTop(!settings.alwaysOnTop) }}
            className="w-9 h-5 rounded-full relative cursor-pointer"
            style={{ background: settings.alwaysOnTop ? 'rgba(139,92,246,0.5)' : 'rgba(55,65,81,0.5)', border: `1px solid ${settings.alwaysOnTop ? 'rgba(139,92,246,0.7)' : 'rgba(55,65,81,0.8)'}` }}>
            <div className="absolute top-0.5 w-4 h-4 rounded-full transition-all"
              style={{ background: '#fff', left: settings.alwaysOnTop ? '18px' : '2px' }} />
          </button>
        </div>
      </CARD>
      <BTN onClick={() => alice().window.close()} color="#ec4899">Çıkış</BTN>
    </div>
  )
}

// ── Geliştirici sekmesi
function GelistiriciTab() {
  const { scanResult, activeCharacterId, activeOutfitId, activeEmotion, currentSprite, settings } = useAppStore()
  const [customRoot, setCustomRoot] = useState('')
  const [scanning, setScanning] = useState(false)
  const { setScanResult } = useAppStore()

  const setRoot = async () => {
    if (!customRoot) return
    setScanning(true)
    try {
      const result = await alice().assets.setAssetsRoot(customRoot) as Parameters<typeof setScanResult>[0]
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

  const row = (label: string, value: string | number | null | undefined, color = '#94a3b8') => (
    <div className="flex justify-between items-start gap-2 py-0.5">
      <span style={{ color: '#475569', flexShrink: 0 }}>{label}</span>
      <span className="text-right break-all" style={{ color, fontSize: 10, maxWidth: '60%' }}>{value ?? '—'}</span>
    </div>
  )

  return (
    <div className="flex flex-col gap-3">
      <CARD>
        <LABEL>Assets Kök Klasörü</LABEL>
        <div className="flex gap-2">
          <input value={customRoot} onChange={e => setCustomRoot(e.target.value)}
            placeholder="C:/ALICE-AI/assets"
            className="flex-1 text-xs px-2 py-1.5 rounded-lg outline-none"
            style={{ background: 'rgba(8,12,32,0.6)', color: '#f1f5f9', border: '1px solid rgba(139,92,246,0.15)' }} />
          <button onClick={setRoot}
            className="px-3 py-1.5 rounded-lg text-xs cursor-pointer"
            style={{ background: 'rgba(139,92,246,0.15)', border: '1px solid rgba(139,92,246,0.3)', color: '#8b5cf6' }}>
            Seç
          </button>
        </div>
        <p className="text-[10px] mt-1" style={{ color: '#475569' }}>Mevcut: {scanResult?.assetsRoot ?? '—'}</p>
      </CARD>
      <CARD>
        <LABEL>Tarama Bilgisi</LABEL>
        <div className="text-[10px] flex flex-col gap-0.5">
          {row('Assets Root', scanResult?.assetsRoot)}
          {row('Toplam PNG', scanResult?.totalPng)}
          {row('Karakter Sayısı', scanResult?.characters.length)}
          {row('Outfit Sayısı', scanResult?.characters.reduce((s, c) => s + c.outfits.length, 0))}
          {row('Aktif Karakter', activeCharacterId, '#8b5cf6')}
          {row('Aktif Kıyafet', activeOutfitId, '#8b5cf6')}
          {row('Aktif Duygu', activeEmotion, '#06b6d4')}
          {row('Sprite URL', currentSprite?.fileUrl, '#10b981')}
          {scanResult?.errors && scanResult.errors.length > 0 && row('Hatalar', scanResult.errors.join(', '), '#ec4899')}
        </div>
      </CARD>
      <BTN onClick={reload} color="#06b6d4" glow>
        <RefreshCw size={12} className={scanning ? 'animate-spin' : ''} /> Yeniden Tara
      </BTN>
    </div>
  )
}

// ── Main RightPanel
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

  if (!content) return null

  const titleMap: Record<string, string> = {
    karakter: 'Karakter Seçimi', kiyafet: 'Kıyafet Seçimi', ses: 'Ses Ayarları',
    hafiza: 'Hafıza', ayarlar: 'Ayarlar', gelistirici: 'Geliştirici',
  }

  return (
    <div className="flex flex-col flex-shrink-0 overflow-hidden"
      style={{ width: 280, background: 'rgba(8,12,32,0.7)', borderLeft: '1px solid rgba(139,92,246,0.12)' }}>
      <div className="flex items-center px-4 py-3 flex-shrink-0"
        style={{ borderBottom: '1px solid rgba(139,92,246,0.1)' }}>
        <span className="text-xs font-semibold uppercase tracking-widest"
          style={{ fontFamily: 'Rajdhani, sans-serif', color: '#f1f5f9', letterSpacing: '0.08em' }}>
          {titleMap[activeTab] ?? ''}
        </span>
      </div>
      <div className="flex-1 overflow-y-auto px-3 py-3"
        style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(139,92,246,0.15) transparent' }}>
        {content}
      </div>
    </div>
  )
}
