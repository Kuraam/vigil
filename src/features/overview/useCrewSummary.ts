import { useMemo } from 'react'
import { getCrew } from '../../data/crew'
import { THRESHOLDS } from '../../data/thresholds'
import { VITALS } from '../../data/vitals'
import { latestByVital, trailingMean, trendValue } from '../../lib/readings'
import { evaluateStatus } from '../../lib/status'
import { useVigilStore } from '../../lib/store'
import type { Status, StatusResult, VitalMeta, VitalReading } from '../../types'

export interface VitalRow {
  meta: VitalMeta
  reading: VitalReading | undefined
  result: StatusResult
  /** Latest minus the mean of the 7 prior days; null when not applicable. */
  delta: number | null
}

/** Everything the Overview needs for the selected crew member, derived from the store. */
export function useCrewSummary() {
  const crewId = useVigilStore((s) => s.crewId)
  const readings = useVigilStore((s) => s.readings)

  return useMemo(() => {
    const crew = getCrew(crewId)
    const latest = latestByVital(readings, crewId)

    const rows: VitalRow[] = VITALS.map((meta) => {
      const reading = latest[meta.type]
      const mean = reading ? trailingMean(readings, reading) : null
      const value = reading ? trendValue(reading) : null
      return {
        meta,
        reading,
        result: evaluateStatus(reading, THRESHOLDS),
        delta: mean !== null && value !== null ? value - mean : null,
      }
    })

    const counts: Record<Status, number> = { nominal: 0, watch: 0, action: 0, nodata: 0 }
    for (const r of rows) counts[r.result.status]++

    const latestDay = rows.reduce((max, r) => Math.max(max, r.reading?.missionDay ?? 0), 0)
    return { crew, rows, counts, latestDay }
  }, [crewId, readings])
}
