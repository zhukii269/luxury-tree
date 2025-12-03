import { useMemo, useRef } from 'react'
import { useFrame, extend } from '@react-three/fiber'
import * as THREE from 'three'
import { shaderMaterial } from '@react-three/drei'
import { generateChaosPositions, calculateTreePositions } from '../../utils/DualPositionUtils'
import { useStore } from '../../store/useStore'

const FoliageMaterial = shaderMaterial(
  {
    uTime: 0,
    uProgress: 0, // 0 = Chaos, 1 = Formed
    uColorPrimary: new THREE.Color('#D4AF37'), // Gold
    uColorSecondary: new THREE.Color('#F5E6C8'), // Warm White / Pale Gold
  },
  // Vertex Shader
  `
    uniform float uTime;
    uniform float uProgress;
    attribute vec3 aChaosPos;
    attribute vec3 aTargetPos;
    attribute float aSize;
    attribute float aRandom;
    
    // Easing function (Quart InOut)
    float easeInOutQuart(float x) {
      return x < 0.5 ? 8.0 * x * x * x * x : 1.0 - pow(-2.0 * x + 2.0, 4.0) / 2.0;
    }

    void main() {
      float t = easeInOutQuart(uProgress);
      
      // Lerp position
      vec3 pos = mix(aChaosPos, aTargetPos, t);
      
      // Add subtle movement
      pos.x += sin(uTime * 0.5 + aRandom * 10.0) * 0.1;
      pos.y += cos(uTime * 0.3 + aRandom * 10.0) * 0.1;
      pos.z += sin(uTime * 0.7 + aRandom * 10.0) * 0.1;
      
      vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
      gl_Position = projectionMatrix * mvPosition;
      
      // Size attenuation
      gl_PointSize = aSize * (300.0 / -mvPosition.z);
    }
  `,
  // Fragment Shader
  `
    uniform vec3 uColorPrimary;
    uniform vec3 uColorSecondary;
    
    void main() {
      // Circular particle
      float r = distance(gl_PointCoord, vec2(0.5));
      if (r > 0.5) discard;
      
      // Gradient from center
      float strength = 1.0 - (r * 2.0);
      strength = pow(strength, 1.5);
      
      vec3 color = mix(uColorSecondary, uColorPrimary, strength);
      gl_FragColor = vec4(color, 1.0);
    }
  `
)

extend({ FoliageMaterial })

export const Foliage = () => {
  const count = 8000 // Increased from 5000 for better density
  const { progress } = useStore()
  const materialRef = useRef<any>(null)

  const [chaosPos, targetPos, sizes, randoms] = useMemo(() => {
    const chaos = generateChaosPositions(count, 15, 20)
    const target = calculateTreePositions(count, 5, 12)
    const sizes = new Float32Array(count)
    const randoms = new Float32Array(count)

    for (let i = 0; i < count; i++) {
      // Size variation: smaller at top (higher y in target)
      // target[i*3+1] is y (-6 to 6)
      const y = target[i * 3 + 1]
      const hNorm = (y + 6) / 12

      // Lerp size: 0.2 at bottom, 0.1 at top
      sizes[i] = 0.2 * (1 - hNorm) + 0.1 * hNorm + Math.random() * 0.05

      randoms[i] = Math.random()
    }
    return [chaos, target, sizes, randoms]
  }, [])

  useFrame((state) => {
    if (materialRef.current) {
      materialRef.current.uTime = state.clock.elapsedTime
      // We assume progress is animated by a controller
      materialRef.current.uProgress = progress
    }
  })

  return (
    <points frustumCulled={false}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[chaosPos, 3]} />
        <bufferAttribute attach="attributes-aChaosPos" args={[chaosPos, 3]} />
        <bufferAttribute attach="attributes-aTargetPos" args={[targetPos, 3]} />
        <bufferAttribute attach="attributes-aSize" args={[sizes, 1]} />
        <bufferAttribute attach="attributes-aRandom" args={[randoms, 1]} />
      </bufferGeometry>
      {/* @ts-ignore */}
      <foliageMaterial ref={materialRef} transparent depthWrite={false} />
    </points>
  )
}
