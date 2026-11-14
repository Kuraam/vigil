import { Disclosure } from '../../components/Disclosure'
import { StatusChip } from '../../components/StatusChip'
import { ThresholdSources } from '../../components/ThresholdSources'
import { VITAL_NOTES } from '../../data/thresholds'
import { formatReading, timeOf } from '../../lib/format'
import { dailyLatest } from '../../lib/readings'
import type { VitalRow } from '../../lib/useCrewHealth'
import type { RatedVitalType } from '../../types'
import { chartSpec } from './chartSpec'
import { LogReadingForm } from './LogReadingForm'
import { TrendChart } from './TrendChart'
import { VisionCheckForm, VisionStrip } from './VisionCheck'

/** Legend swatch: identity by line style + label, never colour alone. */
function Key({ dash, muted, label }: { dash?: string; muted?: boolean; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <svg aria-hidden width="20" height="6" className={muted ? 'text-fg-muted' : 'text-fg'}>
        <line x1="0" y1="3" x2="20" y2="3" stroke="currentColor" strokeWidth="2" strokeDasharray={dash} />
      </svg>
      {label}
    </span>
  )
}

/** One vital: rating, latest value, 30-day trend, sources, data table and a log form. */
export function VitalCard({ row }: { row: VitalRow }) {
  const vital = row.meta.type as RatedVitalType
  const { meta, latest, result, history } = row
  const spec = chartSpec(vital, history)
  const shown = latest ? formatReading(latest) : null
  const note = VITAL_NOTES[vital]
  const table = dailyLatest(history).slice(-30)

  return (
    <article aria-labelledby={`chart-${vital}`} className="flex flex-col gap-3 rounded-lg border border-line bg-panel p-4 sm:p-5">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 id={`chart-${vital}`} className="text-base font-semibold text-fg">
            {meta.label}
          </h2>
          <p className="text-sm text-fg-faint">{meta.method}</p>
        </div>
        <StatusChip result={result} title={result.detail} />
      </header>

      {shown && latest && (
        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <span className="readout text-3xl font-medium text-fg">{shown.value}</span>
          <span className="text-fg-muted">{shown.unit}</span>
          <span className="readout text-sm text-fg-faint">
            Day {latest.missionDay}, {timeOf(latest.timestamp)}
            {!latest.simulated && ' (logged)'}
          </span>
        </div>
      )}
      <p className="text-sm text-fg-muted">{result.detail}</p>

      {(vital === 'bloodPressure' || vital === 'hrv') && (
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-fg-muted" aria-hidden>
          {vital === 'bloodPressure' ? (
            <>
              <Key label="Systolic" />
              <Key label="Diastolic" dash="6 3" muted />
            </>
          ) : (
            <>
              <Key label="Daily RMSSD" />
              <Key label="7-day mean (rated)" dash="6 3" muted />
              <Key label="Baseline, days 1-14" dash="2 3" muted />
            </>
          )}
        </div>
      )}

      {vital === 'visionCheck' ? (
        <VisionStrip history={history} />
      ) : (
        <TrendChart vital={vital} history={history} spec={spec} unit={meta.unit} label={meta.label} />
      )}

      {note && <p className="rounded-md border border-line bg-raised px-3 py-2 text-sm text-fg-muted">{note}</p>}

      <div className="flex flex-wrap gap-x-2">
        <Disclosure label="Threshold sources">
          <ThresholdSources vital={vital} />
        </Disclosure>
        <Disclosure label="Data table" icon={false}>
          <div className="max-h-56 overflow-auto rounded-md border border-line">
            <table className="w-full text-sm">
              <caption className="sr-only">{meta.label}, latest reading per mission day</caption>
              <thead className="sticky top-0 bg-raised text-left text-fg-muted">
                <tr>
                  <th scope="col" className="px-3 py-1.5 font-medium">Day</th>
                  <th scope="col" className="px-3 py-1.5 font-medium">Value ({meta.unit})</th>
                </tr>
              </thead>
              <tbody className="readout">
                {table.map((r) => (
                  <tr key={r.id} className="border-t border-line">
                    <td className="px-3 py-1 text-fg-muted">{r.missionDay}</td>
                    <td className="px-3 py-1 text-fg">{formatReading(r).value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Disclosure>
      </div>

      <Disclosure label={vital === 'visionCheck' ? 'Answer today’s vision check' : `Log ${meta.label.toLowerCase()} reading`} icon={false}>
        {vital === 'visionCheck' ? <VisionCheckForm /> : <LogReadingForm vital={vital} label={meta.label} unit={meta.unit} />}
      </Disclosure>
    </article>
  )
}
