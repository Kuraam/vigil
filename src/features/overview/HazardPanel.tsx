import { HAZARD_ICON } from '../../components/hazardIcons'
import { HAZARD_FOOTNOTE, HAZARDS } from '../../data/hazards'
import { SOURCES } from '../../data/sources'

/** The five NASA HRP hazards, one plain-English line each. */
export function HazardPanel() {
  return (
    <section aria-labelledby="hazards-heading" className="rounded-lg border border-line bg-panel">
      <div className="px-4 pt-4 sm:px-5">
        <h2 id="hazards-heading" className="text-base font-semibold text-fg">
          Spaceflight hazards
        </h2>
        <p className="mt-0.5 text-sm text-fg-muted">The five hazards NASA’s Human Research Program studies.</p>
      </div>
      <ul className="mt-3 divide-y divide-line border-t border-line">
        {HAZARDS.map((h) => {
          const Icon = HAZARD_ICON[h.id]
          return (
            <li key={h.id} className="flex gap-3 px-4 py-3.5 sm:px-5">
              <Icon aria-hidden className="mt-0.5 size-5 shrink-0 text-fg-muted" />
              <div className="min-w-0">
                <h3 className="font-medium text-fg">{h.name}</h3>
                <p className="mt-0.5 text-sm text-fg-muted">{h.summary}</p>
              </div>
            </li>
          )
        })}
      </ul>
      <div className="space-y-1 border-t border-line px-4 py-3 sm:px-5">
        <p className="text-sm text-fg">{HAZARD_FOOTNOTE}</p>
        <p className="text-xs text-fg-faint">
          Source:{' '}
          <a href={SOURCES.hrpHazards.url} target="_blank" rel="noreferrer" className="underline decoration-line-strong underline-offset-2 hover:text-fg">
            {SOURCES.hrpHazards.label}
          </a>
        </p>
      </div>
    </section>
  )
}
