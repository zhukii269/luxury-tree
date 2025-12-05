import { useMemo, useRef, Suspense } from 'react'
import { useFrame } from '@react-three/fiber'
import { useTexture } from '@react-three/drei'
import * as THREE from 'three'
import { useStore } from '../../store/useStore'

// Dynamically import all photos from src/assets/photos
const photoImports = import.meta.glob('/src/assets/photos/*.{jpg,png,jpeg,webp}', {
    eager: true,
    query: '?url',
    import: 'default'
})
const photoUrls = Object.values(photoImports) as string[]

const PolaroidFrame = ({ position, rotation, scale, url }: any) => {
    // useTexture will suspend if loading, handled by Suspense parent
    const texture = useTexture(url) as THREE.Texture

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

    const count = photoUrls.length

    // Pre-calculate layouts
    const layoutData = useMemo(() => {
        if (count === 0) return { spiral: [], linear: [] }

        const spiral = []
        const linear = []

        // --- Spiral Layout ---
        const heightStart = -4.0
        const heightEnd = 4.0
        const heightRange = heightEnd - heightStart

        for (let i = 0; i < count; i++) {
            // Safe division for t
            const t = count > 1 ? i / (count - 1) : 0.5

            const h = heightStart + t * heightRange
            // Tree radius: 5 at bottom (h=-4), 0 at top (h=4) approx relationship
            const treeRadius = 5 * (1 - (h + 6) / 12)
            const r = treeRadius + 1.2

            // 3 full turns
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
            const t = count > 1 ? i / count : 0
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
    }, [count])

    useFrame((state) => {
        if (!groupRef.current || count === 0) return

        // Floating animation
        groupRef.current.position.y = Math.sin(state.clock.elapsedTime * 0.5) * 0.1

        const t = progress

        // 1. Update Photo Meshes (View)
        let photoIndex = 0
        groupRef.current.children.forEach((child) => {
            if (child === stringMeshRef.current) return
            if (photoIndex >= layoutData.spiral.length) return

            const s = layoutData.spiral[photoIndex]
            const l = layoutData.linear[photoIndex]

            // Interpolate transform
            child.position.lerpVectors(l.pos, s.pos, t)
            child.rotation.x = THREE.MathUtils.lerp(l.rot.x, s.rot.x, t)
            child.rotation.y = THREE.MathUtils.lerp(l.rot.y, s.rot.y, t)
            child.rotation.z = THREE.MathUtils.lerp(l.rot.z, s.rot.z, t)

            const currentScale = THREE.MathUtils.lerp(l.scale, s.scale, t)
            child.scale.setScalar(currentScale)

            photoIndex++
        })

        // 2. Update String (Data-Driven)
        if (stringMeshRef.current && count > 0) {
            const points: THREE.Vector3[] = []

            for (let i = 0; i < layoutData.spiral.length; i++) {
                const s = layoutData.spiral[i]
                const l = layoutData.linear[i]

                // Calculate where the photo SHOULD be
                const pos = new THREE.Vector3().lerpVectors(l.pos, s.pos, t)

                // Calculate rotation
                const rot = new THREE.Euler(
                    THREE.MathUtils.lerp(l.rot.x, s.rot.x, t),
                    THREE.MathUtils.lerp(l.rot.y, s.rot.y, t),
                    THREE.MathUtils.lerp(l.rot.z, s.rot.z, t)
                )

                // Calculate scale
                const scale = THREE.MathUtils.lerp(l.scale, s.scale, t)

                // Calculate attachment point (top of the photo)
                const offset = new THREE.Vector3(0, 0.65 * scale, 0)
                offset.applyEuler(rot)
                offset.add(pos)

                points.push(offset)
            }

            // Need at least 2 points to make a curve
            if (points.length > 1) {
                const curve = new THREE.CatmullRomCurve3(points)
                if (stringMeshRef.current.geometry) stringMeshRef.current.geometry.dispose()
                stringMeshRef.current.geometry = new THREE.TubeGeometry(curve, 64, 0.02, 8, false)
            }
        }
    })

    if (count === 0) return null

    return (
        <group ref={groupRef}>
            <Suspense fallback={null}>
                {photoUrls.map((url) => (
                    <PolaroidFrame
                        key={url} // Using URL as unique key
                        url={url}
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
