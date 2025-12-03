import { useEffect, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { FilesetResolver, GestureRecognizer } from '@mediapipe/tasks-vision'
import { useStore } from '../store/useStore'
import * as THREE from 'three'

export const GestureController = () => {
    const { setTreeState, setIsGestureActive } = useStore()
    const { camera } = useThree()
    const videoRef = useRef<HTMLVideoElement>(document.createElement('video'))
    const recognizerRef = useRef<GestureRecognizer>(null)
    const lastVideoTimeRef = useRef(-1)
    const initializedRef = useRef(false)

    // Camera control state
    const cameraState = useRef({
        rotation: 0,
        zoom: 20,
        prevX: 0,
        isTracking: false
    })

    useEffect(() => {
        if (initializedRef.current) return
        initializedRef.current = true

        let stream: MediaStream | null = null

        const init = async () => {
            try {
                const vision = await FilesetResolver.forVisionTasks(
                    "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.3/wasm"
                )
                recognizerRef.current = await GestureRecognizer.createFromOptions(vision, {
                    baseOptions: {
                        modelAssetPath: "https://storage.googleapis.com/mediapipe-models/gesture_recognizer/gesture_recognizer/float16/1/gesture_recognizer.task",
                        delegate: "GPU"
                    },
                    runningMode: "VIDEO",
                    numHands: 1
                })

                // Setup Camera
                stream = await navigator.mediaDevices.getUserMedia({ video: true })
                videoRef.current.srcObject = stream
                videoRef.current.playsInline = true

                // Wait for data before playing to avoid AbortError
                videoRef.current.onloadeddata = () => {
                    videoRef.current.play().catch(() => {
                        // Ignore play interruption errors
                    })
                    setIsGestureActive(true)
                }
            } catch (e) {
                console.error("Gesture initialization failed:", e)
                setIsGestureActive(false)
            }
        }
        init()

        return () => {
            if (stream) {
                stream.getTracks().forEach(track => track.stop())
            }
            if (videoRef.current) {
                videoRef.current.pause()
                videoRef.current.srcObject = null
            }
        }
    }, [])

    useFrame(() => {
        if (!recognizerRef.current || !videoRef.current || videoRef.current.readyState !== 4) return

        try {
            if (videoRef.current.currentTime !== lastVideoTimeRef.current) {
                lastVideoTimeRef.current = videoRef.current.currentTime
                const result = recognizerRef.current.recognizeForVideo(videoRef.current, Date.now())

                if (result.gestures.length > 0 && result.landmarks.length > 0) {
                    const gesture = result.gestures[0][0]
                    const landmarks = result.landmarks[0]

                    // Use wrist (index 0) as reference point
                    const x = landmarks[0].x

                    // State switching - Lower threshold for better responsiveness
                    if (gesture.categoryName === 'Open_Palm' && gesture.score > 0.6) {
                        console.log("Gesture Detected: Open_Palm -> CHAOS")
                        setTreeState('CHAOS')
                    } else if (gesture.categoryName === 'Closed_Fist' && gesture.score > 0.6) {
                        console.log("Gesture Detected: Closed_Fist -> FORMED")
                        setTreeState('FORMED')
                    }

                    // Camera Control (Horizontal Pan Only)
                    if (!cameraState.current.isTracking) {
                        // First frame of tracking, just set prev
                        cameraState.current.prevX = x
                        cameraState.current.isTracking = true
                    } else {
                        // Calculate delta (inverted because camera moves opposite to drag)
                        // x is 0-1 (left-right)
                        const deltaX = (x - cameraState.current.prevX) * 5 // Sensitivity

                        // Update rotation (Pan Left/Right)
                        cameraState.current.rotation -= deltaX

                        cameraState.current.prevX = x
                    }
                } else {
                    cameraState.current.isTracking = false
                }
            }
        } catch (e) {
            // Suppress frame processing errors
        }

        // Apply Camera Transform
        // Orbit around center (0, 0, 0)
        const rot = cameraState.current.rotation
        const dist = cameraState.current.zoom
        const height = 0 // Center of the tree

        camera.position.x = Math.sin(rot) * dist
        camera.position.z = Math.cos(rot) * dist
        // Smoothly interpolate height to 0 relative to zoom
        camera.position.y = THREE.MathUtils.lerp(camera.position.y, height, 0.1)

        camera.lookAt(0, 0, 0)
    })

    return null
}
