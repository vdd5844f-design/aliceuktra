import * as THREE from 'three'
import type { RenderQuality, PixelRatioMode } from './types'

export function applyRenderQuality(
  renderer: THREE.WebGLRenderer,
  quality: RenderQuality,
  pixelRatioMode: PixelRatioMode,
) {
  // Pixel ratio
  let pr: number
  switch (pixelRatioMode) {
    case 'device': pr = Math.min(window.devicePixelRatio, 2); break
    case 'fixed2': pr = 2; break
    case 'fixed1': pr = 1; break
  }
  renderer.setPixelRatio(pr)

  // Color management (Three.js r152+)
  renderer.outputColorSpace = THREE.SRGBColorSpace
  renderer.useLegacyLights = false

  // Tone mapping
  switch (quality) {
    case 'ultra':
      renderer.toneMapping = THREE.ACESFilmicToneMapping
      renderer.toneMappingExposure = 1.1
      renderer.shadowMap.enabled = true
      renderer.shadowMap.type = THREE.PCFSoftShadowMap
      break
    case 'high':
      renderer.toneMapping = THREE.ACESFilmicToneMapping
      renderer.toneMappingExposure = 1.0
      renderer.shadowMap.enabled = true
      renderer.shadowMap.type = THREE.PCFShadowMap
      break
    case 'balanced':
      renderer.toneMapping = THREE.ReinhardToneMapping
      renderer.toneMappingExposure = 0.95
      renderer.shadowMap.enabled = false
      break
  }
}

export function createLighting(scene: THREE.Scene, quality: RenderQuality) {
  // Ambient
  const ambient = new THREE.AmbientLight(0xffffff, quality === 'balanced' ? 1.5 : 1.2)
  scene.add(ambient)

  // Directional key light
  const dir = new THREE.DirectionalLight(0xffffff, quality === 'balanced' ? 1.0 : 1.4)
  dir.position.set(1, 2, 2)
  if (quality !== 'balanced') {
    dir.castShadow = true
    dir.shadow.mapSize.set(1024, 1024)
    dir.shadow.camera.near = 0.1
    dir.shadow.camera.far = 20
  }
  scene.add(dir)

  // Rim light — cyan tint
  const rim = new THREE.DirectionalLight(0x06b6d4, 0.35)
  rim.position.set(-2, 1, -2)
  scene.add(rim)

  // Fill light — violet tint
  const fill = new THREE.DirectionalLight(0x8b5cf6, 0.2)
  fill.position.set(2, 0, -1)
  scene.add(fill)

  return { ambient, dir, rim, fill }
}

/** Auto-fit camera to bounding box of loaded model */
export function fitCameraToModel(
  camera: THREE.PerspectiveCamera,
  object: THREE.Object3D,
  controls?: { target: THREE.Vector3; update: () => void },
) {
  const box = new THREE.Box3().setFromObject(object)
  const size = box.getSize(new THREE.Vector3())
  const center = box.getCenter(new THREE.Vector3())

  const maxDim = Math.max(size.x, size.y, size.z)
  const fov = camera.fov * (Math.PI / 180)
  let distance = maxDim / (2 * Math.tan(fov / 2))
  distance *= 1.4 // padding

  camera.position.set(center.x, center.y + size.y * 0.1, center.z + distance)
  camera.near = distance / 100
  camera.far = distance * 100
  camera.updateProjectionMatrix()

  if (controls) {
    controls.target.copy(center)
    controls.update()
  }
}
