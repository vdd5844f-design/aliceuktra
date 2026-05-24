import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { VRMLoaderPlugin, VRMUtils } from '@pixiv/three-vrm'
import type { VRM } from '@pixiv/three-vrm'

export interface VrmLoadResult {
  vrm: VRM
  scene: THREE.Group
}

export async function loadVrmFromArrayBuffer(
  buffer: ArrayBuffer,
  onProgress?: (pct: number) => void,
): Promise<VrmLoadResult> {
  const loader = new GLTFLoader()
  loader.register((parser) => new VRMLoaderPlugin(parser))

  return new Promise((resolve, reject) => {
    // Convert ArrayBuffer → object URL for GLTFLoader
    const blob = new Blob([buffer], { type: 'application/octet-stream' })
    const url = URL.createObjectURL(blob)

    loader.load(
      url,
      (gltf) => {
        URL.revokeObjectURL(url)
        const vrm = gltf.userData.vrm as VRM | undefined
        if (!vrm) {
          reject(new Error('VRM verisi okunamadı. Dosya geçerli bir VRM modeli olmayabilir.'))
          return
        }
        // Optimize: remove back-face culling artifacts
        VRMUtils.removeUnnecessaryVertices(gltf.scene)
        VRMUtils.combineSkeletons(gltf.scene)
        // Fix Y-up / Z-up orientation
        VRMUtils.rotateVRM0(vrm)
        resolve({ vrm, scene: gltf.scene })
      },
      (progress) => {
        if (progress.total > 0 && onProgress) {
          onProgress(Math.round((progress.loaded / progress.total) * 100))
        }
      },
      (error) => {
        URL.revokeObjectURL(url)
        reject(new Error(`VRM yüklenemedi: ${(error as Error).message ?? error}`))
      },
    )
  })
}

export async function loadVrmFromFileUrl(
  fileUrl: string,
  onProgress?: (pct: number) => void,
): Promise<VrmLoadResult> {
  const loader = new GLTFLoader()
  loader.register((parser) => new VRMLoaderPlugin(parser))

  return new Promise((resolve, reject) => {
    loader.load(
      fileUrl,
      (gltf) => {
        const vrm = gltf.userData.vrm as VRM | undefined
        if (!vrm) {
          reject(new Error('VRM verisi okunamadı.'))
          return
        }
        VRMUtils.removeUnnecessaryVertices(gltf.scene)
        VRMUtils.combineSkeletons(gltf.scene)
        VRMUtils.rotateVRM0(vrm)
        resolve({ vrm, scene: gltf.scene })
      },
      (progress) => {
        if (progress.total > 0 && onProgress) {
          onProgress(Math.round((progress.loaded / progress.total) * 100))
        }
      },
      (error) => {
        reject(new Error(`VRM yüklenemedi: ${(error as Error).message ?? error}`))
      },
    )
  })
}
