import { useMemo, useRef, Suspense } from 'react'
import { useFrame } from '@react-three/fiber'
import { useTexture } from '@react-three/drei'
import * as THREE from 'three'
import { useStore } from '../../store/useStore'

const PolaroidFrame = ({ position, rotation, scale, index }: any) => {
    // Load texture based on index (1-14 repeating)
    // Use BASE_URL for correct path in production (GitHub Pages)
    const textureUrl = `${import.meta.env.BASE_URL}photos/${(index % 14) + 1}.jpg`

    // useTexture will suspend if loading, handled by Suspense parent
    const texture = useTexture(textureUrl)

    // Fix texture orientation if needed (often textures are flipped in GL)
    texture.flipY = true
    texture.colorSpace = THREE.SRGBColorSpace

    return (
        <group position={position} rotation={rotation} scale={scale}>
            {/* White Paper Frame */}
            <mesh castShadow receiveShadow>
                <boxGeometry args={[1, 1.2, 0.02]} />
                <meshStandardMaterial
                    color="#FFFFFF"
                    roughness={0.9}
                    metalness={0.0}
                />
            </mesh>
            {/* Photo Area */}
            <mesh position={[0, 0.1, 0.021]}>
                <planeGeometry args={[0.8, 0.8]} />
                <meshStandardMaterial
                    map={texture}
                    color="#FFFFFF"
                    roughness={0.5}
                    metalness={0.0}
                />
            </mesh>
        </group>
    )
}

export const Polaroids = () => {
    const { progress } = useStore()
    const groupRef = useRef<THREE.Group>(null!)
    const stringMeshRef = useRef<THREE.Mesh>(null!)
    const prevProgress = useRef(-1)

    // Pre-calculate layouts
    const layoutData = useMemo(() => {
        const spiral = []
        const linear = []
        const count = 18

        // --- Spiral Layout ---
        const heightStart = -4.0
        const heightEnd = 4.0
        const heightRange = heightEnd - heightStart

        for (let i = 0; i < count; i++) {
            const t = i / (count - 1)
            const h = heightStart + t * heightRange
            const treeRadius = 5 * (1 - (h + 6) / 12)
            const r = treeRadius + 1.2
            const angle = t * Math.PI * 2 * 3

            const x = r * Math.cos(angle)
            const z = r * Math.sin(angle)

            const lookAtPos = new THREE.Vector3(0, h, 0)
            const pos = new THREE.Vector3(x, h, z)
            const dummy = new THREE.Object3D()
            dummy.position.copy(pos)
            dummy.lookAt(lookAtPos)
            dummy.rotation.y += Math.PI
            dummy.rotation.z += (Math.random() - 0.5) * 0.2
            dummy.rotation.x += (Math.random() - 0.5) * 0.2

            spiral.push({
                pos: new THREE.Vector3(x, h, z),
                rot: new THREE.Euler(dummy.rotation.x, dummy.rotation.y, dummy.rotation.z),
                scale: 0.8
            })
        }

        // --- Circular Ring Layout (Gallery View) ---
        const radius = 11.0
        for (let i = 0; i < count; i++) {
            // Distribute evenly around the circle
            const t = i / count
            const angle = t * Math.PI * 2

            const x = radius * Math.cos(angle)
            const z = radius * Math.sin(angle)
            // Gentle wave: 2 peaks and troughs
            const y = Math.sin(angle * 2) * 1.5

            const pos = new THREE.Vector3(x, y, z)

            // Calculate rotation to face OUTWARDS
            const lookAtPos = new THREE.Vector3(0, y, 0)
            const dummy = new THREE.Object3D()
            dummy.position.copy(pos)
            dummy.lookAt(lookAtPos)
            dummy.rotation.y += Math.PI // Face outwards

            linear.push({
                pos: pos,
                rot: new THREE.Euler(dummy.rotation.x, dummy.rotation.y, dummy.rotation.z),
                scale: 2.5
            })
        }

        return { spiral, linear }
    }, [])

    useFrame((state) => {
        if (!groupRef.current) return

        // Only update if progress has changed significantly
        if (Math.abs(progress - prevProgress.current) < 0.0001) {
            groupRef.current.position.y = Math.sin(state.clock.elapsedTime * 0.5) * 0.1
            return
        }
        prevProgress.current = progress

        // Interpolate between layouts based on progress
        const t = progress

        // Update each photo
        groupRef.current.children.forEach((child, i) => {
            if (child === stringMeshRef.current) return
            if (i >= layoutData.spiral.length) return

            const s = layoutData.spiral[i]
            const l = layoutData.linear[i]

            child.position.lerpVectors(l.pos, s.pos, t)
            child.rotation.x = THREE.MathUtils.lerp(l.rot.x, s.rot.x, t)
            child.rotation.y = THREE.MathUtils.lerp(l.rot.y, s.rot.y, t)
            child.rotation.z = THREE.MathUtils.lerp(l.rot.z, s.rot.z, t)

            const currentScale = THREE.MathUtils.lerp(l.scale, s.scale, t)
            child.scale.setScalar(currentScale)
        })

        // Update String with Safety Checks
        if (stringMeshRef.current && groupRef.current) {
            const points: THREE.Vector3[] = []
            // Filter only PolaroidFrame children (exclude string mesh)
            const polaroids = groupRef.current.children.filter(child => child !== stringMeshRef.current)

            // Only generate string if we have enough polaroids mounted
            if (polaroids.length > 0) {
                for (let i = 0; i < polaroids.length; i++) {
                    const child = polaroids[i]
                    if (!child) continue

                    const currentScale = child.scale.x
                    const offset = new THREE.Vector3(0, 0.65 * currentScale, 0)
                    offset.applyEuler(child.rotation)
                    offset.add(child.position)
                    points.push(offset)
                }

                if (points.length > 1) {
                    const curve = new THREE.CatmullRomCurve3(points)
                    if (stringMeshRef.current.geometry) stringMeshRef.current.geometry.dispose()
                    stringMeshRef.current.geometry = new THREE.TubeGeometry(curve, 64, 0.02, 8, false)
                }
            }
        }

        groupRef.current.position.y = Math.sin(state.clock.elapsedTime * 0.5) * 0.1
    })

    return (
        <group ref={groupRef}>
            <Suspense fallback={null}>
                {layoutData.spiral.map((_, i) => (
                    <PolaroidFrame
                        key={i}
                        index={i}
                        position={[0, 0, 0]}
                        rotation={[0, 0, 0]}
                        scale={[1, 1, 1]}
                    />
                ))}
            </Suspense>

            {/* Gold String */}
            <mesh ref={stringMeshRef}>
                <meshStandardMaterial
                    color="#FFD700"
                    metalness={1.0}
                    roughness={0.2}
                    emissive="#FFD700"
                    emissiveIntensity={0.5}
                />
            </mesh>
        </group>
    )
}
