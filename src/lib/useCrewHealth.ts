import { useMemo } from 'react'
import { getCrew } from '../data/crew'
import { generatePriorDoses } from '../data/simulate'
import { VITALS } from '../data/vitals'
import type { Status, StatusResult, VitalMeta, VitalReading, VitalType } from '../types'
import { doseSummary, type DoseSummary } from './radiation'
import { historyFor, latestMissionDay, latestReading, trailingMean, trendValue } from './readings'
import { evaluateVital } from './status'
import { useVigilStore } from './store'

export interface VitalRow {
  meta: VitalMeta
  /** Every reading of this vital for the crew member, oldest first. */
  history: VitalReading[]
  latest: VitalReading | undefined
  result: StatusResult
  /** Latest minus the mean of the 7 prior days; null when not applicable. */
  delta: number | null
}

const PRIOR_DOSES = generatePriorDoses()

/**
 * Everything the pages need about the selected crew member, derived from the
 * store in one place so Overview, Vitals and Body Map always agree.
 */
export function useCrewHealth() {
  const crewId = useVigilStore((s) => s.crewId)
  const environmentId = useVigilStore((s) => s.environmentId)
  const readings = useVigilStore((s) => s.readings)

  return useMemo(() => {
    const crew = getCrew(crewId)
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
        delta: mean !== null && value !== null ? value - mean : null,
      }
    })
    const byVital = Object.fromEntries(rows.map((r) => [r.meta.type, r])) as Record<VitalType, VitalRow>

    const counts: Record<Status, number> = { nominal: 0, watch: 0, action: 0, nodata: 0 }
    for (const r of rows) counts[r.result.status]++

    const missionDay = latestMissionDay(readings)
    const dose: DoseSummary = doseSummary(PRIOR_DOSES[crewId] ?? 0, missionDay, environmentId)

    return { crew, crewId, environmentId, rows, byVital, counts, missionDay, dose }
  }, [crewId, environmentId, readings])
}
