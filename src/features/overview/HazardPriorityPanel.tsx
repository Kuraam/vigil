import { HAZARD_ICON } from '../../components/hazardIcons'
import { getEnvironment } from '../../data/environments'
import { getHazard } from '../../data/hazards'
import { HAZARD_PRIORITY, PRIORITY_LABEL } from '../../data/priorities'
import type { EnvironmentId } from '../../types'

/** The five hazards ranked for the selected environment (team-defined). Numbered because rank is the point. */
export function HazardPriorityPanel({ environmentId }: { environmentId: EnvironmentId }) {
  const env = getEnvironment(environmentId)
  return (
    <section aria-labelledby="priority-heading" className="rounded-lg border border-line bg-panel">
      <div className="px-4 pt-4 sm:px-5">
        <h2 id="priority-heading" className="text-base font-semibold text-fg">
          Hazard priority in this environment
        </h2>
        <p className="mt-0.5 text-sm text-fg-muted">
          {env.name}, {env.context}.
        </p>
      </div>
      <ol className="mt-3 divide-y divide-line border-t border-line" data-testid="hazard-priority">
        {HAZARD_PRIORITY[environmentId].map((p, i) => {
          const Icon = HAZARD_ICON[p.hazard]
          return (
            <li key={p.hazard} className="flex gap-3 px-4 py-2.5 sm:px-5">
              <span className="readout w-4 shrink-0 pt-0.5 text-fg-muted">{i + 1}</span>
              <Icon aria-hidden className="mt-0.5 size-4 shrink-0 text-fg-muted" />
              <p className="min-w-0 text-sm">
                <span className="font-medium text-fg">{getHazard(p.hazard).name}</span>
                <span className="block text-fg-muted">{p.reason}</span>
              </p>
            </li>
          )
        })}
      </ol>
      <p className="border-t border-line px-4 py-2.5 text-xs text-fg-faint sm:px-5">{PRIORITY_LABEL}</p>
    </section>
  )
}
