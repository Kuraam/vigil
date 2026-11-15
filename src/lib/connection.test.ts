import { describe, expect, it } from 'vitest'
import { connectionView, initialPwaState, pwaReducer, type PwaState } from './connection'

describe('connectionView', () => {
  it('shows Online when connected and offline mode is ready', () => {
    expect(connectionView({ online: true, sw: 'ready' })).toEqual({ kind: 'online', label: 'Online' })
  })
  it('shows Online when no service worker is available (e.g. the dev server)', () => {
    expect(connectionView({ online: true, sw: 'unsupported' })).toEqual({ kind: 'online', label: 'Online' })
  })
  it('shows Preparing while the precache is still installing on first visit', () => {
    expect(connectionView({ online: true, sw: 'installing' })).toEqual({ kind: 'preparing', label: 'Preparing offline mode…' })
  })
  it('offline always wins, whatever the service worker state', () => {
    for (const sw of ['ready', 'installing', 'unsupported'] as const)
      expect(connectionView({ online: false, sw })).toEqual({ kind: 'offline', label: 'Offline: running on device' })
  })
})

describe('initialPwaState', () => {
  it('is ready when a service worker already controls the page (a return visit)', () => {
    expect(initialPwaState({ supported: true, controlled: true, enabled: true }).sw).toBe('ready')
  })
  it('is installing on a first visit in a production build', () => {
    expect(initialPwaState({ supported: true, controlled: false, enabled: true }).sw).toBe('installing')
  })
  it('is unsupported when the browser has no service workers or the build has none (dev)', () => {
    expect(initialPwaState({ supported: false, controlled: false, enabled: true }).sw).toBe('unsupported')
    expect(initialPwaState({ supported: true, controlled: false, enabled: false }).sw).toBe('unsupported')
  })
  it('starts with no toast and no update prompt', () => {
    expect(initialPwaState({ supported: true, controlled: false, enabled: true })).toMatchObject({ toast: null, update: false })
  })
})

describe('pwaReducer', () => {
  const first: PwaState = { sw: 'installing', toast: null, update: false }

  it('offline-ready marks the app ready and shows the toast once', () => {
    const s = pwaReducer(first, { type: 'offline-ready' })
    expect(s).toEqual({ sw: 'ready', toast: 'ready', update: false })
  })
  it('the toast can be dismissed without changing readiness', () => {
    const s = pwaReducer(pwaReducer(first, { type: 'offline-ready' }), { type: 'dismiss-toast' })
    expect(s).toEqual({ sw: 'ready', toast: null, update: false })
  })
  it('need-refresh shows the update prompt and never reloads by itself', () => {
    const s = pwaReducer({ sw: 'ready', toast: null, update: false }, { type: 'need-refresh' })
    expect(s.update).toBe(true)
    expect(s.sw).toBe('ready')
  })
  it('a dismissed update prompt stays hidden until a new version is found', () => {
    let s = pwaReducer({ sw: 'ready', toast: null, update: false }, { type: 'need-refresh' })
    s = pwaReducer(s, { type: 'dismiss-update' })
    expect(s.update).toBe(false)
    s = pwaReducer(s, { type: 'need-refresh' })
    expect(s.update).toBe(true)
  })
  it('a registration error falls back to unsupported so the badge never sticks on Preparing', () => {
    expect(pwaReducer(first, { type: 'register-error' }).sw).toBe('unsupported')
  })
  it('a registration error does not undo a ready app', () => {
    expect(pwaReducer({ sw: 'ready', toast: null, update: false }, { type: 'register-error' }).sw).toBe('ready')
  })
})
