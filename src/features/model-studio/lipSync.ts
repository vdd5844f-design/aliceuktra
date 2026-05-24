import type { VRM } from '@pixiv/three-vrm'
import { applyViseme, setMouthOpen } from './vrmExpressions'

// ─────────────────────────────────────────────────────────────────────────────
// LipSync — drives mouth expressions from audio amplitude or test sine wave
// ─────────────────────────────────────────────────────────────────────────────

type Vowel = 'aa' | 'ih' | 'ou' | 'ee' | 'oh'
const VOWELS: Vowel[] = ['aa', 'ih', 'ou', 'ee', 'oh']

export class LipSync {
  private vrm: VRM
  private audioCtx: AudioContext | null = null
  private analyser: AnalyserNode | null = null
  private source: MediaElementAudioSourceNode | null = null
  private dataArray: Float32Array | null = null
  private active = false
  private testMode = false
  private testClock = 0
  private vowelIndex = 0
  private vowelClock = 0
  private mouthOpenScale: number

  constructor(vrm: VRM, mouthOpenScale = 0.8) {
    this.vrm = vrm
    this.mouthOpenScale = mouthOpenScale
  }

  setMouthOpenScale(v: number) { this.mouthOpenScale = v }

  bindAudioAnalyser(audioElement: HTMLAudioElement) {
    try {
      if (!this.audioCtx) {
        this.audioCtx = new AudioContext()
      }
      if (this.source) {
        this.source.disconnect()
        this.source = null
      }
      this.analyser = this.audioCtx.createAnalyser()
      this.analyser.fftSize = 256
      this.analyser.smoothingTimeConstant = 0.6
      this.source = this.audioCtx.createMediaElementSource(audioElement)
      this.source.connect(this.analyser)
      this.analyser.connect(this.audioCtx.destination)
      this.dataArray = new Float32Array(this.analyser.frequencyBinCount)
      this.testMode = false
    } catch (e) {
      console.warn('[LipSync] AudioContext setup failed, using test mode:', e)
      this.testMode = true
    }
  }

  startLipSync(audioElement?: HTMLAudioElement) {
    if (audioElement) {
      this.bindAudioAnalyser(audioElement)
    } else {
      this.testMode = true
    }
    this.active = true
    this.testClock = 0
    this.vowelIndex = 0
    this.vowelClock = 0
  }

  stopLipSync() {
    this.active = false
    setMouthOpen(this.vrm, 0)
  }

  isActive() { return this.active }

  /** Call every animation frame with delta seconds */
  update(delta: number) {
    if (!this.active) return

    let amplitude = 0

    if (!this.testMode && this.analyser && this.dataArray) {
      // Real audio RMS
      this.analyser.getFloatTimeDomainData(this.dataArray)
      let sumSq = 0
      for (let i = 0; i < this.dataArray.length; i++) {
        sumSq += this.dataArray[i] * this.dataArray[i]
      }
      amplitude = Math.sqrt(sumSq / this.dataArray.length)
      amplitude = Math.min(1, amplitude * 4) // scale up
    } else {
      // Test mode: sine + random variation
      this.testClock += delta
      const base = (Math.sin(this.testClock * 6) + 1) / 2
      const jitter = Math.random() * 0.15
      amplitude = Math.max(0, base * 0.85 + jitter)
    }

    const scaledAmplitude = amplitude * this.mouthOpenScale

    // Cycle through vowels for test mode visemes
    this.vowelClock += delta
    if (this.vowelClock > 0.12) {
      this.vowelClock = 0
      this.vowelIndex = (this.vowelIndex + 1) % VOWELS.length
    }

    if (scaledAmplitude > 0.05) {
      applyViseme(this.vrm, VOWELS[this.vowelIndex], scaledAmplitude)
    } else {
      setMouthOpen(this.vrm, 0)
    }
  }

  destroy() {
    this.stopLipSync()
    if (this.source) { this.source.disconnect(); this.source = null }
    if (this.audioCtx) { this.audioCtx.close(); this.audioCtx = null }
  }
}
