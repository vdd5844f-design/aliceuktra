import type { VRM } from '@pixiv/three-vrm'

// ─────────────────────────────────────────────────────────────────────────────
// Viseme / expression name aliases
// VRM models use different blendshape names depending on origin.
// We try multiple aliases in priority order.
// ─────────────────────────────────────────────────────────────────────────────

const VISEME_ALIASES: Record<string, string[]> = {
  aa: ['aa', 'A', 'あ', 'mouth_a', 'mouthOpen'],
  ih: ['ih', 'I', 'い', 'mouth_i'],
  ou: ['ou', 'U', 'う', 'mouth_u'],
  ee: ['ee', 'E', 'え', 'mouth_e'],
  oh: ['oh', 'O', 'お', 'mouth_o'],
}

const EXPRESSION_ALIASES: Record<string, string[]> = {
  happy:   ['happy', 'joy', 'Fun', 'smile'],
  angry:   ['angry', 'Angry'],
  sad:     ['sad', 'Sorrow', 'sorrow'],
  neutral: ['neutral', 'Neutral'],
  relaxed: ['relaxed', 'Relaxed'],
  blink:   ['blink', 'Blink', 'blinkLeft'],
  blinkL:  ['blinkLeft', 'Blink_L', 'blink'],
  blinkR:  ['blinkRight', 'Blink_R', 'blink'],
}

function findExpression(vrm: VRM, aliases: string[]): string | null {
  const em = vrm.expressionManager
  if (!em) return null
  for (const alias of aliases) {
    try {
      // getExpressionTrackName throws if not found in some versions
      const val = em.getValue(alias)
      if (val !== undefined && val !== null) return alias
    } catch { /* try next */ }
  }
  return null
}

export function setExpression(vrm: VRM, name: string, value: number) {
  const em = vrm.expressionManager
  if (!em) return
  const aliases = EXPRESSION_ALIASES[name] ?? [name]
  const found = findExpression(vrm, aliases)
  if (found) {
    em.setValue(found, Math.max(0, Math.min(1, value)))
  }
}

export function resetAllExpressions(vrm: VRM) {
  const em = vrm.expressionManager
  if (!em) return
  const keys = Object.values(EXPRESSION_ALIASES).flat()
  for (const key of keys) {
    try { em.setValue(key, 0) } catch { /* skip */ }
  }
}

export function applyViseme(vrm: VRM, vowel: 'aa' | 'ih' | 'ou' | 'ee' | 'oh', value: number) {
  const em = vrm.expressionManager
  if (!em) return
  // Reset all visemes first
  for (const aliases of Object.values(VISEME_ALIASES)) {
    for (const alias of aliases) {
      try { em.setValue(alias, 0) } catch { /* skip */ }
    }
  }
  // Apply target viseme
  const aliases = VISEME_ALIASES[vowel] ?? []
  for (const alias of aliases) {
    try {
      const cur = em.getValue(alias)
      if (cur !== undefined && cur !== null) {
        em.setValue(alias, Math.max(0, Math.min(1, value)))
        break
      }
    } catch { /* skip */ }
  }
}

export function setMouthOpen(vrm: VRM, value: number) {
  // Try generic mouth open approaches
  applyViseme(vrm, 'aa', value)
}

export function triggerBlink(vrm: VRM) {
  const em = vrm.expressionManager
  if (!em) return
  const blinkL = findExpression(vrm, EXPRESSION_ALIASES['blinkL'])
  const blinkR = findExpression(vrm, EXPRESSION_ALIASES['blinkR'])
  const blink  = findExpression(vrm, EXPRESSION_ALIASES['blink'])
  const close  = () => {
    if (blink)  em.setValue(blink, 1)
    if (blinkL) em.setValue(blinkL, 1)
    if (blinkR) em.setValue(blinkR, 1)
  }
  const open = () => {
    if (blink)  em.setValue(blink, 0)
    if (blinkL) em.setValue(blinkL, 0)
    if (blinkR) em.setValue(blinkR, 0)
  }
  close()
  setTimeout(open, 120)
}
