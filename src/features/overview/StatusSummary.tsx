import { STATUS_STYLE } from '../../components/statusStyle'
import type { Status } from '../../types'

const ROWS: { status: Status; label: string; meaning: string }[] = [
  { status: 'nominal', label: 'Nominal', meaning: 'Inside its sourced range' },
  { status: 'watch', label: 'Watch', meaning: 'Outside nominal, recheck soon' },
  { status: 'action', label: 'Action', meaning: 'Outside the watch range, act now' },
  { status: 'nodata', label: 'No data', meaning: 'No reading, or not assessed yet' },
]

/** Count of vitals in each status. Doubles as the legend for the status palette. */
export function StatusSummary({ counts }: { counts: Record<Status, number> }) {
  return (
    <section aria-labelledby="summary-heading" className="rounded-lg border border-line bg-panel">
      <h2 id="summary-heading" className="px-4 pt-4 text-base font-semibold text-fg sm:px-5">
        Status summary
      </h2>
      <dl className="grid grid-cols-1 gap-px p-px sm:grid-cols-2 2xl:grid-cols-4">
        {ROWS.map(({ status, label, meaning }) => {
          const { icon: Icon, text: color } = STATUS_STYLE[status]
          return (
            <div key={status} className="flex items-start gap-3 px-4 py-3 sm:px-5">
              <Icon aria-hidden className={`mt-0.5 size-5 shrink-0 ${color}`} strokeWidth={2.25} />
              <div className="min-w-0 flex-1">
                <dt className={`font-medium ${color}`}>{label}</dt>
                <dd className="text-sm text-fg-muted">{meaning}</dd>
              </div>
              <dd className="readout text-2xl leading-7 font-medium text-fg" aria-label={`${counts[status]} vitals`}>
                {counts[status]}
              </dd>
            </div>
          )
        })}
      </dl>
    </section>
  )
}
