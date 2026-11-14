import { RotateCcw } from 'lucide-react'
import { useRef, useState } from 'react'
import { useVigilStore } from '../../lib/store'

/** Restores the seeded demo state after a confirm step (native modal dialog: focus trap and Escape for free). */
export function ResetDemo() {
  const reset = useVigilStore((s) => s.resetSimulation)
  const dialog = useRef<HTMLDialogElement>(null)
  const [msg, setMsg] = useState('')

  return (
    <section aria-labelledby="reset-heading" data-testid="reset-demo" className="max-w-4xl rounded-lg border border-line bg-panel p-4 sm:p-5">
      <h2 id="reset-heading" className="text-base font-semibold text-fg">
        Demo data
      </h2>
      <p className="mt-1 text-sm text-fg-muted">
        Restore the seeded crew data. This removes everything logged in this browser: readings, routine ticks, protocol
        runs and brief questions.
      </p>
      <button
        type="button"
        onClick={() => {
          setMsg('')
          dialog.current?.showModal()
        }}
        className="mt-3 inline-flex h-11 cursor-pointer items-center gap-2 rounded-md border border-line-strong px-4 text-fg hover:border-fg-faint"
      >
        <RotateCcw aria-hidden className="size-4" />
        Reset demo data
      </button>
      <p role="status" className="mt-2 min-h-5 text-sm text-fg-muted">
        {msg}
      </p>

      <dialog
        ref={dialog}
        aria-labelledby="reset-confirm-title"
        className="m-auto w-[min(28rem,calc(100vw-2rem))] rounded-lg border border-line-strong bg-raised p-5 text-fg backdrop:bg-black/60"
      >
        <h3 id="reset-confirm-title" className="text-lg font-semibold">
          Reset demo data?
        </h3>
        <p className="mt-2 text-fg-muted">Everything logged in this browser will be replaced by the seeded data. This cannot be undone.</p>
        <form method="dialog" className="mt-4 flex justify-end gap-2">
          <button value="cancel" className="h-11 cursor-pointer rounded-md border border-line-strong px-4 text-fg">
            Cancel
          </button>
          <button
            value="reset"
            onClick={() => {
              reset()
              setMsg('Demo data reset to the seeded state.')
            }}
            className="h-11 cursor-pointer rounded-md bg-accent px-4 font-medium text-accent-ink"
          >
            Reset
          </button>
        </form>
      </dialog>
    </section>
  )
}
