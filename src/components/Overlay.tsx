import { useStore } from '../store/useStore'

export const Overlay = () => {
    const { isGestureActive } = useStore()

    return (
        <div className="absolute top-0 left-0 w-full h-full pointer-events-none flex flex-col items-center justify-between py-10 z-50">
            {/* Header */}
            <div className="text-center">
                <h1 className="text-4xl md:text-6xl font-serif tracking-[0.3em] uppercase drop-shadow-[0_0_15px_rgba(212,175,55,0.6)] text-transparent bg-clip-text bg-gradient-to-b from-[#F9F1D0] to-[#D4AF37]">
                    Grand Luxury
                </h1>
                {/* Ultra-thin refined underline */}
                <div className="w-32 h-[0.5px] bg-gradient-to-r from-transparent via-gold-500 to-transparent mx-auto mt-2 opacity-80" />
            </div>

            {/* Status / Instructions */}
            <div className="text-center space-y-4">
                {!isGestureActive && (
                    <div className="text-gold-300 animate-pulse text-xl font-light tracking-wide">
                        Initializing Vision System...
                    </div>
                )}
            </div>

            {/* Footer Removed */}
            <div />
        </div>
    )
}
