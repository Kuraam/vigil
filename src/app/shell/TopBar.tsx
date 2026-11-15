import { ListChecks } from 'lucide-react'
import { Link } from 'react-router'
import { CREW } from '../../data/crew'
import { ENVIRONMENTS, getEnvironment } from '../../data/environments'
import { escalationFor } from '../../lib/escalation'
import { latestMissionDay } from '../../lib/readings'
import { dueTasks } from '../../lib/routine'
import { useMissionHealth } from '../../lib/useCrewHealth'
import { useVigilStore } from '../../lib/store'
import type { EnvironmentId } from '../../types'
import { CommDelay } from './CommDelay'
import { ConnectionBadge } from './ConnectionBadge'
import { CrewAlertIndicator } from './CrewAlertIndicator'
import { MissionClock } from './MissionClock'
import { SelectField } from './SelectField'
import { ThemeToggle } from './ThemeToggle'

function Wordmark() {
  return (
    <div className="flex items-center gap-2.5">
      <svg aria-hidden viewBox="0 0 32 32" className="size-8">
        <rect width="32" height="32" rx="6" className="fill-raised" />
        <path d="M7 9l9 15 9-15" fill="none" className="stroke-accent" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <div className="leading-tight">
        <div className="text-lg font-semibold tracking-[0.18em] text-fg">VIGIL</div>
        <div className="hidden text-xs text-fg-faint 2xl:block">Crew health console</div>
      </div>
    </div>
  )
}

export function TopBar() {
  const crewId = useVigilStore((s) => s.crewId)
  const environmentId = useVigilStore((s) => s.environmentId)
  const readings = useVigilStore((s) => s.readings)
  const setCrew = useVigilStore((s) => s.setCrew)
  const setEnvironment = useVigilStore((s) => s.setEnvironment)
  const environment = getEnvironment(environmentId)
  const { routine, missionDay } = useMissionHealth()
  const due = dueTasks(crewId, missionDay, routine).length
  const esc = escalationFor(environmentId)

  return (
    <header className="border-b border-line bg-panel print:hidden">
      <div className="flex flex-wrap items-end gap-x-3 gap-y-4 px-4 py-3 sm:px-6 2xl:gap-x-8">
        {/* Connection badge sits above the wordmark and clock, using height the top bar already has. */}
        <div className="flex flex-col gap-1.5">
          <ConnectionBadge />
          <div className="flex items-end gap-x-3 2xl:gap-x-8">
            <Wordmark />
            <MissionClock missionDay={latestMissionDay(readings)} />
          </div>
        </div>
        <div className="flex flex-wrap items-end gap-x-3 gap-y-3 xl:ml-auto 2xl:gap-x-4">
          <SelectField
            label="Crew member"
            value={crewId}
            onChange={setCrew}
            options={CREW.map((c) => ({ value: c.id, label: `${c.name} (${c.callSign})` }))}
          />
          <CrewAlertIndicator />
          <SelectField
            label="Environment"
            value={environmentId}
            onChange={(v) => setEnvironment(v as EnvironmentId)}
            options={ENVIRONMENTS.map((e) => ({ value: e.id, label: e.name }))}
          />
          <div data-tour="comm" className="flex flex-wrap items-end gap-x-3 gap-y-3 2xl:gap-x-4">
          <CommDelay environment={environment} />
          <div className="flex flex-col gap-1.5 self-stretch justify-end">
            <span
              data-testid="escalation-badge"
              title={esc.lines[0]}
              className="inline-flex h-7 items-center justify-center rounded-md border border-line-strong px-2 text-xs font-medium text-fg"
            >
              {esc.modeLabel}
            </span>
            <Link
              to="/routine"
              aria-label={`${due} routine ${due === 1 ? 'task' : 'tasks'} due now. Open Routine.`}
              className="inline-flex h-11 items-center justify-center gap-1.5 rounded-md border border-line-strong px-2.5 text-sm text-fg hover:border-fg-faint"
            >
              <ListChecks aria-hidden className="size-4 text-accent" />
              <span className="readout">{due}</span> due now
            </Link>
          </div>
          </div>
          <ThemeToggle />
        </div>
      </div>
    </header>
  )
}
