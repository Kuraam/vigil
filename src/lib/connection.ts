/**
 * Connection and offline-readiness state, as pure functions (unit-tested).
 * The service worker wiring lives in lib/pwa.ts; this file only decides what to show.
 */

/** unsupported: no service worker (old browser or dev server). installing: first visit, precache in progress. */
export type SwState = 'unsupported' | 'installing' | 'ready'

export interface ConnectionView {
  kind: 'online' | 'offline' | 'preparing'
  label: string
}

/** What the top-bar badge says. Being offline always wins: it is the fact the crew needs. */
export function connectionView({ online, sw }: { online: boolean; sw: SwState }): ConnectionView {
  if (!online) return { kind: 'offline', label: 'Offline: running on device' }
  if (sw === 'installing') return { kind: 'preparing', label: 'Preparing offline mode…' }
  return { kind: 'online', label: 'Online' }
}

export interface PwaState {
  sw: SwState
  /** One-off "Ready to work offline." toast. */
  toast: 'ready' | null
  /** A new version is waiting. Shown as a prompt; never applied without the user. */
  update: boolean
}

export type PwaEvent = { type: 'offline-ready' } | { type: 'need-refresh' } | { type: 'dismiss-toast' } | { type: 'dismiss-update' } | { type: 'register-error' }

export function initialPwaState({ supported, controlled, enabled }: { supported: boolean; controlled: boolean; enabled: boolean }): PwaState {
  const sw: SwState = !supported || !enabled ? 'unsupported' : controlled ? 'ready' : 'installing'
  return { sw, toast: null, update: false }
}

export function pwaReducer(state: PwaState, event: PwaEvent): PwaState {
  switch (event.type) {
    case 'offline-ready':
      return { ...state, sw: 'ready', toast: 'ready' }
    case 'need-refresh':
      return { ...state, update: true }
    case 'dismiss-toast':
      return { ...state, toast: null }
    case 'dismiss-update':
      return { ...state, update: false }
    case 'register-error':
      return state.sw === 'ready' ? state : { ...state, sw: 'unsupported' }
  }
}
