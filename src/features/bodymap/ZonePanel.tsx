import { ExternalLink } from 'lucide-react'
import { Link } from 'react-router'
import { HAZARD_ICON } from '../../components/hazardIcons'
import { StatusChip } from '../../components/StatusChip'
import { environmentEffects, type ZoneInfo } from '../../data/bodyZones'
import { getEnvironment } from '../../data/environments'
import { getHazard } from '../../data/hazards'
import { RESEARCH } from '../../data/research'
import { SOURCES } from '../../data/sources'
import { VITAL_META } from '../../data/vitals'
import { formatReading, MODALITY_LABEL } from '../../lib/format'
import type { VitalRow } from '../../lib/useCrewHealth'
import type { EnvironmentId, ImagingReading, StatusResult, VitalType } from '../../types'
import type { DoseSummary } from '../../lib/radiation'

const linkCls = 'text-accent underline decoration-accent/40 underline-offset-2 hover:decoration-accent'

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="border-t border-line px-4 py-4 sm:px-5">
      <h3 className="mb-2 font-semibold text-fg">{title}</h3>
      {children}
    </section>
  )
}

/** Everything about one zone: what it does, NASA HRP risks, hazards, linked vitals, environment, imaging. */
export function ZonePanel({
  zone,
  status,
  byVital,
  dose,
  exercise,
  environmentId,
}: {
  zone: ZoneInfo
  status: StatusResult
  byVital: Record<VitalType, VitalRow>
  dose: DoseSummary
  exercise: { sessions: number; result: StatusResult }
  environmentId: EnvironmentId
}) {
  const env = getEnvironment(environmentId)
  const imaging = byVital.imagingLog.history
    .filter((r): r is ImagingReading => r.kind === 'imaging' && zone.imaging.includes(r.modality))
    .reverse()
  const research = RESEARCH.filter((r) => r.zones.includes(zone.id))

  return (
    <section aria-labelledby="zone-heading" aria-live="polite" className="rounded-lg border border-line bg-panel">
      <header className="flex flex-wrap items-start justify-between gap-3 px-4 pt-4 pb-3 sm:px-5">
        <div className="min-w-0">
          <h2 id="zone-heading" className="text-xl font-semibold text-fg">
            {zone.name}
          </h2>
          <p className="mt-1 text-fg-muted">{zone.does}</p>
        </div>
        <StatusChip result={status} title={status.detail} />
      </header>

      <Section title="Linked readings">
        {zone.indicators.length === 0 ? (
          <p className="text-sm text-fg-muted">{zone.untrackedNote}</p>
        ) : (
          <ul className="space-y-2">
            {zone.indicators.map((ind) => {
              if (ind === 'exerciseAdherence')
                return (
                  <li key={ind} className="flex items-center justify-between gap-3">
                    <span className="text-fg">Exercise adherence</span>
                    <span className="flex items-center gap-3">
                      <span className="readout text-fg">{exercise.sessions} of 7 days</span>
                      <StatusChip result={exercise.result} title={exercise.result.detail} />
                    </span>
                  </li>
                )
              if (ind === 'radiation')
                return (
                  <li key={ind} className="flex items-center justify-between gap-3">
                    <span className="text-fg">Radiation dose</span>
                    <span className="flex items-center gap-3">
                      <span className="readout text-fg">{dose.cumulative.toFixed(1)} mSv</span>
                      <StatusChip result={dose.status} title={dose.status.detail} />
                    </span>
                  </li>
                )
              const row = byVital[ind]
              const shown = row.latest ? formatReading(row.latest) : null
              return (
                <li key={ind} className="flex items-center justify-between gap-3">
                  <span className="text-fg">{VITAL_META[ind].label}</span>
                  <span className="flex items-center gap-3">
                    <span className="readout text-fg">{shown ? `${shown.value} ${shown.unit}` : 'No data'}</span>
                    <StatusChip result={row.result} title={row.result.detail} />
                  </span>
                </li>
              )
            })}
          </ul>
        )}
        <p className="mt-3 text-sm">
          <Link to="/vitals" className={linkCls}>
            Open Vitals to see trends or log a reading
          </Link>
        </p>
      </Section>

      {zone.id === 'eyes' && (
        <Section title="What is SANS?">
          <p className="text-sm text-fg-muted">
            Spaceflight Associated Neuro-ocular Syndrome (SANS) is NASA’s name for changes to the eyes and the nerve behind
            them that are linked to spaceflight. NASA is still researching ways to prevent it, so log every eye scan here
            and keep it for review by people on the ground.
          </p>
        </Section>
      )}

      {zone.imaging.length > 0 && (
        <Section title="Imaging log">
          {imaging.length === 0 ? (
            <p className="text-sm text-fg-muted">No {zone.imaging.map((m) => MODALITY_LABEL[m].toLowerCase()).join(' or ')} logged yet.</p>
          ) : (
            <ul className="space-y-1.5 text-sm">
              {imaging.slice(0, 4).map((r) => (
                <li key={r.id} className="flex gap-3">
                  <span className="readout shrink-0 text-fg-muted">Day {r.missionDay}</span>
                  <span className="text-fg">{MODALITY_LABEL[r.modality]}</span>
                  <span className="truncate text-fg-muted">{r.finding}</span>
                </li>
              ))}
            </ul>
          )}
          <p className="mt-2 text-sm">
            <Link to="/vitals#imaging-heading" className={linkCls}>
              Open the full imaging log
            </Link>
          </p>
        </Section>
      )}

      <Section title="NASA HRP risks">
        <ul className="space-y-2.5">
          {zone.risks.map((r) => (
            <li key={r.name}>
              <a href={r.url} target="_blank" rel="noreferrer" className={`inline-flex items-center gap-1 font-medium ${linkCls}`}>
                {r.name}
                <ExternalLink aria-hidden className="size-3.5" />
                <span className="sr-only">(opens NASA Risks of Human Spaceflight in a new tab)</span>
              </a>
              <p className="text-sm text-fg-muted">{r.description}</p>
            </li>
          ))}
        </ul>
      </Section>

      <Section title="Hazards that affect it">
        <ul className="space-y-2.5">
          {zone.hazards.map((h) => {
            const Icon = HAZARD_ICON[h.hazard]
            return (
              <li key={h.hazard + h.how} className="flex gap-2.5">
                <Icon aria-hidden className="mt-0.5 size-4 shrink-0 text-fg-muted" />
                <p className="text-sm">
                  <span className="font-medium text-fg">{getHazard(h.hazard).name}: </span>
                  <span className="text-fg-muted">{h.how}</span>
                </p>
              </li>
            )
          })}
        </ul>
      </Section>

      <Section title={`In this environment: ${env.name}`}>
        <ul className="list-disc space-y-1 pl-5 text-sm text-fg-muted" data-testid="zone-environment">
          {environmentEffects(zone, environmentId, env.commDelay.label).map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
      </Section>

      {research.length > 0 && (
        <Section title="Related NASA research">
          <ul className="space-y-2">
            {research.map((r) => (
              <li key={r.id} className="text-sm">
                <span className="font-medium text-fg">{r.name}</span>
                <span className="ml-2 inline-block rounded border border-line-strong px-1.5 text-xs text-fg-muted">{r.status}</span>
                <p className="text-fg-muted">{r.description}</p>
              </li>
            ))}
          </ul>
        </Section>
      )}

      <p className="border-t border-line px-4 py-3 text-xs text-fg-faint sm:px-5">
        Sources:{' '}
        <a href={SOURCES.hrpRisks.url} target="_blank" rel="noreferrer" className="underline underline-offset-2 hover:text-fg">
          {SOURCES.hrpRisks.label}
        </a>
        ;{' '}
        <a href={SOURCES.hrpHazards.url} target="_blank" rel="noreferrer" className="underline underline-offset-2 hover:text-fg">
          {SOURCES.hrpHazards.label}
        </a>
        {research.length > 0 && (
          <>
            ;{' '}
            <a href={SOURCES.hrpResearch.url} target="_blank" rel="noreferrer" className="underline underline-offset-2 hover:text-fg">
              {SOURCES.hrpResearch.label}
            </a>
          </>
        )}
        .
      </p>
    </section>
  )
}
