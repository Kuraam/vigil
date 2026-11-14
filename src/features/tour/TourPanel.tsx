import { X } from 'lucide-react'
import { useEffect, useRef } from 'react'
import { useNavigate } from 'react-router'
import { useVigilStore } from '../../lib/store'
import { TOUR_STEPS } from './steps'
import { useTour } from './tourStore'

const HIGHLIGHT = 'tour-highlight'
const reducedMotion = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false

/**
 * Non-modal tour panel. Each stop sets its demo state, opens its route and
 * outlines one area. Keyboard: buttons in order, Escape ends the tour.
 */
export function TourPanel() {
  const { step, go, stop } = useTour()
  const navigate = useNavigate()
  const setCrew = useVigilStore((s) => s.setCrew)
  const setEnvironment = useVigilStore((s) => s.setEnvironment)
  const headingRef = useRef<HTMLHeadingElement>(null)

  useEffect(() => {
    if (step === null) return
    const s = TOUR_STEPS[step]
    if (s.crewId) setCrew(s.crewId)
    if (s.environmentId) setEnvironment(s.environmentId)
    navigate(s.path)
    headingRef.current?.focus()

    // Wait for the (possibly lazy) page to render its target, then outline and reveal it.
    let tries = 0
    const id = window.setInterval(() => {
      const el = document.querySelector(`[data-tour="${s.target}"]`)
      if (el || ++tries > 40) {
        window.clearInterval(id)
        el?.classList.add(HIGHLIGHT)
        el?.scrollIntoView({ block: 'center', behavior: reducedMotion() ? 'auto' : 'smooth' })
      }
    }, 75)
    return () => {
      window.clearInterval(id)
      document.querySelectorAll(`.${HIGHLIGHT}`).forEach((n) => n.classList.remove(HIGHLIGHT))
    }
  }, [step, navigate, setCrew, setEnvironment])

  useEffect(() => {
    if (step === null) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') stop()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [step, stop])

  if (step === null) return null
  const s = TOUR_STEPS[step]
  const last = step === TOUR_STEPS.length - 1

  return (
    <div
      role="dialog"
      aria-modal="false"
      aria-labelledby="tour-title"
      aria-describedby="tour-caption"
      data-testid="tour-panel"
      className="fixed right-4 bottom-16 z-40 w-[min(26rem,calc(100vw-2rem))] rounded-lg border border-accent bg-raised p-4 shadow-2xl shadow-black/50 print:hidden"
    >
      <div className="flex items-start justify-between gap-3">
        <p className="readout text-xs text-fg-muted">
          Stop {step + 1} of {TOUR_STEPS.length}
        </p>
        <button type="button" onClick={stop} aria-label="Close tour" className="-mt-2 -mr-2 grid size-11 cursor-pointer place-items-center rounded-md text-fg-muted hover:text-fg">
          <X aria-hidden className="size-5" />
        </button>
      </div>
      <h2 id="tour-title" ref={headingRef} tabIndex={-1} className="text-lg font-semibold text-fg outline-none">
        {s.title}
      </h2>
      <p id="tour-caption" className="mt-1 text-fg-muted">
        {s.caption}
      </p>
      <div className="mt-4 flex items-center justify-between gap-2">
        <button type="button" onClick={stop} className="h-11 cursor-pointer rounded-md px-3 text-sm text-fg-muted hover:text-fg">
          Skip tour
        </button>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => go(step - 1)}
            disabled={step === 0}
            className="h-11 cursor-pointer rounded-md border border-line-strong px-4 text-sm text-fg disabled:cursor-not-allowed disabled:opacity-40"
          >
            Back
          </button>
          <button type="button" onClick={() => (last ? stop() : go(step + 1))} className="h-11 cursor-pointer rounded-md bg-accent px-4 text-sm font-medium text-accent-ink hover:opacity-90">
            {last ? 'Finish tour' : 'Next'}
          </button>
        </div>
      </div>
    </div>
  )
}
