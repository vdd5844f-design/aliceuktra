import React, { useRef, useEffect, useCallback, forwardRef, useImperativeHandle } from 'react'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { GridHelper } from 'three'
import type { VRM } from '@pixiv/three-vrm'
import { loadVrmFromArrayBuffer, loadVrmFromFileUrl } from './vrmLoader'
import { applyRenderQuality, createLighting, fitCameraToModel } from './viewerQuality'
import { AnimationStateMachine } from './animationStateMachine'
import { LipSync } from './lipSync'
import { useModelStore } from './modelStore'
import type { RenderQuality, PixelRatioMode, AnimationState } from './types'

// ─────────────────────────────────────────────────────────────────────────────
// Public handle exposed via ref
// ─────────────────────────────────────────────────────────────────────────────

export interface VrmViewerHandle {
  loadFromBuffer:  (buf: ArrayBuffer, onProgress?: (p: number) => void) => Promise<void>
  loadFromFileUrl: (url: string, onProgress?: (p: number) => void) => Promise<void>
  capturePreview:  () => string | null  // returns base64 PNG
  startLipSync:    (audio?: HTMLAudioElement) => void
  stopLipSync:     () => void
  setAnimState:    (s: AnimationState) => void
}

interface Props {
  quality?: RenderQuality
  pixelRatioMode?: PixelRatioMode
  autoRotate?: boolean
  showGrid?: boolean
  transparentBg?: boolean
  onLoaded?: (vrm: VRM) => void
  onError?: (msg: string) => void
  onLoadProgress?: (pct: number) => void
}

// ─────────────────────────────────────────────────────────────────────────────
// VrmViewer
// ─────────────────────────────────────────────────────────────────────────────

const VrmViewer = forwardRef<VrmViewerHandle, Props>(function VrmViewer(
  {
    quality = 'high',
    pixelRatioMode = 'device',
    autoRotate = false,
    showGrid = true,
    transparentBg = true,
    onLoaded,
    onError,
    onLoadProgress,
  },
  ref,
) {
  const canvasRef   = useRef<HTMLCanvasElement>(null)
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null)
  const cameraRef   = useRef<THREE.PerspectiveCamera | null>(null)
  const sceneRef    = useRef<THREE.Scene | null>(null)
  const controlsRef = useRef<OrbitControls | null>(null)
  const gridRef     = useRef<GridHelper | null>(null)
  const rafRef      = useRef<number | null>(null)
  const clockRef    = useRef(new THREE.Clock())
  const vrmRef      = useRef<VRM | null>(null)
  const asmRef      = useRef<AnimationStateMachine | null>(null)
  const lipRef      = useRef<LipSync | null>(null)
  const roRef       = useRef<ResizeObserver | null>(null)

  const { setIsLoading, setLoadError, addLog } = useModelStore()

  // ── Init Three.js scene once
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    // Renderer
    const renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: true,
      preserveDrawingBuffer: true, // needed for capturePreview
    })
    renderer.setClearColor(0x000000, transparentBg ? 0 : 1)
    applyRenderQuality(renderer, quality, pixelRatioMode)
    rendererRef.current = renderer

    // Scene
    const scene = new THREE.Scene()
    sceneRef.current = scene
    createLighting(scene, quality)

    // Grid
    const grid = new GridHelper(10, 20, 0x8b5cf6, 0x1e1e3a)
    grid.visible = showGrid
    scene.add(grid)
    gridRef.current = grid

    // Camera
    const camera = new THREE.PerspectiveCamera(30, canvas.clientWidth / canvas.clientHeight, 0.01, 200)
    camera.position.set(0, 1.4, 4)
    cameraRef.current = camera

    // OrbitControls
    const controls = new OrbitControls(camera, renderer.domElement)
    controls.target.set(0, 1, 0)
    controls.enableDamping = true
    controls.dampingFactor = 0.08
    controls.minDistance = 0.5
    controls.maxDistance = 20
    controls.autoRotate = autoRotate
    controls.autoRotateSpeed = 1.2
    controlsRef.current = controls

    // ResizeObserver — keeps canvas sharp without CSS scaling
    const ro = new ResizeObserver(() => {
      const w = canvas.clientWidth
      const h = canvas.clientHeight
      if (w === 0 || h === 0) return
      renderer.setSize(w, h, false)
      camera.aspect = w / h
      camera.updateProjectionMatrix()
    })
    ro.observe(canvas)
    roRef.current = ro

    // RAF loop
    const tick = () => {
      rafRef.current = requestAnimationFrame(tick)
      const delta = clockRef.current.getDelta()
      controls.update()
      if (vrmRef.current) vrmRef.current.update(delta)
      if (asmRef.current)  asmRef.current.update(delta)
      if (lipRef.current)  lipRef.current.update(delta)
      renderer.render(scene, camera)
    }
    clockRef.current.start()
    tick()

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
      ro.disconnect()
      controls.dispose()
      renderer.dispose()
    }
    // intentionally run once
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ── Sync prop changes after mount
  useEffect(() => {
    controlsRef.current && (controlsRef.current.autoRotate = autoRotate)
  }, [autoRotate])

  useEffect(() => {
    if (gridRef.current) gridRef.current.visible = showGrid
  }, [showGrid])

  useEffect(() => {
    rendererRef.current?.setClearColor(0x000000, transparentBg ? 0 : 1)
  }, [transparentBg])

  // ── Load VRM into scene
  const mountVrm = useCallback((vrm: VRM, scene: THREE.Scene, modelScene: THREE.Object3D) => {
    // Remove previous
    const prev = scene.getObjectByName('__vrm__')
    if (prev) scene.remove(prev)
    if (asmRef.current) { /* no explicit destroy needed */ }
    if (lipRef.current) { lipRef.current.destroy() }

    modelScene.name = '__vrm__'
    scene.add(modelScene)

    // Auto-fit camera
    fitCameraToModel(
      cameraRef.current!,
      modelScene,
      controlsRef.current ? { target: controlsRef.current.target, update: () => controlsRef.current!.update() } : undefined,
    )

    vrmRef.current = vrm
    asmRef.current = new AnimationStateMachine(vrm)
    lipRef.current = new LipSync(vrm)
    onLoaded?.(vrm)
  }, [onLoaded])

  const loadVrmBuffer = useCallback(async (buf: ArrayBuffer, onProgress?: (p: number) => void) => {
    const scene = sceneRef.current
    if (!scene) return
    setIsLoading(true)
    setLoadError(null)
    addLog('info', 'Model dosyası seçildi')
    try {
      const { vrm, scene: modelScene } = await loadVrmFromArrayBuffer(buf, onProgress ?? onLoadProgress)
      addLog('success', 'VRM sahneye yüklendi')
      mountVrm(vrm, scene, modelScene)
    } catch (e) {
      const msg = (e as Error).message
      setLoadError(msg)
      addLog('error', `Hata: VRM okunamadı — ${msg}`)
      onError?.(msg)
    } finally {
      setIsLoading(false)
    }
  }, [mountVrm, setIsLoading, setLoadError, addLog, onLoadProgress, onError])

  const loadVrmUrl = useCallback(async (url: string, onProgress?: (p: number) => void) => {
    const scene = sceneRef.current
    if (!scene) return
    setIsLoading(true)
    setLoadError(null)
    addLog('info', 'Model URL yükleniyor...')
    try {
      const { vrm, scene: modelScene } = await loadVrmFromFileUrl(url, onProgress ?? onLoadProgress)
      addLog('success', 'VRM sahneye yüklendi')
      mountVrm(vrm, scene, modelScene)
    } catch (e) {
      const msg = (e as Error).message
      setLoadError(msg)
      addLog('error', `Hata: VRM okunamadı — ${msg}`)
      onError?.(msg)
    } finally {
      setIsLoading(false)
    }
  }, [mountVrm, setIsLoading, setLoadError, addLog, onLoadProgress, onError])

  // ── Expose imperative handle
  useImperativeHandle(ref, () => ({
    loadFromBuffer: loadVrmBuffer,
    loadFromFileUrl: loadVrmUrl,
    capturePreview: () => {
      const renderer = rendererRef.current
      const camera   = cameraRef.current
      const scene    = sceneRef.current
      if (!renderer || !camera || !scene) return null
      renderer.render(scene, camera)
      return renderer.domElement.toDataURL('image/png')
    },
    startLipSync: (audio?: HTMLAudioElement) => {
      lipRef.current?.startLipSync(audio)
      addLog('info', 'Lip sync başlatıldı')
    },
    stopLipSync: () => {
      lipRef.current?.stopLipSync()
    },
    setAnimState: (s: AnimationState) => {
      asmRef.current?.setState(s)
    },
  }), [loadVrmBuffer, loadVrmUrl, addLog])

  const { isLoading, loadError } = useModelStore()

  return (
    <div className="relative w-full h-full" style={{ minHeight: 320 }}>
      <canvas
        ref={canvasRef}
        className="w-full h-full block"
        style={{ display: 'block', imageRendering: 'auto' }}
      />

      {/* Loading overlay */}
      {isLoading && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3"
          style={{ background: 'rgba(5,7,10,0.75)', backdropFilter: 'blur(8px)' }}>
          <div className="w-10 h-10 rounded-full border-2 border-transparent"
            style={{ borderTopColor: '#8b5cf6', animation: 'spin 0.8s linear infinite' }} />
          <span className="text-sm" style={{ color: '#8b5cf6' }}>Model yükleniyor...</span>
        </div>
      )}

      {/* Error overlay */}
      {loadError && !isLoading && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 p-6"
          style={{ background: 'rgba(5,7,10,0.85)', backdropFilter: 'blur(8px)' }}>
          <div className="text-sm text-center max-w-xs leading-relaxed" style={{ color: '#f87171' }}>
            {loadError}
          </div>
          <button
            onClick={() => useModelStore.getState().setLoadError(null)}
            className="mt-2 px-4 py-1.5 rounded-lg text-xs"
            style={{ background: 'rgba(248,113,113,0.15)', border: '1px solid rgba(248,113,113,0.3)', color: '#f87171' }}
          >
            Kapat
          </button>
        </div>
      )}

      {/* Empty state */}
      {!isLoading && !loadError && !vrmRef.current && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 pointer-events-none">
          <div className="text-3xl" style={{ color: 'rgba(139,92,246,0.3)' }}>3D</div>
          <span className="text-xs" style={{ color: 'rgba(148,163,184,0.5)' }}>VRM model yüklenmedi</span>
        </div>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
})

export default VrmViewer
