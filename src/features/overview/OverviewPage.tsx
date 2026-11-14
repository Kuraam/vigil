import { PageHeader } from '../../components/PageHeader'
import { SimulatedTag } from '../../components/SimulatedTag'
import { useCrewHealth } from '../../lib/useCrewHealth'
import { StartHere } from '../tour/StartHere'
import { AttentionNow } from './AttentionNow'
import { CrewAtGlance } from './CrewAtGlance'
import { HazardPanel } from './HazardPanel'
import { HazardPriorityPanel } from './HazardPriorityPanel'
import { RadiationPanel } from './RadiationPanel'
import { StatusSummary } from './StatusSummary'
import { VitalReadout } from './VitalReadout'

export function OverviewPage() {
  const { crew, rows, counts, dose, environmentId, missionDay } = useCrewHealth()
  // Action first, so the most urgent readings are seen first.
  const order = { action: 0, watch: 1, nominal: 2, nodata: 3 }
  const sorted = [...rows].sort((a, b) => order[a.result.status] - order[b.result.status])

  return (
    <div className="space-y-6">
      <PageHeader
        title={crew ? crew.name : 'No crew member selected'}
        description={crew ? `${crew.role} (${crew.callSign}). Latest readings from mission day ${missionDay}.` : undefined}
        aside={<SimulatedTag>Simulated crew and readings</SimulatedTag>}
      />

      <AttentionNow />

      <StartHere />

      <CrewAtGlance />

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_26rem]">
        <div className="min-w-0 space-y-6">
          <StatusSummary counts={counts} />

          <section aria-labelledby="readings-heading" className="overflow-hidden rounded-lg border border-line">
            <h2 id="readings-heading" tabIndex={-1} className="scroll-mt-4 bg-panel outline-none px-4 pt-4 pb-3 text-base font-semibold text-fg sm:px-5">
              Latest readings
            </h2>
            <div className="grid grid-cols-1 gap-px border-t border-line bg-line md:grid-cols-2 2xl:grid-cols-3">
              {sorted.map((row, i) => (
                <VitalReadout
                  key={row.meta.type}
                  row={row}
                  // Odd count in two columns: let the last cell span the row instead of leaving a hole.
                  className={i === sorted.length - 1 && sorted.length % 2 === 1 ? 'md:col-span-2 2xl:col-span-1' : ''}
                />
              ))}
            </div>
          </section>
        </div>

        <div className="min-w-0 space-y-6" data-tour="environment">
          <HazardPriorityPanel environmentId={environmentId} />
          <RadiationPanel dose={dose} environmentId={environmentId} missionDay={missionDay} />
          <HazardPanel />
        </div>
      </div>
    </div>
  )
}
