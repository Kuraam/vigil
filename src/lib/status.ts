import type { Status, StatusResult, ThresholdConfig, ThresholdKey, VitalReading, VitalThreshold } from '../types'

const SEVERITY: Record<Status, number> = { nodata: 0, nominal: 1, watch: 2, action: 3 }

const PENDING: StatusResult = { status: 'nodata', reason: 'threshold-pending' }

/** Classify one number against one threshold band; `null` if any bound is still TODO. */
function classify(value: number, t: VitalThreshold): StatusResult | null {
  const { nominal, watch } = t
  const bounds = [nominal.min.value, nominal.max.value, watch.min.value, watch.max.value]
  if (bounds.some((b) => b === null)) return null
  const [nMin, nMax, wMin, wMax] = bounds as number[]

  if (value >= nMin && value <= nMax) return { status: 'nominal', reason: 'in-range' }
  if (value >= wMin && value <= wMax) return { status: 'watch', reason: 'watch-range' }
  return { status: 'action', reason: 'action-range' }
}

/**
 * Assign a status to a reading. Returns `nodata` whenever VIGIL cannot back
 * a claim: no reading, an imaging entry (needs human review), or a threshold
 * that has not been sourced yet.
 */
export function evaluateStatus(reading: VitalReading | undefined, thresholds: ThresholdConfig): StatusResult {
  if (!reading) return { status: 'nodata', reason: 'no-reading' }

  switch (reading.kind) {
    case 'imaging':
      return PENDING
    case 'scalar':
      return classify(reading.value, thresholds[reading.vital as ThresholdKey]) ?? PENDING
    case 'pressure': {
      const sys = classify(reading.systolic, thresholds.systolic)
      const dia = classify(reading.diastolic, thresholds.diastolic)
      if (!sys || !dia) return PENDING
      return SEVERITY[sys.status] >= SEVERITY[dia.status] ? sys : dia
    }
  }
}

export const STATUS_LABEL: Record<Status, string> = {
  nominal: 'Nominal',
  watch: 'Watch',
  action: 'Action',
  nodata: 'No data',
}

export const REASON_LABEL: Record<StatusResult['reason'], string> = {
  'no-reading': 'No reading',
  'threshold-pending': 'Threshold pending',
  'in-range': 'In range',
  'watch-range': 'Outside nominal',
  'action-range': 'Outside watch range',
}
