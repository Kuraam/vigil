import { StatusChip } from '../../components/StatusChip'
import { formatDelta, formatReading, MODALITY_LABEL, timeOf } from '../../lib/format'
import type { VitalRow } from '../../lib/useCrewHealth'

/** One cell of the Overview readout panel: label, big value, why it is rated that way. */
export function VitalReadout({ row, className = '' }: { row: VitalRow; className?: string }) {
  const { meta, latest, result, delta } = row
  const shown = latest ? formatReading(latest) : null
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
        <StatusChip result={result} title={result.detail} />
      </header>

      {shown && latest ? (
        <>
          {latest.kind === 'imaging' ? (
            <p className="text-2xl leading-8 font-medium text-fg">{shown.value}</p>
          ) : (
            <p className="flex items-baseline gap-2">
              <span className="readout text-4xl leading-10 font-medium text-fg">{shown.value}</span>
              <span className="text-base text-fg-muted">{shown.unit}</span>
            </p>
          )}
          <p className="text-sm text-fg-muted">{result.detail}</p>
          <dl className="mt-auto flex flex-wrap gap-x-5 gap-y-1 text-sm">
            <div className="flex gap-1.5">
              <dt className="text-fg-faint">Taken</dt>
              <dd className="readout text-fg-muted">
                Day {latest.missionDay}, {timeOf(latest.timestamp)}
                {!latest.simulated && ' (logged)'}
              </dd>
            </div>
            {latest.kind === 'imaging' ? (
              <div className="flex gap-1.5">
                <dt className="text-fg-faint">Scan</dt>
                <dd className="text-fg-muted">{MODALITY_LABEL[latest.modality]}</dd>
              </div>
            ) : (
              delta !== null && (
                <div className="flex gap-1.5">
                  <dt className="text-fg-faint">vs 7-day mean{latest.kind === 'pressure' ? ' (systolic)' : ''}</dt>
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
