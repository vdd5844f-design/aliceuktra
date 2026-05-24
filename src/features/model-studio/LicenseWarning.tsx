import React from 'react'
import { AlertTriangle } from 'lucide-react'
import type { LicenseType } from './types'

interface Props {
  licenseType: LicenseType
}

export default function LicenseWarning({ licenseType }: Props) {
  if (licenseType !== 'unknown') return null

  return (
    <div
      className="flex items-start gap-2 rounded-lg p-3 text-xs leading-relaxed"
      style={{
        background: 'rgba(239,68,68,0.08)',
        border: '1px solid rgba(239,68,68,0.35)',
        color: '#f87171',
      }}
    >
      <AlertTriangle size={14} className="flex-shrink-0 mt-0.5" />
      <span>
        Lisans tipi <strong>&quot;Bilinmiyor&quot;</strong> seçildi.
        Bu modeli ticari veya halka acik bir projede kullanmadan once lisans kosullarini
        mutlaka kontrol edin. Izinsiz kullanim telif hakki ihlali olusturabilir.
      </span>
    </div>
  )
}
