import { EffectComposer, Bloom } from '@react-three/postprocessing'

export const Effects = () => {
    return (
        <EffectComposer enableNormalPass={false}>
            <Bloom
                luminanceThreshold={1.0} // Only extremely bright things glow (the core)
                mipmapBlur
                intensity={1.0} // Subtle, elegant glow
                radius={0.4} // Small radius, no "fog"
            />
        </EffectComposer>
    )
}
