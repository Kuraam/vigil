import { CheckCircle2, ExternalLink, OctagonAlert, RadioTower } from 'lucide-react'
import type { ReactNode } from 'react'
import { StatusChip } from '../../components/StatusChip'
import { getEnvironment } from '../../data/environments'
import { PROTOCOL_DISCLAIMER } from '../../data/protocols'
import { HRP_RISKS_URL } from '../../data/sources'
import { VITAL_META } from '../../data/vitals'
import type { Alert } from '../../lib/alerts'
import { escalationFor } from '../../lib/escalation'
import { formatReading } from '../../lib/format'
import type { CrewHealth } from '../../lib/health'
import { missionLabel, missionNowMs } from '../../lib/missionTime'
import { addMeasurement, answer, completeRun, phaseDone, progress, redFlagRaised, toggleStep } from '../../lib/protocolRun'
import { useVigilStore } from '../../lib/store'
import type { EnvironmentId, ProtocolDef, ProtocolPhase, ProtocolRun, RatedVitalType } from '../../types'
import { LogReadingForm } from '../vitals/LogReadingForm'

function Phase({ n, title, phase, run, def, children }: { n: number; title: string; phase: ProtocolPhase; run: ProtocolRun; def: ProtocolDef; children: ReactNode }) {
  const done = phaseDone(run, def, phase)
  return (
    <section aria-labelledby={`phase-${phase}`} className="border-t border-line px-4 py-4 sm:px-5">
      <h3 id={`phase-${phase}`} className="mb-3 flex items-center gap-2.5 font-semibold text-fg">
        <span aria-hidden className="readout grid size-7 place-items-center rounded-full border border-line-strong text-sm text-fg-muted">
          {n}
        </span>
        {title}
        {done && (
          <span className="inline-flex items-center gap-1 text-sm font-normal text-fg-muted">
            <CheckCircle2 aria-hidden className="size-4" /> Done
          </span>
        )}
      </h3>
      {children}
    </section>
  )
}

/** Checkbox with the mission time it was ticked. */
function StepCheck({ id, text, at, onToggle }: { id: string; text: string; at?: string; onToggle: (on: boolean) => void }) {
  return (
    <li>
      <label htmlFor={id} className="flex min-h-11 cursor-pointer items-start gap-3 rounded-md px-2 py-2 hover:bg-raised/60">
        <input id={id} type="checkbox" checked={Boolean(at)} onChange={(e) => onToggle(e.target.checked)} className="mt-0.5 size-5 shrink-0 cursor-pointer accent-[var(--color-accent)]" />
        <span className="min-w-0 flex-1">
          <span className="text-fg">{text}</span>
          {at && <span className="readout block text-xs text-fg-faint">Done {missionLabel(at)}</span>}
        </span>
      </label>
    </li>
  )
}

/** Runs one protocol for one crew member. Every change is saved to the store, so it can be resumed. */
export function ProtocolRunner({
  run,
  def,
  alert,
  health,
  environmentId,
  missionDay,
}: {
  run: ProtocolRun
  def: ProtocolDef
  alert: Alert | undefined
  health: CrewHealth
  environmentId: EnvironmentId
  missionDay: number
}) {
  const saveRun = useVigilStore((s) => s.saveRun)
  const now = () => new Date(missionNowMs(missionDay)).toISOString()
  const redFlag = redFlagRaised(run, def)
  const isAction = alert?.result.status === 'action'
  const esc = escalationFor(environmentId, { redFlag, action: isAction })
  const env = getEnvironment(environmentId)
  const { done, total } = progress(run, def)
  const steps = (phase: ProtocolPhase) => def.steps.filter((s) => s.phase === phase)
  const tick = (stepId: string) => (on: boolean) => saveRun(toggleStep(run, stepId, on ? now() : null))

  return (
    <article aria-labelledby="runner-heading" className="rounded-lg border border-line bg-panel">
      <header className="space-y-2 px-4 pt-4 pb-3 sm:px-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 id="runner-heading" className="text-xl font-semibold text-fg">
              {def.title}
            </h2>
            <p className="text-sm text-fg-muted">
              {health.crew?.name}. Started {missionLabel(run.startedAt)}.{' '}
              <span className="readout">
                {done}/{total}
              </span>{' '}
              items recorded.
            </p>
          </div>
          {alert ? (
            <StatusChip result={alert.result} title={alert.result.detail} />
          ) : (
            <span className="text-sm text-fg-muted">No longer alerting</span>
          )}
        </div>
        <p className="rounded-md border border-line-strong px-3 py-2 text-sm text-fg">{PROTOCOL_DISCLAIMER}</p>
        {redFlag && (
          <div role="alert" className="flex gap-2.5 rounded-md border border-action bg-action/12 px-3 py-2.5 text-fg">
            <OctagonAlert aria-hidden className="mt-0.5 size-5 shrink-0 text-action" />
            <p>
              <strong className="text-action">Red flag reported: escalate now.</strong> Go to step 4.
            </p>
          </div>
        )}
      </header>

      <Phase n={1} title="Confirm: re-measure correctly" phase="confirm" run={run} def={def}>
        <div className="space-y-3">
          <div>
            <p className="field-label">How to measure</p>
            <ul className="mt-1 list-disc space-y-0.5 pl-5 text-sm text-fg">
              {def.howToMeasure.map((h) => (
                <li key={h}>{h}</li>
              ))}
            </ul>
            {def.howToSource && <p className="mt-1 text-xs text-fg-faint">Source: {def.howToSource}</p>}
          </div>
          {def.notes.map((n) => (
            <p key={n.text} className="rounded-md border border-line bg-raised px-3 py-2 text-sm text-fg-muted">
              {n.text} <span className="text-fg-faint">({n.source})</span>
            </p>
          ))}
          {def.measure?.map((v: RatedVitalType) => {
            const row = health.byVital[v]
            const shown = row.latest ? formatReading(row.latest) : null
            return (
              <div key={v} className="space-y-2">
                <p className="flex flex-wrap items-center gap-3 text-sm" data-testid={`runner-current-${v}`}>
                  <span className="text-fg-muted">Current {VITAL_META[v].label.toLowerCase()}:</span>
                  <span className="readout text-fg">{shown ? `${shown.value} ${shown.unit}` : 'No data'}</span>
                  <StatusChip result={row.result} title={row.result.detail} />
                </p>
                <LogReadingForm
                  vital={v}
                  label={VITAL_META[v].label}
                  unit={VITAL_META[v].unit}
                  crewId={run.crewId}
                  onSaved={(reading, text) => saveRun(addMeasurement(run, reading.id, text, reading.timestamp))}
                />
              </div>
            )
          })}
          {run.measurements.length > 0 && (
            <ul className="space-y-0.5 text-sm text-fg-muted">
              {run.measurements.map((m) => (
                <li key={m.readingId}>
                  <span className="readout text-fg-faint">{missionLabel(m.at)}</span> Re-measured: {m.label}
                </li>
              ))}
            </ul>
          )}
          <ul>
            {steps('confirm').map((s) => (
              <StepCheck key={s.id} id={`${run.id}-${s.id}`} text={s.text} at={run.steps[s.id]} onToggle={tick(s.id)} />
            ))}
          </ul>
        </div>
      </Phase>

      <Phase n={2} title="Assess: symptoms" phase="assess" run={run} def={def}>
        {def.symptoms.length === 0 ? (
          <p className="text-sm text-fg-muted">No red-flag symptoms are listed for this protocol.</p>
        ) : (
          <ul className="space-y-1.5">
            {def.symptoms.map((s) => {
              const a = run.answers[s.id]
              return (
                <li key={s.id} className="flex flex-wrap items-center justify-between gap-2 rounded-md px-2 py-1.5">
                  <span className="min-w-0 flex-1 text-fg">
                    {s.redFlag && <span className="mr-1.5 rounded border border-action/60 px-1 text-xs text-action">Red flag</span>}
                    {s.text}
                    {a && <span className="readout block text-xs text-fg-faint">Answered {missionLabel(a.at)}</span>}
                  </span>
                  <span role="group" aria-label={s.text} className="flex gap-1.5">
                    {[false, true].map((yes) => (
                      <button
                        key={String(yes)}
                        type="button"
                        aria-pressed={a ? a.yes === yes : false}
                        onClick={() => saveRun(answer(run, s.id, yes, now()))}
                        className={`h-11 min-w-16 cursor-pointer rounded-md border px-3 text-sm ${
                          a && a.yes === yes ? (yes ? 'border-action bg-action/15 text-fg' : 'border-accent bg-raised text-fg') : 'border-line-strong text-fg-muted hover:text-fg'
                        }`}
                      >
                        {yes ? 'Yes' : 'No'}
                      </button>
                    ))}
                  </span>
                </li>
              )
            })}
          </ul>
        )}
      </Phase>

      <Phase n={3} title="Act: self-care and operations" phase="act" run={run} def={def}>
        <ul>
          {steps('act').map((s) => (
            <StepCheck key={s.id} id={`${run.id}-${s.id}`} text={s.text} at={run.steps[s.id]} onToggle={tick(s.id)} />
          ))}
        </ul>
        {def.related.length > 0 && (
          <p className="mt-2 text-sm text-fg-muted">
            Linked:{' '}
            {def.related.map((v) => {
              const row = health.byVital[v]
              const shown = row.latest ? formatReading(row.latest) : null
              return (
                <span key={v} className="mr-3">
                  {VITAL_META[v].label} <span className="readout text-fg">{shown ? `${shown.value} ${shown.unit}` : 'no data'}</span> ({row.result.status === 'nodata' ? 'no rating' : row.result.status})
                </span>
              )
            })}
          </p>
        )}
        {def.risks.length > 0 && (
          <p className="mt-2 text-sm text-fg-muted">
            NASA HRP risk:{' '}
            {def.risks.map((r) => (
              <a key={r} href={HRP_RISKS_URL} target="_blank" rel="noreferrer" className="mr-3 inline-flex items-center gap-1 text-accent underline underline-offset-2">
                {r}
                <ExternalLink aria-hidden className="size-3" />
              </a>
            ))}
          </p>
        )}
      </Phase>

      <Phase n={4} title="Escalate" phase="escalate" run={run} def={def}>
        <div className="space-y-2" data-testid="escalation">
          <p className="flex flex-wrap items-center gap-2 text-sm">
            <RadioTower aria-hidden className="size-4 text-fg-muted" />
            <span className="text-fg-muted">Earth reply ETA ({env.name}, round trip):</span>
            <span className="readout font-medium text-fg">{esc.replyEta}</span>
            <span className="rounded border border-line-strong px-1.5 text-xs text-fg">{esc.modeLabel}</span>
          </p>
          {esc.lines.map((l) => (
            <p key={l} className={`rounded-md border px-3 py-2 text-sm ${l.startsWith('Notify') ? 'border-action text-fg' : 'border-line bg-raised text-fg'}`}>
              {l}
            </p>
          ))}
          <ul>
            {steps('escalate').map((s) => (
              <StepCheck key={s.id} id={`${run.id}-${s.id}`} text={s.text} at={run.steps[s.id]} onToggle={tick(s.id)} />
            ))}
          </ul>
          <p className="text-xs text-fg-faint">Escalation rule: VIGIL triage rule (team-defined, not clinically validated).</p>
        </div>
      </Phase>

      <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-line px-4 py-3 sm:px-5">
        {run.completedAt ? (
          <p className="text-sm text-fg-muted">Completed {missionLabel(run.completedAt)}. It will appear in the Downlink brief.</p>
        ) : (
          <p className="text-sm text-fg-muted">Progress is saved as you go. Leave and come back to resume.</p>
        )}
        {!run.completedAt && (
          <button type="button" onClick={() => saveRun(completeRun(run, now()))} className="h-11 cursor-pointer rounded-md bg-accent px-4 font-medium text-accent-ink hover:opacity-90">
            Mark protocol complete
          </button>
        )}
      </footer>
    </article>
  )
}
