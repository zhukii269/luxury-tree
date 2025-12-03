import { useRef, useMemo } from 'react'

import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useStore } from '../../store/useStore'
import { generateChaosPositions, calculateTreeSurfacePositions } from '../../utils/DualPositionUtils'

const OrnamentType = {
    GIFT: { count: 12, color: '#B8860B', scale: 0.7, radiusScale: 1.0 }, // Dark Gold, Fewer, Slightly Smaller
    ORB_GLOSS: { count: 15, color: '#720e1e', scale: 0.45, radiusScale: 1.0 }, // Deep Burgundy Gloss
    ORB_MATTE: { count: 10, color: '#4a0404', scale: 0.45, radiusScale: 1.0 }, // Darker Velvet
    LIGHT: { count: 120, color: '#FFF8E7', scale: 0.08, radiusScale: 0.7 }, // "Stardust" - More, Tiny, Inside Tree
    DUST: { count: 600, color: '#FFD700', scale: 0.03, radiusScale: 1.1 }, // More Dust, Outer Halo
}

export const Ornaments = () => {
    const { progress } = useStore()
    const giftRef = useRef<THREE.InstancedMesh>(null!)
    const orbGlossRef = useRef<THREE.InstancedMesh>(null!)
    const orbMatteRef = useRef<THREE.InstancedMesh>(null!)
    const lightRef = useRef<THREE.InstancedMesh>(null!)
    const dustRef = useRef<THREE.InstancedMesh>(null!)

    // Data generation
    const [giftData, orbGlossData, orbMatteData, lightData, dustData] = useMemo(() => {
        // Helper to generate data for a type
        const gen = (type: typeof OrnamentType.GIFT) => {
            const { count, radiusScale } = type
            const chaos = generateChaosPositions(count, 15, 20)
            // Apply radius scale to target positions
            const target = calculateTreeSurfacePositions(count, 5 * radiusScale, 12)

            // Generate random scales for variance (0.5x to 1.5x base scale)
            const randomScales = new Float32Array(count)
            for (let i = 0; i < count; i++) randomScales[i] = 0.5 + Math.random() * 1.0
            return { chaos, target, randomScales }
        }
        return [
            gen(OrnamentType.GIFT),
            gen(OrnamentType.ORB_GLOSS),
            gen(OrnamentType.ORB_MATTE),
            gen(OrnamentType.LIGHT),
            gen(OrnamentType.DUST)
        ]
    }, [])

    // Animation Loop
    useFrame((state) => {
        const time = state.clock.elapsedTime

        const updateMesh = (ref: React.RefObject<THREE.InstancedMesh>, data: any, scaleBase: number) => {
            if (!ref.current) return
            const { chaos, target, randomScales } = data
            const count = chaos.length / 3
            const dummy = new THREE.Object3D()

            // Easing function (Quart InOut) - same as shader
            const tRaw = progress
            const t = tRaw < 0.5 ? 8.0 * tRaw * tRaw * tRaw * tRaw : 1.0 - Math.pow(-2.0 * tRaw + 2.0, 4.0) / 2.0

            for (let i = 0; i < count; i++) {
                const cx = chaos[i * 3], cy = chaos[i * 3 + 1], cz = chaos[i * 3 + 2]
                const tx = target[i * 3], ty = target[i * 3 + 1], tz = target[i * 3 + 2]

                const x = THREE.MathUtils.lerp(cx, tx, t)
                const y = THREE.MathUtils.lerp(cy, ty, t)
                const z = THREE.MathUtils.lerp(cz, tz, t)

                dummy.position.set(x, y, z)

                // Rotation
                dummy.rotation.x = time * 0.5 + i
                dummy.rotation.y = time * 0.3 + i

                // Scale with variance
                const variance = randomScales[i]
                dummy.scale.setScalar(scaleBase * variance)

                dummy.updateMatrix()
                ref.current.setMatrixAt(i, dummy.matrix)
            }
            ref.current.instanceMatrix.needsUpdate = true
        }

        updateMesh(giftRef, giftData, OrnamentType.GIFT.scale)
        updateMesh(orbGlossRef, orbGlossData, OrnamentType.ORB_GLOSS.scale)
        updateMesh(orbMatteRef, orbMatteData, OrnamentType.ORB_MATTE.scale)
        updateMesh(lightRef, lightData, OrnamentType.LIGHT.scale)
        updateMesh(dustRef, dustData, OrnamentType.DUST.scale)
    })

    return (
        <group>
            {/* Gold Gifts - Darker, Richer Gold */}
            <instancedMesh ref={giftRef} args={[undefined, undefined, OrnamentType.GIFT.count]}>
                <boxGeometry />
                <meshStandardMaterial
                    color={OrnamentType.GIFT.color}
                    metalness={1.0}
                    roughness={0.15}
                    envMapIntensity={2.0}
                />
            </instancedMesh>

            {/* Glossy Red Orbs - Deep Burgundy */}
            <instancedMesh ref={orbGlossRef} args={[undefined, undefined, OrnamentType.ORB_GLOSS.count]}>
                <sphereGeometry args={[1, 32, 32]} />
                <meshStandardMaterial
                    color={OrnamentType.ORB_GLOSS.color}
                    metalness={0.8}
                    roughness={0.05}
                    envMapIntensity={1.5}
                />
            </instancedMesh>

            {/* Matte Red Orbs - Velvet */}
            <instancedMesh ref={orbMatteRef} args={[undefined, undefined, OrnamentType.ORB_MATTE.count]}>
                <sphereGeometry args={[1, 32, 32]} />
                <meshStandardMaterial
                    color={OrnamentType.ORB_MATTE.color}
                    metalness={0.2}
                    roughness={0.9}
                />
            </instancedMesh>

            {/* Lights - Stardust, Inner Glow */}
            <instancedMesh ref={lightRef} args={[undefined, undefined, OrnamentType.LIGHT.count]}>
                <sphereGeometry args={[1, 8, 8]} />
                <meshStandardMaterial
                    color={OrnamentType.LIGHT.color}
                    emissive={OrnamentType.LIGHT.color}
                    emissiveIntensity={2.0} // Reduced intensity for subtlety
                    toneMapped={false}
                />
            </instancedMesh>

            {/* Gold Dust */}
            <instancedMesh ref={dustRef} args={[undefined, undefined, OrnamentType.DUST.count]}>
                <dodecahedronGeometry args={[1, 0]} />
                <meshStandardMaterial
                    color={OrnamentType.DUST.color}
                    emissive={OrnamentType.DUST.color}
                    emissiveIntensity={0.5}
                    transparent
                    opacity={0.6}
                />
            </instancedMesh>
        </group>
    )
}
