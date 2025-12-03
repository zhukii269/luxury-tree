import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useStore } from '../../store/useStore'

const GiftBox = ({ position, rotation, scale, color, type }: any) => {
    // Type: 'velvet' | 'satin' | 'metal'
    const materialProps = useMemo(() => {
        if (type === 'velvet') return { roughness: 1.0, metalness: 0.1, envMapIntensity: 0.2 }
        if (type === 'satin') return { roughness: 0.3, metalness: 0.4, envMapIntensity: 0.8 }
        return { roughness: 0.1, metalness: 1.0, envMapIntensity: 1.5 } // metal
    }, [type])

    return (
        <group position={position} rotation={rotation} scale={scale}>
            <mesh castShadow receiveShadow>
                <boxGeometry />
                <meshStandardMaterial color={color} {...materialProps} />
            </mesh>
            {/* Ribbon (Simplified as a cross) */}
            <mesh position={[0, 0.51, 0]} scale={[1.02, 0.05, 0.2]}>
                <boxGeometry />
                <meshStandardMaterial color="#D4AF37" metalness={1.0} roughness={0.2} />
            </mesh>
            <mesh position={[0, 0.51, 0]} scale={[0.2, 0.05, 1.02]}>
                <boxGeometry />
                <meshStandardMaterial color="#D4AF37" metalness={1.0} roughness={0.2} />
            </mesh>
        </group>
    )
}

const Nutcracker = ({ position, rotation, scale }: any) => {
    return (
        <group position={position} rotation={rotation} scale={scale}>
            {/* Legs */}
            <mesh position={[-0.2, 0.5, 0]} castShadow>
                <cylinderGeometry args={[0.1, 0.1, 1, 16]} />
                <meshStandardMaterial color="#000000" />
            </mesh>
            <mesh position={[0.2, 0.5, 0]} castShadow>
                <cylinderGeometry args={[0.1, 0.1, 1, 16]} />
                <meshStandardMaterial color="#000000" />
            </mesh>
            {/* Body */}
            <mesh position={[0, 1.5, 0]} castShadow>
                <boxGeometry args={[0.6, 1, 0.4]} />
                <meshStandardMaterial color="#800020" /> {/* Red Uniform */}
            </mesh>
            {/* Head */}
            <mesh position={[0, 2.2, 0]} castShadow>
                <boxGeometry args={[0.4, 0.4, 0.4]} />
                <meshStandardMaterial color="#F5E6C8" /> {/* Skin */}
            </mesh>
            {/* Hat */}
            <mesh position={[0, 2.6, 0]} castShadow>
                <cylinderGeometry args={[0.25, 0.25, 0.6, 16]} />
                <meshStandardMaterial color="#000000" />
            </mesh>
            {/* Gold Details */}
            <mesh position={[0, 1.5, 0.21]} scale={[0.1, 0.8, 0.05]}>
                <boxGeometry />
                <meshStandardMaterial color="#D4AF37" metalness={1.0} roughness={0.2} />
            </mesh>
        </group>
    )
}

export const Gifts = () => {
    const { progress } = useStore()
    const groupRef = useRef<THREE.Group>(null!)
    const dustRef = useRef<THREE.InstancedMesh>(null!)

    // Generate Floor Dust - Outer Ring
    const dustCount = 200
    const dustData = useMemo(() => {
        const temp = []
        for (let i = 0; i < dustCount; i++) {
            // Radius 5.5 to 9.0 (Outside the tree base radius of 5)
            const r = 5.5 + Math.random() * 3.5
            const angle = Math.random() * Math.PI * 2
            const x = r * Math.cos(angle)
            const z = r * Math.sin(angle)
            const s = 0.02 + Math.random() * 0.03
            temp.push({ pos: [x, 0.05, z], scale: s })
        }
        return temp
    }, [])

    // Generate Gift Ring Positions
    const giftRing = useMemo(() => {
        const gifts = []
        const count = 12 // Number of gifts in the ring
        const radius = 5.0 // Radius of the ring

        for (let i = 0; i < count; i++) {
            const angle = (i / count) * Math.PI * 2
            // Add some randomness to radius and angle for natural look
            const r = radius + (Math.random() - 0.5) * 1.0
            const a = angle + (Math.random() - 0.5) * 0.2

            const x = r * Math.cos(a)
            const z = r * Math.sin(a)

            // Randomize properties
            const scale = 0.8 + Math.random() * 0.6 // Larger gifts: 0.8 - 1.4
            const rotation = [0, Math.random() * Math.PI * 2, 0]

            // Cycle colors/types
            const typeIndex = i % 3
            let color = '#800020' // Velvet Red
            let type = 'velvet'

            if (typeIndex === 1) {
                color = '#0A4D3C' // Satin Green
                type = 'satin'
            } else if (typeIndex === 2) {
                color = '#B8860B' // Metal Gold
                type = 'metal'
            }

            gifts.push({ position: [x, scale * 0.4, z], rotation, scale: [scale, scale, scale], color, type })
        }
        return gifts
    }, [])

    useFrame((state) => {
        if (!groupRef.current) return

        // Scale in based on progress
        const t = progress
        const scale = THREE.MathUtils.lerp(0, 1, t * t)
        groupRef.current.scale.setScalar(scale)

        // Update Dust
        if (dustRef.current) {
            const dummy = new THREE.Object3D()
            dustData.forEach((d, i) => {
                dummy.position.set(d.pos[0] as number, d.pos[1] as number, d.pos[2] as number)
                dummy.scale.setScalar(d.scale * scale) // Scale with gifts
                dummy.updateMatrix()
                dustRef.current.setMatrixAt(i, dummy.matrix)
            })
            dustRef.current.instanceMatrix.needsUpdate = true
        }
    })

    return (
        <group ref={groupRef} position={[0, -6.0, 0]}>
            {/* Generated Gift Ring */}
            {giftRing.map((gift, i) => (
                <GiftBox
                    key={i}
                    position={gift.position}
                    rotation={gift.rotation}
                    scale={gift.scale}
                    color={gift.color}
                    type={gift.type}
                />
            ))}

            {/* Nutcracker Standing Guard - Slightly inside the ring or prominent spot */}
            <Nutcracker position={[-3.5, 0, 4.0]} rotation={[0, 0.5, 0]} scale={[1.2, 1.2, 1.2]} />

            {/* Floor Dust */}
            <instancedMesh ref={dustRef} args={[undefined, undefined, dustCount]}>
                <dodecahedronGeometry args={[1, 0]} />
                <meshStandardMaterial
                    color="#D4AF37"
                    emissive="#D4AF37"
                    emissiveIntensity={0.5}
                    transparent
                    opacity={0.6}
                />
            </instancedMesh>
        </group>
    )
}
