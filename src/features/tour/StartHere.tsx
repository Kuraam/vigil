import { Compass, X } from 'lucide-react'
import { useState } from 'react'
import { setStartDismissed, startDismissed, useTour } from './tourStore'

/** First-visit orientation for someone opening VIGIL cold. Dismissible; the tour stays available in the navigation. */
export function StartHere() {
  const [hidden, setHidden] = useState(startDismissed)
  const startTour = useTour((s) => s.start)
  if (hidden) return null
  const dismiss = () => {
    setStartDismissed(true)
    setHidden(true)
  }

  return (
    <section aria-labelledby="start-heading" data-testid="start-here" className="relative rounded-lg border border-accent/60 bg-panel p-4 sm:p-5">
      <button type="button" onClick={dismiss} aria-label="Dismiss Start here" className="absolute top-2 right-2 grid size-11 cursor-pointer place-items-center rounded-md text-fg-muted hover:text-fg">
        <X aria-hidden className="size-5" />
      </button>
      <h2 id="start-heading" className="pr-10 text-lg font-semibold text-fg">
        Start here
      </h2>
      <p className="mt-1 max-w-[70ch] text-fg-muted">
        VIGIL is a crew health console that helps astronauts who are not physicians check their own health and act on it
        when Earth is too far away to ask.
      </p>
      <ol className="mt-3 grid gap-2 sm:grid-cols-3">
        {['What is my status?', 'Why does it matter here?', 'What do I do now?'].map((q, i) => (
          <li key={q} className="flex items-baseline gap-2 rounded-md border border-line bg-raised px-3 py-2">
            <span className="readout text-sm text-fg-muted">{i + 1}</span>
            <span className="font-medium text-fg">{q}</span>
          </li>
        ))}
      </ol>
      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => {
            dismiss()
            startTour()
          }}
          className="inline-flex h-11 cursor-pointer items-center gap-2 rounded-md bg-accent px-4 font-medium text-accent-ink hover:opacity-90"
        >
          <Compass aria-hidden className="size-4" />
          Take the 60-second tour
        </button>
        <button type="button" onClick={dismiss} className="h-11 cursor-pointer rounded-md border border-line-strong px-4 text-fg-muted hover:text-fg">
          Dismiss
        </button>
      </div>
    </section>
  )
}
