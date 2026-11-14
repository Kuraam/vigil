import type { ThresholdBound, ThresholdConfig, VitalThreshold } from '../types'

/**
 * STATUS THRESHOLDS: NOT YET SOURCED.
 *
 * Every numeric value below is a deliberate `null` placeholder.
 * TODO(Phase 2): replace each `value: null` with a figure from a cited source
 * (e.g. NASA-STD-3001, NASA HRP evidence reports) and fill in `source`.
 * Until then `evaluateStatus` returns `nodata / threshold-pending` for every
 * reading, so the UI never shows a clinical claim it cannot back up.
 *
 * Do not invent numbers here.
 */
export const PENDING_SOURCE = 'TODO(Phase 2): cite source'

function pendingBound(unit: string): ThresholdBound {
  return { value: null, unit, source: PENDING_SOURCE }
}

function pending(unit: string): VitalThreshold {
  return {
    nominal: { min: pendingBound(unit), max: pendingBound(unit) },
    watch: { min: pendingBound(unit), max: pendingBound(unit) },
  }
}

export const THRESHOLDS: ThresholdConfig = {
  systolic: pending('mmHg'), // TODO(Phase 2)
  diastolic: pending('mmHg'), // TODO(Phase 2)
  heartRate: pending('bpm'), // TODO(Phase 2)
  hrv: pending('ms'), // TODO(Phase 2)
  bloodGlucose: pending('mg/dL'), // TODO(Phase 2)
  coreTemperature: pending('°C'), // TODO(Phase 2)
  sleepHours: pending('h'), // TODO(Phase 2)
  mood: pending('score 1-5'), // TODO(Phase 2)
  cognitiveReadiness: pending('score 0-100'), // TODO(Phase 2)
}
