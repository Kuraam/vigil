import type { VitalReading, VitalType } from '../types'

/** Latest reading per vital for one crew member. */
export function latestByVital(readings: VitalReading[], crewId: string): Partial<Record<VitalType, VitalReading>> {
  const latest: Partial<Record<VitalType, VitalReading>> = {}
  for (const r of readings) {
    if (r.crewId !== crewId) continue
    const prev = latest[r.vital]
    if (!prev || r.missionDay > prev.missionDay) latest[r.vital] = r
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
 * Mean of the `window` readings before `latest` for the same crew + vital.
 * Used to show "vs 7-day mean". Returns null when there is not enough history.
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
