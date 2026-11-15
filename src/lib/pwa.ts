/// <reference types="vite-plugin-pwa/client" />
import { registerSW } from 'virtual:pwa-register'
import { create } from 'zustand'
import { initialPwaState, pwaReducer, type PwaEvent, type PwaState } from './connection'

/** The browser's install prompt event (not yet in the DOM typings). */
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

interface PwaStore {
  online: boolean
  pwa: PwaState
  /** Set when the browser offers installation (beforeinstallprompt); cleared once used or installed. */
  installEvent: BeforeInstallPromptEvent | null
  installed: boolean
  dispatch: (e: PwaEvent) => void
  /** Apply a waiting update: only ever called from the "Reload" button. */
  applyUpdate: () => void
  install: () => Promise<void>
}

let updateSW: ((reload?: boolean) => Promise<void>) | undefined

const supported = typeof navigator !== 'undefined' && 'serviceWorker' in navigator

export const usePwa = create<PwaStore>()((set, get) => ({
  online: typeof navigator === 'undefined' ? true : navigator.onLine,
  pwa: initialPwaState({
    supported,
    controlled: supported && Boolean(navigator.serviceWorker.controller),
    // The dev server has no service worker; only production builds precache.
    enabled: import.meta.env.PROD,
  }),
  installEvent: null,
  installed: typeof window !== 'undefined' && window.matchMedia?.('(display-mode: standalone)').matches === true,
  dispatch: (e) => set({ pwa: pwaReducer(get().pwa, e) }),
  applyUpdate: () => {
    get().dispatch({ type: 'dismiss-update' })
    void updateSW?.(true)
  },
  install: async () => {
    const e = get().installEvent
    if (!e) return
    await e.prompt()
    const { outcome } = await e.userChoice
    set({ installEvent: null, installed: outcome === 'accepted' })
  },
}))

/** Wire up connection events, the service worker and the install prompt. Called once from main.tsx. */
export function initPwa() {
  const { dispatch } = usePwa.getState()
  window.addEventListener('online', () => usePwa.setState({ online: true }))
  window.addEventListener('offline', () => usePwa.setState({ online: false }))

  // Listen at startup: the browser may offer installation before the Sources page is opened.
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault()
    usePwa.setState({ installEvent: e as BeforeInstallPromptEvent })
  })
  window.addEventListener('appinstalled', () => usePwa.setState({ installEvent: null, installed: true }))

  if (!supported || !import.meta.env.PROD) return
  updateSW = registerSW({
    onOfflineReady: () => dispatch({ type: 'offline-ready' }),
    onNeedRefresh: () => dispatch({ type: 'need-refresh' }),
    onRegisterError: () => dispatch({ type: 'register-error' }),
  })
}
