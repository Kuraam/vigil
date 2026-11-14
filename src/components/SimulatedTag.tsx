import { FlaskConical } from 'lucide-react'

/** Marks anything built from the generated dataset. Neutral styling: it is a label, not a status. */
export function SimulatedTag({ children = 'Simulated data' }: { children?: string }) {
  return (
    <span className="inline-flex h-7 items-center gap-1.5 rounded-md border border-line-strong px-2 text-sm text-fg-muted">
      <FlaskConical aria-hidden className="size-4" />
      {children}
    </span>
  )
}
