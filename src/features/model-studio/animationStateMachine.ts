import type { VRM } from '@pixiv/three-vrm'
import type { AnimationState } from './types'
import { setExpression, resetAllExpressions, triggerBlink } from './vrmExpressions'

// ─────────────────────────────────────────────────────────────────────────────
// Per-state behaviour config
// ─────────────────────────────────────────────────────────────────────────────

interface StateBehavior {
  expression: string | null
  expressionValue: number
  blinkIntervalBase: number  // seconds
  blinkIntervalJitter: number
  headSwayAmplitude: number   // radians
  headSwayFreq: number        // Hz
  bodySwayAmplitude: number
  bodySwayFreq: number
  breathAmplitude: number
  breathFreq: number
}

const STATE_BEHAVIORS: Record<AnimationState, StateBehavior> = {
  idle: {
    expression: null, expressionValue: 0,
    blinkIntervalBase: 4, blinkIntervalJitter: 2,
    headSwayAmplitude: 0.008, headSwayFreq: 0.18,
    bodySwayAmplitude: 0.003, bodySwayFreq: 0.12,
    breathAmplitude: 0.004, breathFreq: 0.22,
  },
  listening: {
    expression: null, expressionValue: 0,
    blinkIntervalBase: 3, blinkIntervalJitter: 1,
    headSwayAmplitude: 0.015, headSwayFreq: 0.1,
    bodySwayAmplitude: 0.002, bodySwayFreq: 0.08,
    breathAmplitude: 0.005, breathFreq: 0.25,
  },
  thinking: {
    expression: null, expressionValue: 0,
    blinkIntervalBase: 6, blinkIntervalJitter: 2,
    headSwayAmplitude: 0.012, headSwayFreq: 0.22,
    bodySwayAmplitude: 0.004, bodySwayFreq: 0.14,
    breathAmplitude: 0.003, breathFreq: 0.2,
  },
  talking: {
    expression: null, expressionValue: 0,
    blinkIntervalBase: 3.5, blinkIntervalJitter: 1.5,
    headSwayAmplitude: 0.02, headSwayFreq: 0.3,
    bodySwayAmplitude: 0.008, bodySwayFreq: 0.2,
    breathAmplitude: 0.006, breathFreq: 0.3,
  },
  happy: {
    expression: 'happy', expressionValue: 0.9,
    blinkIntervalBase: 2.5, blinkIntervalJitter: 1,
    headSwayAmplitude: 0.025, headSwayFreq: 0.4,
    bodySwayAmplitude: 0.01, bodySwayFreq: 0.28,
    breathAmplitude: 0.007, breathFreq: 0.35,
  },
  angry: {
    expression: 'angry', expressionValue: 0.85,
    blinkIntervalBase: 2, blinkIntervalJitter: 0.5,
    headSwayAmplitude: 0.005, headSwayFreq: 0.15,
    bodySwayAmplitude: 0.002, bodySwayFreq: 0.1,
    breathAmplitude: 0.008, breathFreq: 0.38,
  },
  sad: {
    expression: 'sad', expressionValue: 0.8,
    blinkIntervalBase: 6, blinkIntervalJitter: 3,
    headSwayAmplitude: 0.006, headSwayFreq: 0.1,
    bodySwayAmplitude: 0.002, bodySwayFreq: 0.07,
    breathAmplitude: 0.002, breathFreq: 0.15,
  },
  sleeping: {
    expression: 'relaxed', expressionValue: 1,
    blinkIntervalBase: 0, blinkIntervalJitter: 0,  // no blink while sleeping
    headSwayAmplitude: 0.003, headSwayFreq: 0.05,
    bodySwayAmplitude: 0.002, bodySwayFreq: 0.04,
    breathAmplitude: 0.012, breathFreq: 0.14,
  },
  moving: {
    expression: null, expressionValue: 0,
    blinkIntervalBase: 3, blinkIntervalJitter: 1,
    headSwayAmplitude: 0.03, headSwayFreq: 0.35,
    bodySwayAmplitude: 0.012, bodySwayFreq: 0.25,
    breathAmplitude: 0.009, breathFreq: 0.4,
  },
}

// ─────────────────────────────────────────────────────────────────────────────
// AnimationStateMachine — drives VRM procedural motion every RAF tick
// ─────────────────────────────────────────────────────────────────────────────

export class AnimationStateMachine {
  private vrm: VRM
  private state: AnimationState = 'idle'
  private clock = 0 // seconds elapsed
  private blinkTimer = 0
  private nextBlinkAt = 4

  constructor(vrm: VRM) {
    this.vrm = vrm
    this.scheduleNextBlink()
  }

  setState(state: AnimationState) {
    if (this.state === state) return
    this.state = state
    // Apply expression immediately
    resetAllExpressions(this.vrm)
    const behavior = STATE_BEHAVIORS[state]
    if (behavior.expression) {
      setExpression(this.vrm, behavior.expression, behavior.expressionValue)
    }
    // Sleeping: close eyes
    if (state === 'sleeping') {
      setExpression(this.vrm, 'blink', 1)
    }
    this.scheduleNextBlink()
  }

  getState() { return this.state }

  /** Call every animation frame with delta time in seconds */
  update(delta: number) {
    this.clock += delta
    const behavior = STATE_BEHAVIORS[this.state]

    this.applyBreath(behavior)
    this.applyHeadSway(behavior)
    this.applyBodySway(behavior)
    this.handleBlink(delta, behavior)
  }

  private applyBreath(b: StateBehavior) {
    const vrm = this.vrm
    const spine = vrm.humanoid?.getNormalizedBoneNode('spine')
    if (!spine || b.breathAmplitude === 0) return
    const breathVal = Math.sin(this.clock * Math.PI * 2 * b.breathFreq) * b.breathAmplitude
    spine.rotation.x = breathVal
  }

  private applyHeadSway(b: StateBehavior) {
    const head = this.vrm.humanoid?.getNormalizedBoneNode('head')
    if (!head) return
    head.rotation.z = Math.sin(this.clock * Math.PI * 2 * b.headSwayFreq) * b.headSwayAmplitude
    head.rotation.y = Math.sin(this.clock * Math.PI * 2 * b.headSwayFreq * 0.7) * b.headSwayAmplitude * 0.6
    // Listening: tilt head forward slightly
    if (this.state === 'listening') {
      head.rotation.x = -0.06 + Math.sin(this.clock * 0.4) * 0.01
    } else if (this.state === 'thinking') {
      head.rotation.x = -0.03
      head.rotation.z += Math.sin(this.clock * 0.9) * 0.015
    }
  }

  private applyBodySway(b: StateBehavior) {
    const chest = this.vrm.humanoid?.getNormalizedBoneNode('chest')
    if (!chest || b.bodySwayAmplitude === 0) return
    chest.rotation.z = Math.sin(this.clock * Math.PI * 2 * b.bodySwayFreq) * b.bodySwayAmplitude
  }

  private handleBlink(delta: number, b: StateBehavior) {
    if (this.state === 'sleeping' || b.blinkIntervalBase === 0) return
    this.blinkTimer += delta
    if (this.blinkTimer >= this.nextBlinkAt) {
      triggerBlink(this.vrm)
      this.blinkTimer = 0
      this.scheduleNextBlink()
    }
  }

  private scheduleNextBlink() {
    const b = STATE_BEHAVIORS[this.state]
    if (b.blinkIntervalBase === 0) return
    this.nextBlinkAt = b.blinkIntervalBase + (Math.random() - 0.5) * 2 * b.blinkIntervalJitter
    this.blinkTimer = 0
  }
}
