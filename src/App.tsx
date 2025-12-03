import { Canvas } from '@react-three/fiber'
import { Suspense } from 'react'
import { Scene } from './components/canvas/Scene'
import { Loader } from '@react-three/drei'
import { Overlay } from './components/Overlay'

function App() {
  return (
    <>
      <Canvas
        camera={{ position: [0, 0, 25], fov: 45 }}
        gl={{ antialias: false, toneMappingExposure: 1.0 }}
        dpr={[1, 2]}
      >
        <Suspense fallback={null}>
          <Scene />
        </Suspense>
      </Canvas>
      <Loader />
      <Overlay />
    </>
  )
}

export default App
