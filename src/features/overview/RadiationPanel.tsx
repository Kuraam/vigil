import { Radiation } from 'lucide-react'
import { Disclosure } from '../../components/Disclosure'
import { StatusChip } from '../../components/StatusChip'
import { STATUS_STYLE } from '../../components/statusStyle'
import { getEnvironment } from '../../data/environments'
import { DOSE_RATES, NEUTRON_NOTE, RADIATION_LIMITS } from '../../data/radiation'
import type { DoseSummary } from '../../lib/radiation'
import type { EnvironmentId } from '../../types'

const fmt = (n: number, dp = 1) => n.toFixed(dp)

/** Cumulative dose against the 600 mSv career limit, today's rate and days remaining for the selected environment. */
export function RadiationPanel({ dose, environmentId, missionDay }: { dose: DoseSummary; environmentId: EnvironmentId; missionDay: number }) {
  const limit = RADIATION_LIMITS.career.value
  const env = getEnvironment(environmentId)
  const rate = DOSE_RATES[environmentId]
  const pct = Math.min(dose.fraction, 1) * 100
  const { text: tone } = STATUS_STYLE[dose.status.status]
  const fill = { nominal: 'bg-nominal', watch: 'bg-watch', action: 'bg-action', nodata: 'bg-nodata' }[dose.status.status]

  return (
    <section aria-labelledby="radiation-heading" className="rounded-lg border border-line bg-panel">
      <div className="flex items-start justify-between gap-3 px-4 pt-4 sm:px-5">
        <div>
          <h2 id="radiation-heading" className="flex items-center gap-2 text-base font-semibold text-fg">
            <Radiation aria-hidden className="size-5 text-fg-muted" />
            Radiation dose
          </h2>
          <p className="mt-0.5 text-sm text-fg-muted">Career total against the {limit} mSv limit.</p>
        </div>
        <StatusChip result={dose.status} title={dose.status.detail} />
      </div>

      <div className="px-4 pt-4 sm:px-5">
        <p className="flex items-baseline gap-2">
          <span className={`readout text-4xl leading-10 font-medium ${tone}`}>{fmt(dose.cumulative)}</span>
          <span className="text-fg-muted">mSv of {limit}</span>
        </p>
        <div
          role="meter"
          aria-label="Career radiation dose"
          aria-valuemin={0}
          aria-valuemax={limit}
          aria-valuenow={Number(fmt(dose.cumulative))}
          aria-valuetext={`${fmt(dose.cumulative)} mSv of ${limit} mSv, ${Math.round(dose.fraction * 100)}%. ${dose.status.detail}`}
          className="relative mt-2 h-3 overflow-hidden rounded-full bg-line"
        >
          <div className={`h-full ${fill}`} style={{ width: `${pct}%` }} />
          {/* 50% and 80% marks: where watch and action begin (team rule). */}
          <span aria-hidden className="absolute inset-y-0 left-1/2 w-px bg-fg-faint" />
          <span aria-hidden className="absolute inset-y-0 left-[80%] w-px bg-fg-faint" />
        </div>
        <div aria-hidden className="readout mt-1 flex justify-between text-[11px] text-fg-faint">
          <span>0</span>
          <span className="pl-6">300</span>
          <span className="pl-10">480</span>
          <span>{limit}</span>
        </div>
        <p className="mt-2 text-sm text-fg-muted">
          Prior career <span className="readout text-fg">{fmt(dose.priorDose, 0)}</span> mSv plus this mission{' '}
          <span className="readout text-fg">{fmt(dose.missionDose)}</span> mSv ({missionDay} days in transit, simulated).
        </p>
      </div>

      <dl className="mt-4 grid grid-cols-2 gap-px border-y border-line bg-line">
        <div className="bg-panel px-4 py-3 sm:px-5">
          <dt className="field-label">Today’s rate, {env.name}</dt>
          <dd className="readout mt-0.5 text-xl text-fg" data-testid="dose-rate">
            {fmt(rate.rate.value, 2)} <span className="text-sm text-fg-muted">mSv/day</span>
          </dd>
          {rate.range && (
            <dd className="text-xs text-fg-faint">
              Published range {rate.range[0]}-{rate.range[1]} mSv/day
            </dd>
          )}
        </div>
        <div className="bg-panel px-4 py-3 sm:px-5">
          <dt className="field-label">Days left at this rate</dt>
          <dd className="readout mt-0.5 text-xl text-fg" data-testid="dose-days">
            {Math.floor(dose.daysRemaining).toLocaleString('en-US')} <span className="text-sm text-fg-muted">days</span>
          </dd>
          <dd className="text-xs text-fg-faint">before the career limit</dd>
        </div>
      </dl>

      <div className="space-y-2 px-4 py-3 text-sm sm:px-5">
        <p className="text-fg-muted">
          Solar particle event limit: <span className="readout text-fg">{RADIATION_LIMITS.solarParticleEvent.value}</span> mSv per event.
        </p>
        <p className="text-fg-muted">{NEUTRON_NOTE.text}</p>
        <Disclosure label="Radiation sources">
          <ul className="space-y-1 rounded-md border border-line bg-bg/60 p-3 text-sm text-fg-muted">
            <li>Career limit: {RADIATION_LIMITS.career.source}</li>
            <li>Solar particle event limit: {RADIATION_LIMITS.solarParticleEvent.source}</li>
            <li>Transit rate 1.84 mSv/day: {DOSE_RATES['spacecraft-transit'].rate.source}</li>
            <li>Mars surface rate 0.64 mSv/day: {DOSE_RATES['surface-base'].rate.source}</li>
            <li>Orbital Station rate 0.35 mSv/day (range 0.2-0.5): {DOSE_RATES['orbital-station'].rate.source}</li>
            <li>Status bands (50% and 80% of the limit): {RADIATION_LIMITS.watchAtFraction.source}</li>
            <li>Neutron note: {NEUTRON_NOTE.source.label}</li>
            <li>Prior career dose: simulated, seeded 40-200 mSv</li>
          </ul>
        </Disclosure>
      </div>
    </section>
  )
}
