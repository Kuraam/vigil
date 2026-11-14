import { Award, Check, Lock } from 'lucide-react'
import { Link } from 'react-router'
import { Disclosure } from '../../components/Disclosure'
import { HAZARD_ICON } from '../../components/hazardIcons'
import { PageHeader } from '../../components/PageHeader'
import { SimulatedTag } from '../../components/SimulatedTag'
import { CREW } from '../../data/crew'
import { getEnvironment } from '../../data/environments'
import { getHazard } from '../../data/hazards'
import { HAZARD_PRIORITY } from '../../data/priorities'
import { RESEARCH } from '../../data/research'
import { ROUTINE_TASKS } from '../../data/routineTasks'
import { SOURCES } from '../../data/sources'
import { missionLabel, missionNowMs } from '../../lib/missionTime'
import {
  adherence7,
  bestStreak,
  coreComplete,
  crewStreak,
  isDone,
  milestones,
  personalStreak,
  tasksByPriority,
  totalPoints,
} from '../../lib/routine'
import { useVigilStore } from '../../lib/store'
import { useMissionHealth } from '../../lib/useCrewHealth'
import type { RoutineTask } from '../../types'
import { VisionCheckForm } from '../vitals/VisionCheck'

function Stat({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div className="bg-panel px-4 py-3 sm:px-5">
      <dt className="field-label">{label}</dt>
      <dd className="readout mt-0.5 text-2xl font-medium text-fg">{value}</dd>
      {sub && <dd className="text-xs text-fg-faint">{sub}</dd>}
    </div>
  )
}

export function RoutinePage() {
  const { crewId, environmentId, missionDay, routine, selected } = useMissionHealth()
  const log = useVigilStore((s) => s.routine)
  const setTask = useVigilStore((s) => s.setTask)
  const today = missionDay
  const env = getEnvironment(environmentId)
  const topHazard = HAZARD_PRIORITY[environmentId][0].hazard
  const tasks = tasksByPriority(environmentId)
  const bar = adherence7(crewId, today, routine)
  const doneToday = ROUTINE_TASKS.filter((t) => isDone(t.id, crewId, today, routine))
  const pointsToday = doneToday.reduce((a, t) => a + t.points, 0)

  const toggle = (t: RoutineTask, on: boolean) =>
    setTask(crewId, today, t.id, on ? new Date(missionNowMs(missionDay)).toISOString() : null)

  return (
    <div className="space-y-6">
      <PageHeader
        title="Routine"
        description={`${selected.crew?.name ?? 'Crew member'}: today’s countermeasures for mission day ${today}, ordered for ${env.name}.`}
        aside={<SimulatedTag>Simulated routine history</SimulatedTag>}
      />

      <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-line bg-line md:grid-cols-4">
        <Stat label="Points today" value={pointsToday} sub={`${totalPoints(crewId, today, routine).toLocaleString('en-US')} in total`} />
        <Stat label="Personal streak" value={`${personalStreak(crewId, today, routine)} d`} sub={`Best ${bestStreak(crewId, today, routine)} days`} />
        <Stat label="Crew streak" value={`${crewStreak(today, routine)} d`} sub="All crew, all core tasks" />
        <Stat label="Exercise, last 7 days" value={`${selected.exercise.sessions}/7`} sub={selected.exercise.result.detail} />
      </dl>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_24rem]">
        <section aria-labelledby="today-heading" className="rounded-lg border border-line bg-panel">
          <div className="px-4 pt-4 sm:px-5">
            <h2 id="today-heading" className="text-base font-semibold text-fg">
              Today’s checklist
            </h2>
            <p className="mt-0.5 text-sm text-fg-muted">
              Priority today follows the top hazard for {env.name}: <span className="text-fg">{getHazard(topHazard).name}</span>.
              {!tasks.some((t) => t.hazard === topHazard) && ' It has no daily task; it is managed through shielding and dose tracking on the Overview.'}
            </p>
          </div>
          <ul className="mt-3 divide-y divide-line border-t border-line" data-testid="routine-checklist">
            {tasks.map((t) => {
              const done = isDone(t.id, crewId, today, routine)
              const at = log[crewId]?.[today]?.[t.id]
              const Icon = HAZARD_ICON[t.hazard]
              const id = `task-${t.id}`
              return (
                <li key={t.id} className="px-4 py-3 sm:px-5">
                  <div className="flex items-start gap-3">
                    {t.derived ? (
                      <span
                        aria-hidden
                        className={`mt-0.5 grid size-5 shrink-0 place-items-center rounded border ${done ? 'border-accent bg-accent text-accent-ink' : 'border-line-strong'}`}
                      >
                        {done && <Check className="size-3.5" strokeWidth={3} />}
                      </span>
                    ) : (
                      <input id={id} type="checkbox" checked={done} onChange={(e) => toggle(t, e.target.checked)} className="mt-0.5 size-5 shrink-0 cursor-pointer accent-[var(--color-accent)]" />
                    )}
                    <div className="min-w-0 flex-1">
                      <label htmlFor={t.derived ? undefined : id} className={`font-medium text-fg ${t.derived ? '' : 'cursor-pointer'}`}>
                        {t.label}
                        {!t.core && <span className="ml-2 text-xs font-normal text-fg-faint">bonus</span>}
                        <span className="sr-only">{done ? ' (done)' : ' (not done)'}</span>
                      </label>
                      <p className="text-sm text-fg-muted">{t.detail}</p>
                      <p className="mt-0.5 flex flex-wrap items-center gap-x-3 text-xs text-fg-faint">
                        <span className="inline-flex items-center gap-1">
                          <Icon aria-hidden className="size-3.5" /> {getHazard(t.hazard).name}
                        </span>
                        <span className="readout">+{t.points} pts</span>
                        {at && <span className="readout">Done {missionLabel(at)}</span>}
                      </p>
                      {t.id === 'vitals' && !done && (
                        <Link to="/vitals" className="mt-1 inline-flex min-h-11 items-center text-sm text-accent underline underline-offset-2">
                          Open the log forms on Vitals
                        </Link>
                      )}
                      {t.id === 'vision' && !done && (
                        <div className="mt-2">
                          <Disclosure label="Answer the vision check" icon={false}>
                            <VisionCheckForm />
                          </Disclosure>
                        </div>
                      )}
                    </div>
                  </div>
                </li>
              )
            })}
          </ul>
        </section>

        <div className="min-w-0 space-y-6">
          <section aria-labelledby="adherence-heading" className="rounded-lg border border-line bg-panel p-4 sm:p-5">
            <h2 id="adherence-heading" className="text-base font-semibold text-fg">
              7-day adherence
            </h2>
            <p className="text-sm text-fg-muted">Core tasks done per day.</p>
            <ol className="mt-3 flex h-28 items-end gap-2" aria-label="Core tasks done per day, last 7 days">
              {bar.map((d) => (
                <li key={d.day} className="flex flex-1 flex-col items-center gap-1">
                  <span className="readout text-xs text-fg-muted">
                    {d.done}/{d.total}
                  </span>
                  <span className="flex h-16 w-full items-end rounded-sm bg-line">
                    <span className="w-full rounded-sm bg-fg-muted" style={{ height: `${(d.done / d.total) * 100}%` }} />
                  </span>
                  <span className="readout text-[11px] text-fg-faint">D{d.day}</span>
                  <span className="sr-only">
                    Day {d.day}: {d.done} of {d.total} core tasks
                  </span>
                </li>
              ))}
            </ol>
          </section>

          <section aria-labelledby="milestones-heading" className="rounded-lg border border-line bg-panel p-4 sm:p-5">
            <h2 id="milestones-heading" className="text-base font-semibold text-fg">
              Milestones
            </h2>
            <ul className="mt-2 space-y-1.5">
              {milestones(crewId, today, routine).map((m) => (
                <li key={m.id} className="flex items-center gap-2.5 text-sm">
                  {m.achieved ? <Award aria-hidden className="size-4 text-accent" /> : <Lock aria-hidden className="size-4 text-fg-faint" />}
                  <span className={m.achieved ? 'text-fg' : 'text-fg-faint'}>{m.label}</span>
                  <span className="sr-only">{m.achieved ? 'achieved' : 'not yet'}</span>
                </li>
              ))}
            </ul>
          </section>

          <section aria-labelledby="crew-heading" className="rounded-lg border border-line bg-panel p-4 sm:p-5">
            <h2 id="crew-heading" className="text-base font-semibold text-fg">
              Crew today
            </h2>
            <table className="mt-2 w-full text-sm">
              <caption className="sr-only">Core tasks done today and personal streak per crew member</caption>
              <thead className="text-left text-fg-faint">
                <tr>
                  <th scope="col" className="py-1 font-medium">Crew</th>
                  <th scope="col" className="py-1 font-medium">Today</th>
                  <th scope="col" className="py-1 font-medium">Streak</th>
                </tr>
              </thead>
              <tbody className="readout">
                {CREW.map((c) => (
                  <tr key={c.id} className="border-t border-line">
                    <td className="py-1.5 font-sans text-fg">{c.name}</td>
                    <td className="py-1.5 text-fg-muted">
                      {adherence7(c.id, today, routine)[6].done}/{adherence7(c.id, today, routine)[6].total}
                      {coreComplete(c.id, today, routine) && ' done'}
                    </td>
                    <td className="py-1.5 text-fg-muted">{personalStreak(c.id, today, routine)} d</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>

          <section aria-labelledby="research-heading" className="rounded-lg border border-dashed border-line-strong bg-panel p-4 sm:p-5">
            <h2 id="research-heading" className="text-base font-semibold text-fg">
              NASA research in progress
            </h2>
            <p className="text-sm text-fg-muted">For interest only. These are investigations, not proven treatments.</p>
            <ul className="mt-2 space-y-2">
              {RESEARCH.map((r) => (
                <li key={r.id} className="text-sm">
                  <span className="font-medium text-fg">{r.name}</span>
                  <span className="ml-2 inline-block rounded border border-line-strong px-1.5 text-xs text-fg-muted">{r.status}</span>
                  <p className="text-fg-muted">{r.description}</p>
                </li>
              ))}
            </ul>
            <a href={SOURCES.hrpResearch.url} target="_blank" rel="noreferrer" className="mt-2 inline-block text-xs text-fg-faint underline underline-offset-2">
              Source: {SOURCES.hrpResearch.label}
            </a>
          </section>
        </div>
      </div>
    </div>
  )
}
