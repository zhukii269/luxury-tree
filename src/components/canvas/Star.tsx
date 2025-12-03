import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useStore } from '../../store/useStore'

export const Star = () => {
    const { progress } = useStore()
    const groupRef = useRef<THREE.Group>(null!)

    // Create Star Shape
    const starShape = useMemo(() => {
        const shape = new THREE.Shape()
        const points = 5
        const innerRadius = 0.4
        const outerRadius = 1.0

        for (let i = 0; i < points * 2; i++) {
            const angle = (i * Math.PI) / points
            const radius = i % 2 === 0 ? outerRadius : innerRadius
            const x = Math.cos(angle) * radius
            const y = Math.sin(angle) * radius
            if (i === 0) shape.moveTo(x, y)
            else shape.lineTo(x, y)
        }
        shape.closePath()
        return shape
    }, [])

    const extrudeSettings = {
        depth: 0.2,
        bevelEnabled: true,
        bevelThickness: 0.1,
        bevelSize: 0.1,
        bevelSegments: 3
    }

    useFrame((state) => {
        if (!groupRef.current) return

        // Animate Star: Rotate slowly
        groupRef.current.rotation.y = state.clock.elapsedTime * 0.2

        // Scale transition based on progress (appear when tree forms)
        // Smooth ease-out
        const t = progress
        const scale = THREE.MathUtils.lerp(0, 1, t * t * (3 - 2 * t))
        groupRef.current.scale.setScalar(scale)

        // Float slightly
        groupRef.current.position.y = 6.0 + Math.sin(state.clock.elapsedTime * 1.5) * 0.1
    })

    return (
        <group ref={groupRef} position={[0, 6.0, 0]}>
            {/* The Star Mesh */}
            <mesh castShadow receiveShadow>
                <extrudeGeometry args={[starShape, extrudeSettings]} />
                <meshStandardMaterial
                    color="#D4AF37" // Antique Gold
                    metalness={1.0}
                    roughness={0.2}
                    emissive="#FFD700"
                    emissiveIntensity={0.5} // Warm glow base
                />
            </mesh>

            {/* Diamond/Crystal Center */}
            <mesh position={[0, 0, 0.15]}>
                <dodecahedronGeometry args={[0.3, 0]} />
                <meshStandardMaterial
                    color="#FFFFFF"
                    metalness={1.0}
                    roughness={0.0}
                    emissive="#FFFFFF"
                    emissiveIntensity={2.0} // Bright center
                    envMapIntensity={3.0}
                />
            </mesh>

            {/* The Crown Jewel Light - Real PointLight */}
            <pointLight
                color="#FFD700"
                intensity={2.0}
                distance={15}
                decay={2}
                castShadow
                shadow-bias={-0.001}
            />
        </group>
    )
}
