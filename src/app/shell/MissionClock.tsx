import { useEffect, useState } from 'react'
import { MISSION_EPOCH } from '../../data/simulate'
import { pad } from '../../lib/format'
import { missionNowMs } from '../../lib/missionTime'

/**
 * Mission day + mission elapsed time (MET), formatted DDD:HH:MM:SS.
 * MET starts from the latest simulated day and ticks in real time.
 */
export function MissionClock({ missionDay }: { missionDay: number }) {
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 1000)
    return () => window.clearInterval(id)
  }, [])

  // Same clock that timestamps logged readings.
  const elapsed = Math.max(0, Math.floor((missionNowMs(Math.max(1, missionDay), now) - MISSION_EPOCH) / 1000))
  const d = Math.floor(elapsed / 86_400)
  const h = Math.floor((elapsed % 86_400) / 3600)
  const m = Math.floor((elapsed % 3600) / 60)
  const s = elapsed % 60

  return (
    <div className="flex items-end gap-5">
      {/* Below 2xl the MET (which starts with the day count) stands alone, so the top bar fits one row. */}
      <div className="hidden 2xl:block">
        <div className="field-label">Mission day</div>
        <div className="readout text-2xl leading-7 font-medium text-fg">{pad(missionDay, 3)}</div>
      </div>
      <div>
        <div className="field-label" id="met-label">
          Elapsed (MET)
        </div>
        <time
          aria-labelledby="met-label"
          // Ticks every second: kept out of live regions so screen readers are not flooded.
          aria-live="off"
          className="readout block text-xl leading-7 font-medium text-fg 2xl:text-2xl"
        >
          {pad(d, 3)}:{pad(h, 2)}:{pad(m, 2)}:{pad(s, 2)}
        </time>
      </div>
    </div>
  )
}
