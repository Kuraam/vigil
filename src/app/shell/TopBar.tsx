import { CREW } from '../../data/crew'
import { ENVIRONMENTS, getEnvironment } from '../../data/environments'
import { latestMissionDay } from '../../lib/readings'
import { useVigilStore } from '../../lib/store'
import type { EnvironmentId } from '../../types'
import { CommDelay } from './CommDelay'
import { MissionClock } from './MissionClock'
import { SelectField } from './SelectField'

function Wordmark() {
  return (
    <div className="flex items-center gap-2.5">
      <svg aria-hidden viewBox="0 0 32 32" className="size-8">
        <rect width="32" height="32" rx="6" className="fill-raised" />
        <path d="M7 9l9 15 9-15" fill="none" className="stroke-accent" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <div className="leading-tight">
        <div className="text-lg font-semibold tracking-[0.18em] text-fg">VIGIL</div>
        <div className="text-xs text-fg-faint">Crew health console</div>
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

  return (
    <header className="border-b border-line bg-panel">
      <div className="flex flex-wrap items-end gap-x-8 gap-y-4 px-4 py-3 sm:px-6">
        <Wordmark />
        <MissionClock missionDay={latestMissionDay(readings)} />
        <div className="flex flex-wrap items-end gap-x-4 gap-y-3 xl:ml-auto">
          <SelectField
            label="Crew member"
            value={crewId}
            onChange={setCrew}
            options={CREW.map((c) => ({ value: c.id, label: `${c.name} (${c.callSign})` }))}
          />
          <SelectField
            label="Environment"
            value={environmentId}
            onChange={(v) => setEnvironment(v as EnvironmentId)}
            options={ENVIRONMENTS.map((e) => ({ value: e.id, label: e.name }))}
          />
          <CommDelay environment={environment} />
        </div>
      </div>
    </header>
  )
}
