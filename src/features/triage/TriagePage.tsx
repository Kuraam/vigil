import { ArrowLeft, Sun } from 'lucide-react'
import { useSearchParams } from 'react-router'
import { PageHeader } from '../../components/PageHeader'
import { SimulatedTag } from '../../components/SimulatedTag'
import { StatusChip } from '../../components/StatusChip'
import { PROTOCOLS } from '../../data/protocols'
import { buildAlerts, sortAlerts, type Alert } from '../../lib/alerts'
import { escalationFor } from '../../lib/escalation'
import { missionLabel, missionNowMs } from '../../lib/missionTime'
import { findResumable, progress, startRun } from '../../lib/protocolRun'
import { useVigilStore } from '../../lib/store'
import { useMissionHealth } from '../../lib/useCrewHealth'
import { ProtocolRunner } from './ProtocolRunner'

const segBtn = (on: boolean) =>
  `h-11 cursor-pointer px-4 text-sm transition-colors ${on ? 'bg-raised text-fg' : 'text-fg-muted hover:text-fg'}`

export function TriagePage() {
  const { all, selected, environmentId, missionDay } = useMissionHealth()
  const runs = useVigilStore((s) => s.runs)
  const saveRun = useVigilStore((s) => s.saveRun)
  const speWarning = useVigilStore((s) => s.speWarning)
  const setSpeWarning = useVigilStore((s) => s.setSpeWarning)
  const [params, setParams] = useSearchParams()
  const view = params.get('view') === 'crew-all' ? 'crew-all' : 'crew'
  const runId = params.get('run')
  const nowIso = new Date(missionNowMs(missionDay)).toISOString()

  // Cheap to compute: a few dozen indicators across four crew members.
  const crews = view === 'crew-all' ? Object.values(all) : [selected]
  const alerts = sortAlerts(crews.flatMap((h) => buildAlerts(h, { speWarning, now: nowIso })))

  const run = runs.find((r) => r.id === runId)
  const runHealth = run ? all[run.crewId] : undefined
  const runAlert = run ? sortAlerts(buildAlerts(all[run.crewId], { speWarning, now: nowIso })).find((a) => a.key === run.alertKey) : undefined

  const open = (a: Alert) => {
    if (!a.protocolId) return
    const existing = findResumable(runs, a.crewId, a.protocolId)
    const r = existing ?? startRun(a.protocolId, a.crewId, a.key, nowIso)
    if (!existing) saveRun(r)
    setParams({ ...(view === 'crew-all' ? { view } : {}), run: r.id })
  }
  const close = () => setParams(view === 'crew-all' ? { view } : {})
  const esc = escalationFor(environmentId)

  return (
    <div className="space-y-6">
      <PageHeader
        title="Triage"
        description="Alerts from the latest readings, most urgent first. Open one to work through its guided protocol."
        aside={<SimulatedTag />}
      />

      <div className="flex flex-wrap items-center gap-3">
        <div role="group" aria-label="Whose alerts" className="inline-flex overflow-hidden rounded-md border border-line-strong">
          <button type="button" aria-pressed={view === 'crew'} onClick={() => setParams({})} className={segBtn(view === 'crew')}>
            {selected.crew?.name ?? 'Selected crew member'}
          </button>
          <button type="button" aria-pressed={view === 'crew-all'} onClick={() => setParams({ view: 'crew-all' })} className={`${segBtn(view === 'crew-all')} border-l border-line-strong`}>
            Whole crew
          </button>
        </div>
        <button
          type="button"
          aria-pressed={speWarning}
          onClick={() => setSpeWarning(!speWarning)}
          className={`inline-flex h-11 cursor-pointer items-center gap-2 rounded-md border px-3 text-sm ${speWarning ? 'border-action text-fg' : 'border-line-strong text-fg-muted hover:text-fg'}`}
        >
          <Sun aria-hidden className="size-4" />
          Solar particle event warning (demo): {speWarning ? 'on' : 'off'}
        </button>
        <span className="text-sm text-fg-muted">
          Escalation here: <span className="text-fg">{esc.modeLabel}</span>, Earth reply in <span className="readout text-fg">{esc.replyEta}</span>
        </span>
      </div>

      <div className={`grid gap-6 ${run ? 'xl:grid-cols-[minmax(0,24rem)_minmax(0,1fr)]' : ''}`}>
        <section aria-labelledby="queue-heading" className={`rounded-lg border border-line bg-panel ${run ? 'hidden xl:block' : ''}`}>
          <h2 id="queue-heading" className="px-4 pt-4 pb-3 text-base font-semibold text-fg sm:px-5">
            Alert queue <span className="readout font-normal text-fg-muted">({alerts.length})</span>
          </h2>
          {alerts.length === 0 ? (
            <p className="border-t border-line px-4 py-4 text-fg-muted sm:px-5">No watch or action readings right now.</p>
          ) : (
            <ol className="divide-y divide-line border-t border-line">
              {alerts.map((a) => {
                const resumable = a.protocolId ? findResumable(runs, a.crewId, a.protocolId) : undefined
                const p = resumable && a.protocolId ? progress(resumable, PROTOCOLS[a.protocolId]) : undefined
                const isOpen = run?.alertKey === a.key
                return (
                  <li key={a.key} className={`px-4 py-3 sm:px-5 ${isOpen ? 'bg-raised' : ''}`} data-testid={`alert-${a.key}`}>
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h3 className="font-medium text-fg">
                          {a.label}
                          {view === 'crew-all' && <span className="font-normal text-fg-muted"> · {a.crewName}</span>}
                        </h3>
                        <p className="readout text-lg text-fg">{a.value}</p>
                      </div>
                      <StatusChip result={a.result} title={a.result.detail} />
                    </div>
                    <p className="mt-1 text-sm text-fg-muted">Threshold: {a.result.detail}</p>
                    <p className="text-xs text-fg-faint">Source: {a.sources.join('; ')}</p>
                    {a.indicator !== 'radiation' && a.indicator !== 'spe' && a.indicator !== 'exerciseAdherence' && (
                      <p className="readout text-xs text-fg-faint">Reading taken {missionLabel(a.at)}</p>
                    )}
                    <div className="mt-2">
                      {a.protocolId ? (
                        <button
                          type="button"
                          onClick={() => open(a)}
                          className="h-11 cursor-pointer rounded-md border border-accent px-3 text-sm font-medium text-fg hover:bg-accent hover:text-accent-ink"
                        >
                          {resumable ? `Resume protocol (${p?.done}/${p?.total})` : 'Start protocol'}: {PROTOCOLS[a.protocolId].title}
                        </button>
                      ) : (
                        <p className="text-sm text-fg-muted">No VIGIL protocol for this alert. {esc.lines[0]}</p>
                      )}
                    </div>
                  </li>
                )
              })}
            </ol>
          )}
        </section>

        {run && runHealth && (
          <div className="min-w-0 space-y-3">
            <button type="button" onClick={close} className="inline-flex h-11 cursor-pointer items-center gap-2 rounded-md px-2 text-sm text-fg-muted hover:text-fg">
              <ArrowLeft aria-hidden className="size-4" /> Back to alert queue
            </button>
            <ProtocolRunner
              run={run}
              def={PROTOCOLS[run.protocolId]}
              alert={runAlert}
              health={runHealth}
              environmentId={environmentId}
              missionDay={missionDay}
            />
          </div>
        )}
      </div>
    </div>
  )
}
