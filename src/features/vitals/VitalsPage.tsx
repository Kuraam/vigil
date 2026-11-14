import { PageHeader } from '../../components/PageHeader'
import { SimulatedTag } from '../../components/SimulatedTag'
import { useCrewHealth } from '../../lib/useCrewHealth'
import { ImagingLog } from './ImagingLog'
import { VitalCard } from './VitalCard'

export function VitalsPage() {
  const { crew, rows, byVital } = useCrewHealth()
  const rated = rows.filter((r) => r.meta.type !== 'imagingLog')

  return (
    <div className="space-y-6">
      <PageHeader
        title="Vitals"
        description={`${crew?.name ?? 'Crew member'}: 30-day trends with the nominal band shaded and threshold lines marked. Log a reading and every page updates.`}
        aside={<SimulatedTag />}
      />
      <div className="grid gap-6 xl:grid-cols-2">
        {rated.map((row) => (
          <VitalCard key={row.meta.type} row={row} />
        ))}
      </div>
      <ImagingLog history={byVital.imagingLog.history} />
    </div>
  )
}

export default VitalsPage
