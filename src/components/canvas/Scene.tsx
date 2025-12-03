import { PerspectiveCamera } from '@react-three/drei'
import { Foliage } from './Foliage'
import { Ornaments } from './Ornaments'
import { Star } from './Star'
import { Gifts } from './Gifts'
import { Polaroids } from './Polaroids'
import { Effects } from './Effects'
import { GestureController } from '../GestureController'
import { useStore } from '../../store/useStore'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

export const Scene = () => {
    return (
        <>
            <PerspectiveCamera makeDefault position={[0, 4, 20]} fov={50} />

            {/* Lighting Setup - Boosted to compensate for removed Environment */}
            <ambientLight intensity={0.8} color="#F5F5DC" />
            <hemisphereLight intensity={0.5} color="#FFFFFF" groundColor="#444444" />

            {/* Spotlight for dramatic top-down lighting */}
            <spotLight
                position={[0, 20, 0]}
                angle={0.25}
                penumbra={1}
                intensity={3.0}
                color="#FFF8E7" // Warm white
                castShadow
            />

            <directionalLight
                position={[5, 10, 7]}
                intensity={2.0}
                color="#FFFFFF"
                castShadow
            />

            {/* City preset offers warmer, more complex reflections than lobby */}
            {/* REMOVED: Causing network timeout on GitHub Pages (raw.githack.com blocked) */}
            {/* <Environment preset="city" /> */}

            <Foliage />
            <Ornaments />
            <Star />
            <Gifts />
            <Polaroids />

            <Effects />
            <TransitionManager />
            <GestureController />
        </>
    )
}

const TransitionManager = () => {
    const { treeState, progress, setProgress } = useStore()
    useFrame((_state, delta) => {
        const target = treeState === 'FORMED' ? 1 : 0
        // Smooth transition (approx 1.5s)
        const newProgress = THREE.MathUtils.lerp(progress, target, delta * 2.0)

        if (Math.abs(newProgress - progress) > 0.0001) {
            setProgress(newProgress)
        }
    })
    return null
}
