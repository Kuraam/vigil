import { StatusChip } from '../../components/StatusChip'
import { formatDelta, formatReading } from '../../lib/format'
import { REASON_LABEL } from '../../lib/status'
import type { ImagingModality } from '../../types'
import type { VitalRow } from './useCrewSummary'

const MODALITY: Record<ImagingModality, string> = {
  ultrasound: 'Ultrasound',
  'fundus-photo': 'Eye fundus photo',
  'optical-coherence': 'Optical coherence scan',
  photo: 'Photo',
}

/** Time of day in mission time, e.g. "07:12". */
const timeOf = (iso: string) => iso.slice(11, 16)

/** One cell of the readout panel: label, big value, context line, status chip. */
export function VitalReadout({ row, className = '' }: { row: VitalRow; className?: string }) {
  const { meta, reading, result, delta } = row
  const shown = reading ? formatReading(reading) : null
  const decimals = meta.type === 'coreTemperature' || meta.type === 'sleepHours' ? 1 : 0

  return (
    <article aria-labelledby={`vital-${meta.type}`} className={`flex flex-col gap-3 bg-panel p-4 sm:p-5 ${className}`}>
      <header className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 id={`vital-${meta.type}`} className="font-medium text-fg">
            {meta.label}
          </h3>
          <p className="text-sm text-fg-faint">{meta.method}</p>
        </div>
        <StatusChip result={result} title={REASON_LABEL[result.reason]} />
      </header>

      {shown && reading ? (
        <>
          {reading.kind === 'imaging' ? (
            <p className="text-2xl leading-8 font-medium text-fg">{shown.value}</p>
          ) : (
            <p className="flex items-baseline gap-2">
              <span className="readout text-4xl leading-10 font-medium text-fg">{shown.value}</span>
              <span className="text-base text-fg-muted">{shown.unit}</span>
            </p>
          )}
          <dl className="mt-auto flex flex-wrap gap-x-5 gap-y-1 text-sm">
            <div className="flex gap-1.5">
              <dt className="text-fg-faint">Taken</dt>
              <dd className="readout text-fg-muted">
                Day {reading.missionDay}, {timeOf(reading.timestamp)}
              </dd>
            </div>
            {reading.kind === 'imaging' ? (
              <div className="flex gap-1.5">
                <dt className="text-fg-faint">Scan</dt>
                <dd className="text-fg-muted">{MODALITY[reading.modality]}</dd>
              </div>
            ) : (
              delta !== null && (
                <div className="flex gap-1.5">
                  <dt className="text-fg-faint">vs 7-day mean{reading.kind === 'pressure' ? ' (systolic)' : ''}</dt>
                  <dd className="readout text-fg-muted">{formatDelta(delta, decimals)}</dd>
                </div>
              )
            )}
          </dl>
        </>
      ) : (
        <p className="text-fg-muted">No reading logged for this crew member yet.</p>
      )}
    </article>
  )
}
