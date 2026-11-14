import { Info } from 'lucide-react'
import { PageHeader } from '../../components/PageHeader'
import { SimulatedTag } from '../../components/SimulatedTag'
import { HazardPanel } from './HazardPanel'
import { StatusSummary } from './StatusSummary'
import { useCrewSummary } from './useCrewSummary'
import { VitalReadout } from './VitalReadout'

export function OverviewPage() {
  const { crew, rows, counts, latestDay } = useCrewSummary()

  return (
    <div className="space-y-6">
      <PageHeader
        title={crew ? crew.name : 'No crew member selected'}
        description={crew ? `${crew.role} (${crew.callSign}). Latest readings from mission day ${latestDay}.` : undefined}
        aside={<SimulatedTag>Simulated crew and readings</SimulatedTag>}
      />

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_24rem]">
        <div className="min-w-0 space-y-6">
          <StatusSummary counts={counts} />

          {counts.nodata === rows.length && (
            <p className="flex gap-2.5 rounded-lg border border-line bg-raised px-4 py-3 text-sm text-fg-muted">
              <Info aria-hidden className="mt-0.5 size-4 shrink-0 text-accent" />
              Status thresholds have not been sourced yet, so VIGIL shows every value as measured and does not rate
              it. Sourced ranges arrive in phase 2.
            </p>
          )}

          <section aria-labelledby="readings-heading" className="overflow-hidden rounded-lg border border-line">
            <h2 id="readings-heading" className="bg-panel px-4 pt-4 pb-3 text-base font-semibold text-fg sm:px-5">
              Latest readings
            </h2>
            <div className="grid grid-cols-1 gap-px border-t border-line bg-line md:grid-cols-2 2xl:grid-cols-3">
              {rows.map((row, i) => (
                <VitalReadout
                  key={row.meta.type}
                  row={row}
                  // Odd count in two columns: let the last cell span the row instead of leaving a hole.
                  className={i === rows.length - 1 && rows.length % 2 === 1 ? 'md:col-span-2 2xl:col-span-1' : ''}
                />
              ))}
            </div>
          </section>
        </div>

        <HazardPanel />
      </div>
    </div>
  )
}
