import { getCrew } from '../data/crew'
import { generatePriorDoses } from '../data/simulate'
import { VITALS } from '../data/vitals'
import type { CrewMember, EnvironmentId, Status, StatusResult, VitalMeta, VitalReading, VitalType } from '../types'
import { doseSummary, type DoseSummary } from './radiation'
import { historyFor, latestReading, trailingMean, trendValue } from './readings'
import { exerciseSessions, type RoutineContext } from './routine'
import { evaluateVital, rateExercise } from './status'

export interface VitalRow {
  meta: VitalMeta
  /** Every reading of this vital for the crew member, oldest first. */
  history: VitalReading[]
  latest: VitalReading | undefined
  result: StatusResult
  /** Latest minus the mean of the 7 prior days; null when not applicable. */
  delta: number | null
}

export interface CrewHealth {
  crew: CrewMember | undefined
  crewId: string
  rows: VitalRow[]
  byVital: Record<VitalType, VitalRow>
  counts: Record<Status, number>
  dose: DoseSummary
  exercise: { sessions: number; result: StatusResult }
}

const PRIOR_DOSES = generatePriorDoses()

/** Everything VIGIL knows about one crew member right now. Pure: same inputs, same answer. */
export function computeCrewHealth(
  readings: VitalReading[],
  crewId: string,
  environmentId: EnvironmentId,
  missionDay: number,
  routine: RoutineContext,
): CrewHealth {
  const rows: VitalRow[] = VITALS.map((meta) => {
    const history = historyFor(readings, crewId, meta.type)
    const latest = latestReading(history)
    const mean = latest ? trailingMean(readings, latest) : null
    const value = latest ? trendValue(latest) : null
    return {
      meta,
      history,
      latest,
      result: evaluateVital(meta.type, history),
      delta: mean !== null && value !== null && meta.type !== 'visionCheck' ? value - mean : null,
    }
  })
  const byVital = Object.fromEntries(rows.map((r) => [r.meta.type, r])) as Record<VitalType, VitalRow>
  const counts: Record<Status, number> = { nominal: 0, watch: 0, action: 0, nodata: 0 }
  for (const r of rows) counts[r.result.status]++
  const sessions = exerciseSessions(crewId, missionDay, routine)
  return {
    crew: getCrew(crewId),
    crewId,
    rows,
    byVital,
    counts,
    dose: doseSummary(PRIOR_DOSES[crewId] ?? 0, missionDay, environmentId),
    exercise: { sessions, result: rateExercise(sessions) },
  }
}
