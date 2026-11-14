import { create } from 'zustand'

/** Tour position. Not persisted: a reload ends the tour. */
interface TourState {
  step: number | null
  start: () => void
  go: (step: number) => void
  stop: () => void
}

export const useTour = create<TourState>()((set) => ({
  step: null,
  start: () => set({ step: 0 }),
  go: (step) => set({ step }),
  stop: () => set({ step: null }),
}))

const KEY = 'vigil-start-dismissed'

/** Per-viewer convenience only; storage may be unavailable, so every access is guarded. */
export function startDismissed(): boolean {
  try {
    return localStorage.getItem(KEY) === '1'
  } catch {
    return false
  }
}

export function setStartDismissed(on: boolean) {
  try {
    if (on) localStorage.setItem(KEY, '1')
    else localStorage.removeItem(KEY)
  } catch {
    /* storage blocked: the panel simply shows again next visit */
  }
}
