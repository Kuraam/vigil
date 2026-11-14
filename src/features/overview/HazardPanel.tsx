import { Atom, Box, Globe, MoveDown, Users, type LucideIcon } from 'lucide-react'
import { HAZARDS } from '../../data/hazards'
import type { HazardId } from '../../types'

const ICON: Record<HazardId, LucideIcon> = {
  'space-radiation': Atom,
  'isolation-confinement': Users,
  'distance-from-earth': Globe,
  'gravity-fields': MoveDown,
  'hostile-closed-environments': Box,
}

/** The five NASA HRP hazards with what each one means for the crew. */
export function HazardPanel() {
  return (
    <section aria-labelledby="hazards-heading" className="rounded-lg border border-line bg-panel">
      <div className="px-4 pt-4 sm:px-5">
        <h2 id="hazards-heading" className="text-base font-semibold text-fg">
          Spaceflight hazards
        </h2>
        <p className="mt-0.5 text-sm text-fg-muted">The five hazards NASA tracks for every crew, and what to watch.</p>
      </div>
      <ul className="mt-3 divide-y divide-line border-t border-line">
        {HAZARDS.map((h) => {
          const Icon = ICON[h.id]
          return (
            <li key={h.id} className="flex gap-3 px-4 py-4 sm:px-5">
              <Icon aria-hidden className="mt-0.5 size-5 shrink-0 text-fg-muted" />
              <div className="min-w-0">
                <h3 className="font-medium text-fg">{h.name}</h3>
                <p className="mt-1 text-sm text-fg-muted">{h.summary}</p>
                <p className="mt-2 text-sm">
                  <span className="text-fg-faint">Watch: </span>
                  <span className="text-fg">{h.watchFor.join(', ')}</span>
                </p>
              </div>
            </li>
          )
        })}
      </ul>
      <p className="border-t border-line px-4 py-3 text-xs text-fg-faint sm:px-5">Source: {HAZARDS[0].source}</p>
    </section>
  )
}
