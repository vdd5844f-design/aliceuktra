import React from 'react'
import { ExternalLink, AlertCircle } from 'lucide-react'

interface SourceEntry {
  label: string
  url: string
  badge: string
  badgeColor: string
}

const SOURCES: SourceEntry[] = [
  {
    label: 'VRoid Hub — Ticari İzinli',
    url: 'https://hub.vroid.com/en/characters?name=&is_public=true&order=recent',
    badge: 'VRoid Hub',
    badgeColor: '#8b5cf6',
  },
  {
    label: 'Sketchfab — Anime CC0 VRM',
    url: 'https://sketchfab.com/search?q=anime+girl+vrm&type=models&license=cc0',
    badge: 'Sketchfab',
    badgeColor: '#06b6d4',
  },
  {
    label: 'Sketchfab — Stylized Female CC0',
    url: 'https://sketchfab.com/search?q=stylized+female+character&type=models&license=cc0',
    badge: 'Sketchfab',
    badgeColor: '#06b6d4',
  },
  {
    label: 'Mixamo — Female Character',
    url: 'https://www.mixamo.com/#/?page=1&query=female&type=Character',
    badge: 'Mixamo',
    badgeColor: '#f59e0b',
  },
  {
    label: 'BOOTH — Ücretsiz VRM Ticari',
    url: 'https://booth.pm/en/browse/3D%20model?tags%5B%5D=VRM&tags%5B%5D=%E7%84%A1%E6%96%99&sort=new',
    badge: 'BOOTH',
    badgeColor: '#ec4899',
  },
]

export default function ModelSourceCards() {
  const open = (url: string) => {
    // Electron: shell.openExternal, Browser: window.open
    try {
      const shell = (window as unknown as Record<string, Record<string, (...a: unknown[]) => unknown>>)['shell']
      if (shell?.openExternal) { shell.openExternal(url); return }
    } catch { /* fallback */ }
    window.open(url, '_blank', 'noopener,noreferrer')
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-2">
        {SOURCES.map((src) => (
          <button
            key={src.url}
            onClick={() => open(src.url)}
            className="flex items-center justify-between gap-2 rounded-lg px-3 py-2.5 text-left transition-all group"
            style={{
              background: 'rgba(15,20,40,0.5)',
              border: '1px solid rgba(139,92,246,0.12)',
            }}
          >
            <div className="flex items-center gap-2 min-w-0">
              <span
                className="flex-shrink-0 text-[10px] font-bold px-1.5 py-0.5 rounded"
                style={{ background: `${src.badgeColor}22`, color: src.badgeColor, border: `1px solid ${src.badgeColor}44` }}
              >
                {src.badge}
              </span>
              <span className="text-xs truncate" style={{ color: '#cbd5e1' }}>{src.label}</span>
            </div>
            <ExternalLink size={12} style={{ color: '#475569', flexShrink: 0 }} />
          </button>
        ))}
      </div>

      {/* License disclaimer */}
      <div
        className="flex items-start gap-2 rounded-lg p-3 text-[11px] leading-relaxed"
        style={{
          background: 'rgba(234,179,8,0.06)',
          border: '1px solid rgba(234,179,8,0.2)',
          color: '#fbbf24',
        }}
      >
        <AlertCircle size={12} className="flex-shrink-0 mt-0.5" />
        <span>
          Lisansi indirmeden once mutlaka kontrol edin.
          Ticari kullanim izni olmayan modelleri projeye dahil etmeyin.
        </span>
      </div>
    </div>
  )
}
