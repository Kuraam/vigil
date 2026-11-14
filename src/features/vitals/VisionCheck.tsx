import { useId, useState } from 'react'
import { makeLoggedReading, missionNowMs } from '../../lib/missionTime'
import { dailyLatest, latestMissionDay } from '../../lib/readings'
import { useVigilStore } from '../../lib/store'
import type { VitalReading } from '../../types'

/**
 * Daily yes/no vision self-check. "Yes" is rated watch and suggests logging an
 * ocular ultrasound. Shared by the Vitals page and the Routine checklist.
 */
export function VisionCheckForm({ onSaved }: { onSaved?: (changed: boolean) => void }) {
  const crewId = useVigilStore((s) => s.crewId)
  const readings = useVigilStore((s) => s.readings)
  const addReading = useVigilStore((s) => s.addReading)
  const [msg, setMsg] = useState('')
  const id = useId()

  const answer = (changed: boolean) => {
    const r = makeLoggedReading(crewId, 'visionCheck', { value: changed ? 1 : 0 }, missionNowMs(latestMissionDay(readings)))
    addReading(r)
    setMsg(
      changed
        ? `Saved for mission day ${r.missionDay}: change reported. Log an ocular ultrasound in the imaging log.`
        : `Saved for mission day ${r.missionDay}: no change.`,
    )
    onSaved?.(changed)
  }

  return (
    <div role="group" aria-labelledby={`${id}-q`} className="rounded-md border border-line bg-bg/60 p-3">
      <p id={`${id}-q`} className="text-fg">
        Any change in near or distance vision?
      </p>
      <div className="mt-2 flex gap-2">
        <button type="button" onClick={() => answer(false)} className="h-11 min-w-20 cursor-pointer rounded-md border border-line-strong bg-raised px-4 text-fg hover:border-fg-faint">
          No
        </button>
        <button type="button" onClick={() => answer(true)} className="h-11 min-w-20 cursor-pointer rounded-md border border-line-strong bg-raised px-4 text-fg hover:border-fg-faint">
          Yes
        </button>
      </div>
      <p role="status" className="mt-2 min-h-5 text-sm text-fg-muted">
        {msg}
      </p>
    </div>
  )
}

/** Last 30 days of answers as a strip of labelled cells (text, not colour alone). */
export function VisionStrip({ history }: { history: VitalReading[] }) {
  const days = dailyLatest(history).slice(-30)
  return (
    <ol aria-label="Vision self-check, last 30 days" className="flex flex-wrap gap-1">
      {days.map((r) => {
        const changed = r.kind === 'scalar' && r.value === 1
        return (
          <li
            key={r.id}
            title={`Day ${r.missionDay}: ${changed ? 'change reported' : 'no change'}`}
            className={`readout grid h-7 w-7 place-items-center rounded text-[10px] ${changed ? 'border border-watch text-watch' : 'bg-raised text-fg-faint'}`}
          >
            <span aria-hidden>{changed ? '!' : r.missionDay}</span>
            <span className="sr-only">
              Day {r.missionDay}: {changed ? 'change reported' : 'no change'}
            </span>
          </li>
        )
      })}
    </ol>
  )
}
