import { useEffect, useState } from 'react'
import { pad } from '../../lib/format'

/** Simulated wall-clock at load: 07:42:00 on the latest mission day. */
const START_OF_SHIFT_S = 7 * 3600 + 42 * 60

/**
 * Mission day + mission elapsed time (MET), formatted DDD:HH:MM:SS.
 * MET starts from the latest simulated day and ticks in real time.
 */
export function MissionClock({ missionDay }: { missionDay: number }) {
  const [loadedAt] = useState(() => Date.now())
  const [now, setNow] = useState(loadedAt)

  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 1000)
    return () => window.clearInterval(id)
  }, [])

  const elapsed = Math.max(0, missionDay - 1) * 86_400 + START_OF_SHIFT_S + Math.floor((now - loadedAt) / 1000)
  const d = Math.floor(elapsed / 86_400)
  const h = Math.floor((elapsed % 86_400) / 3600)
  const m = Math.floor((elapsed % 3600) / 60)
  const s = elapsed % 60

  return (
    <div className="flex items-end gap-5">
      <div>
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
          className="readout block text-2xl leading-7 font-medium text-fg"
        >
          {pad(d, 3)}:{pad(h, 2)}:{pad(m, 2)}:{pad(s, 2)}
        </time>
      </div>
    </div>
  )
}
