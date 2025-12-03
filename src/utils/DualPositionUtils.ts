

/**
 * Generates random positions within a spherical shell.
 * @param count Number of particles
 * @param minRadius Inner radius of the chaos sphere
 * @param maxRadius Outer radius of the chaos sphere
 */
export const generateChaosPositions = (count: number, minRadius: number, maxRadius: number): Float32Array => {
    const positions = new Float32Array(count * 3)
    for (let i = 0; i < count; i++) {
        const r = minRadius + Math.random() * (maxRadius - minRadius)
        const theta = Math.random() * Math.PI * 2
        const phi = Math.acos(2 * Math.random() - 1)

        positions[i * 3] = r * Math.sin(phi) * Math.cos(theta)
        positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta)
        positions[i * 3 + 2] = r * Math.cos(phi)
    }
    return positions
}

/**
 * Generates positions forming a cone (Christmas Tree shape).
 * @param count Number of particles
 * @param baseRadius Radius of the cone base
 * @param height Height of the cone
 */
export const calculateTreePositions = (count: number, baseRadius: number, height: number): Float32Array => {
    const positions = new Float32Array(count * 3)
    const spiralCount = 2 // Double spiral as requested

    for (let i = 0; i < count; i++) {
        // Bottom-heavy distribution
        const hNorm = Math.pow(Math.random(), 1.2)
        const h = hNorm * height

        // Radius at this height (linear taper)
        const rAtH = (1 - h / height) * baseRadius

        // Spiral logic for Foliage
        // 8 full rotations to create a dense, flowing stream
        const rotations = 8
        const spiralAngle = hNorm * Math.PI * 2 * rotations

        const armIndex = Math.floor(Math.random() * spiralCount)
        const armOffset = (armIndex / spiralCount) * Math.PI * 2

        // Jitter to create "flow" volume around the spiral line
        // Wide jitter to avoid looking like a thin line, but distinct enough to show the spiral
        const angleJitter = (Math.random() - 0.5) * 1.5

        const finalAngle = spiralAngle + armOffset + angleJitter

        // Radius distribution
        // Bias towards the outer shell but keep some depth
        const r = rAtH * (0.3 + Math.random() * 0.7)

        positions[i * 3] = r * Math.cos(finalAngle)
        positions[i * 3 + 1] = h - height / 2 // Center the tree vertically around 0
        positions[i * 3 + 2] = r * Math.sin(finalAngle)
    }
    return positions
}

/**
 * Generates positions on the surface of the cone (for ornaments) with Spiral distribution.
 */
export const calculateTreeSurfacePositions = (count: number, baseRadius: number, height: number): Float32Array => {
    const positions = new Float32Array(count * 3)
    // Create 3 distinct spirals
    const spiralCount = 3

    for (let i = 0; i < count; i++) {
        // Uniform height distribution for ornaments to cover the whole tree
        // But maybe slightly bottom heavy too?
        // Limit height to 85% to strictly avoid overlapping with the Star at the top
        const hNorm = Math.pow(Math.random(), 1.2) * 0.85
        const h = hNorm * height

        const rAtH = (1 - h / height) * baseRadius

        // Spiral logic: Angle depends on height
        // 5 full rotations (10 * PI) up the tree
        const spiralAngle = hNorm * Math.PI * 10

        // Add offset based on which spiral arm (randomly assigned)
        const armOffset = (Math.floor(Math.random() * spiralCount) / spiralCount) * Math.PI * 2

        // Add some random jitter to the angle so it's not a perfect line
        const jitter = (Math.random() - 0.5) * 1.0

        const angle = spiralAngle + armOffset + jitter

        // Surface: r is close to rAtH
        const r = rAtH * (0.9 + Math.random() * 0.2)

        positions[i * 3] = r * Math.cos(angle)
        positions[i * 3 + 1] = h - height / 2
        positions[i * 3 + 2] = r * Math.sin(angle)
    }
    return positions
}
