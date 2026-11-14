import { ChevronDown, Info } from 'lucide-react'
import { useId, useState, type ReactNode } from 'react'

/** A labelled show/hide toggle. Keyboard and screen-reader friendly (aria-expanded + aria-controls). */
export function Disclosure({ label, children, icon = true }: { label: string; children: ReactNode; icon?: boolean }) {
  const [open, setOpen] = useState(false)
  const id = useId()
  return (
    <div>
      <button
        type="button"
        aria-expanded={open}
        aria-controls={id}
        onClick={() => setOpen((o) => !o)}
        className="inline-flex min-h-11 cursor-pointer items-center gap-1.5 rounded-md px-2 text-sm text-fg-muted transition-colors hover:bg-raised hover:text-fg"
      >
        {icon && <Info aria-hidden className="size-4 text-accent" />}
        {label}
        <ChevronDown aria-hidden className={`size-4 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      <div id={id} hidden={!open} className="mt-2">
        {children}
      </div>
    </div>
  )
}
