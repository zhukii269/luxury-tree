import { PerspectiveCamera, Environment, Lightformer } from '@react-three/drei'
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

            {/* Procedural Studio Lighting - Replaces external HDR to prevent black screen */}
            {/* This creates luxury reflections (Gold/Warm) without network dependencies */}
            <Environment resolution={256}>
                <group rotation={[-Math.PI / 3, 0, 1]}>
                    <Lightformer form="circle" intensity={4} rotation-x={Math.PI / 2} position={[0, 5, -9]} scale={2} />
                    <Lightformer form="circle" intensity={2} rotation-y={Math.PI / 2} position={[-5, 1, -1]} scale={2} />
                    <Lightformer form="circle" intensity={2} rotation-y={Math.PI / 2} position={[-5, -1, -1]} scale={2} />
                    <Lightformer form="circle" intensity={2} rotation-y={-Math.PI / 2} position={[10, 1, 0]} scale={8} />
                </group>
            </Environment>

            <ambientLight intensity={0.5} color="#F5F5DC" />
            <spotLight position={[0, 20, 0]} angle={0.25} penumbra={1} intensity={2.0} color="#FFF8E7" castShadow />
            <directionalLight position={[5, 10, 7]} intensity={1.5} color="#FFFFFF" castShadow />
            <pointLight position={[0, 2, 4]} intensity={1.5} color="#FFF5E0" distance={10} decay={2} />

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
