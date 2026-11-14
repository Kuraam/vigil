import { DAY_MS, MISSION_EPOCH } from '../data/simulate'
import type { BodyZone, ImagingModality, RatedVitalType, VitalReading } from '../types'

/** Simulated wall-clock at app load: 07:42:00 on the latest mission day. */
export const START_OF_SHIFT_MS = (7 * 3600 + 42 * 60) * 1000
const LOADED_AT = Date.now()

/** Current mission time in ms since epoch: latest simulated day at 07:42, ticking in real time. */
export function missionNowMs(latestDay: number, now = Date.now()): number {
  return MISSION_EPOCH + (latestDay - 1) * DAY_MS + START_OF_SHIFT_MS + (now - LOADED_AT)
}

/** Fractional mission day for charts: day 1 at 00:00 is 1.0. */
export function missionDayFraction(iso: string): number {
  return 1 + (Date.parse(iso) - MISSION_EPOCH) / DAY_MS
}

const dayOf = (ms: number) => Math.floor((ms - MISSION_EPOCH) / DAY_MS) + 1

let counter = 0
const newId = (crewId: string, vital: string) => `${crewId}-${vital}-log-${Date.now().toString(36)}-${(counter++).toString(36)}`

/** Build a reading a person logged in the app. */
export function makeLoggedReading(
  crewId: string,
  vital: RatedVitalType,
  values: Record<string, number>,
  atMs: number,
): VitalReading {
  const base = { id: newId(crewId, vital), crewId, missionDay: dayOf(atMs), timestamp: new Date(atMs).toISOString(), simulated: false }
  if (vital === 'bloodPressure')
    return { ...base, kind: 'pressure', vital, systolic: values.systolic, diastolic: values.diastolic }
  return { ...base, kind: 'scalar', vital, value: values.value }
}

export function makeLoggedImaging(crewId: string, modality: ImagingModality, zone: BodyZone, finding: string, atMs: number): VitalReading {
  return {
    id: newId(crewId, 'imagingLog'),
    crewId,
    missionDay: dayOf(atMs),
    timestamp: new Date(atMs).toISOString(),
    simulated: false,
    kind: 'imaging',
    vital: 'imagingLog',
    modality,
    zone,
    finding,
  }
}

/** "Day 30, 07:45:12" for an ISO mission timestamp. */
export function missionLabel(iso: string): string {
  const ms = Date.parse(iso)
  return `Day ${dayOf(ms)}, ${new Date(ms).toISOString().slice(11, 19)}`
}
