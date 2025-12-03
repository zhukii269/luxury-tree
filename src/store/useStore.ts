import { create } from 'zustand'

export type TreeState = 'CHAOS' | 'FORMED'

interface AppState {
    treeState: TreeState
    setTreeState: (state: TreeState) => void
    progress: number // 0 (Chaos) to 1 (Formed)
    setProgress: (p: number) => void
    chaosFactor: number
    setChaosFactor: (c: number) => void
    isGestureActive: boolean
    setIsGestureActive: (active: boolean) => void
}

export const useStore = create<AppState>((set) => ({
    treeState: 'FORMED',
    setTreeState: (state) => set({ treeState: state }),
    progress: 1,
    setProgress: (p) => set({ progress: p }),
    chaosFactor: 0,
    setChaosFactor: (c) => set({ chaosFactor: c }),
    isGestureActive: false,
    setIsGestureActive: (active) => set({ isGestureActive: active }),
}))
