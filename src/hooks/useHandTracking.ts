import { useEffect, useRef } from 'react'
import { FilesetResolver, HandLandmarker } from '@mediapipe/tasks-vision'
import { useStore } from '../store/useStore'
import { useThree, useFrame } from '@react-three/fiber'
import * as THREE from 'three'

export const useHandTracking = () => {
    const { setTreeState, setProgress } = useStore()
    const { camera } = useThree()
    // Default camera position: centered at z=25
    const targetCameraPos = useRef(new THREE.Vector3(0, 0, 25))

    useEffect(() => {
        let handLandmarker: HandLandmarker | null = null
        let video: HTMLVideoElement | null = null
        let lastVideoTime = -1
        let animationFrameId: number

        const setup = async () => {
            try {
                const vision = await FilesetResolver.forVisionTasks(
                    "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.0/wasm"
                )
                handLandmarker = await HandLandmarker.createFromOptions(vision, {
                    baseOptions: {
                        modelAssetPath: `https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task`,
                        delegate: "GPU"
                    },
                    runningMode: "VIDEO",
                    numHands: 1
                })

                video = document.createElement('video')
                const stream = await navigator.mediaDevices.getUserMedia({ video: true })
                video.srcObject = stream
                video.play()

                video.addEventListener('loadeddata', predict)
            } catch (e) {
                console.error("Hand tracking setup failed:", e)
            }
        }

        const predict = () => {
            if (!handLandmarker || !video) return

            if (video.currentTime !== lastVideoTime) {
                const results = handLandmarker.detectForVideo(video, performance.now())

                if (results.landmarks && results.landmarks.length > 0) {
                    const landmarks = results.landmarks[0]

                    // 1. Detect Open/Closed
                    // Heuristic: Average distance of fingertips to wrist
                    const wrist = landmarks[0]
                    const tips = [4, 8, 12, 16, 20].map(i => landmarks[i])
                    const avgDist = tips.reduce((acc, tip) => {
                        const d = Math.sqrt(
                            Math.pow(tip.x - wrist.x, 2) +
                            Math.pow(tip.y - wrist.y, 2)
                        )
                        return acc + d
                    }, 0) / 5

                    // Threshold: > 0.25 usually open, < 0.2 usually closed
                    const isOpen = avgDist > 0.25

                    if (isOpen) {
                        setTreeState('CHAOS')
                        setProgress(0)
                    } else {
                        setTreeState('FORMED')
                        setProgress(1)
                    }

                    // 2. Camera Control
                    // Map hand x/y (0-1) to camera position offset
                    // x: 0->1 => move camera X
                    const handX = landmarks[9].x
                    const handY = landmarks[9].y

                    // Invert X because webcam is mirrored usually
                    // Map 0..1 to -10..10 for X
                    const targetX = (0.5 - handX) * 30
                    // Map 0..1 to -5..5 for Y (centered around 0)
                    const targetY = (0.5 - handY) * 20

                    targetCameraPos.current.set(targetX, targetY, 25)
                }

                lastVideoTime = video.currentTime
            }

            animationFrameId = requestAnimationFrame(predict)
        }

        setup()

        return () => {
            cancelAnimationFrame(animationFrameId)
            if (video && video.srcObject) {
                (video.srcObject as MediaStream).getTracks().forEach(t => t.stop())
            }
            handLandmarker?.close()
        }
    }, [])

    useFrame(() => {
        // Smooth camera movement
        camera.position.lerp(targetCameraPos.current, 0.05)
        // Look at the center of the tree (0, 0, 0)
        camera.lookAt(0, 0, 0)
    })
}
