import type { VitalReading, VitalType } from '../types'

const time = (r: VitalReading) => Date.parse(r.timestamp)

/** Latest reading by timestamp, so a manual entry beats a same-day simulated one. */
export function latestReading<T extends VitalReading>(history: T[]): T | undefined {
  let best: T | undefined
  for (const r of history) if (!best || time(r) > time(best)) best = r
  return best
}

/** Every reading of one vital for one crew member, oldest first. */
export function historyFor(readings: VitalReading[], crewId: string, vital: VitalType): VitalReading[] {
  return readings.filter((r) => r.crewId === crewId && r.vital === vital).sort((a, b) => time(a) - time(b))
}

/** One reading per mission day (the latest that day), oldest first. */
export function dailyLatest(history: VitalReading[]): VitalReading[] {
  const byDay = new Map<number, VitalReading>()
  for (const r of history) {
    const prev = byDay.get(r.missionDay)
    if (!prev || time(r) > time(prev)) byDay.set(r.missionDay, r)
  }
  return [...byDay.values()].sort((a, b) => a.missionDay - b.missionDay)
}

/** Latest reading per vital for one crew member. */
export function latestByVital(readings: VitalReading[], crewId: string): Partial<Record<VitalType, VitalReading>> {
  const latest: Partial<Record<VitalType, VitalReading>> = {}
  for (const r of readings) {
    if (r.crewId !== crewId) continue
    const prev = latest[r.vital]
    if (!prev || time(r) > time(prev)) latest[r.vital] = r
  }
  return latest
}

/** The number used for trends: the value, systolic for blood pressure, none for imaging. */
export function trendValue(r: VitalReading): number | null {
  if (r.kind === 'scalar') return r.value
  if (r.kind === 'pressure') return r.systolic
  return null
}

/**
 * Mean of the readings from the `window` mission days before `latest`'s day,
 * same crew + vital. Used for "vs 7-day mean". Null without history.
 */
export function trailingMean(readings: VitalReading[], latest: VitalReading, window = 7): number | null {
  const values = readings
    .filter(
      (r) =>
        r.crewId === latest.crewId &&
        r.vital === latest.vital &&
        r.missionDay < latest.missionDay &&
        r.missionDay >= latest.missionDay - window,
    )
    .map(trendValue)
    .filter((v): v is number => v !== null)
  if (values.length === 0) return null
  return values.reduce((a, b) => a + b, 0) / values.length
}

export function latestMissionDay(readings: VitalReading[]): number {
  return readings.reduce((max, r) => Math.max(max, r.missionDay), 0)
}
