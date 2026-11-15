import { CircleCheck, RefreshCw, X } from 'lucide-react'
import { useEffect } from 'react'
import { usePwa } from '../../lib/pwa'

/**
 * Non-blocking notices, bottom left (the tour panel uses the bottom right):
 * "Ready to work offline." once the precache is complete, and an update prompt
 * that waits for the crew to choose Reload, so a protocol is never interrupted.
 */
export function PwaToasts() {
  const toast = usePwa((s) => s.pwa.toast)
  const update = usePwa((s) => s.pwa.update)
  const dispatch = usePwa((s) => s.dispatch)
  const applyUpdate = usePwa((s) => s.applyUpdate)

  useEffect(() => {
    if (!toast) return
    const id = window.setTimeout(() => dispatch({ type: 'dismiss-toast' }), 6000)
    return () => window.clearTimeout(id)
  }, [toast, dispatch])

  if (!toast && !update) return null
  return (
    <div className="pointer-events-none fixed bottom-4 left-4 z-40 flex w-[min(24rem,calc(100vw-2rem))] flex-col gap-2 print:hidden">
      {toast === 'ready' && (
        <div role="status" data-testid="offline-ready-toast" className="pointer-events-auto flex items-center gap-3 rounded-lg border border-line-strong bg-raised py-2 pr-2 pl-3 text-sm text-fg shadow-lg shadow-shadow/30">
          <CircleCheck aria-hidden className="size-4 shrink-0 text-accent" />
          <span className="flex-1">Ready to work offline.</span>
          <button type="button" onClick={() => dispatch({ type: 'dismiss-toast' })} aria-label="Dismiss" className="grid size-9 cursor-pointer place-items-center rounded-md text-fg-muted hover:text-fg">
            <X aria-hidden className="size-4" />
          </button>
        </div>
      )}
      {update && (
        <div role="status" data-testid="update-prompt" className="pointer-events-auto flex flex-wrap items-center gap-x-3 gap-y-2 rounded-lg border border-accent bg-raised py-2 pr-2 pl-3 text-sm text-fg shadow-lg shadow-shadow/30">
          <RefreshCw aria-hidden className="size-4 shrink-0 text-accent" />
          <span className="flex-1">Update available. Your data stays on this device.</span>
          <span className="flex gap-1.5">
            <button type="button" onClick={() => dispatch({ type: 'dismiss-update' })} className="h-9 cursor-pointer rounded-md px-3 text-fg-muted hover:text-fg">
              Later
            </button>
            <button type="button" onClick={applyUpdate} className="h-9 cursor-pointer rounded-md bg-accent px-3 font-medium text-accent-ink hover:opacity-90">
              Reload
            </button>
          </span>
        </div>
      )}
    </div>
  )
}
