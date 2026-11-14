import { VITAL_META } from '../data/vitals'
import { BODY_ZONE_LABEL } from '../types'
import type { ScalarVitalType, VitalReading } from '../types'

/** Decimal places shown per scalar vital. */
const DECIMALS: Record<ScalarVitalType, number> = {
  heartRate: 0,
  hrv: 0,
  bloodGlucose: 0,
  coreTemperature: 1,
  sleepHours: 1,
  mood: 0,
  cognitiveReadiness: 0,
}

/** Turn a reading into display strings. Never returns "NaN". */
export function formatReading(r: VitalReading): { value: string; unit: string } {
  switch (r.kind) {
    case 'pressure':
      return { value: `${r.systolic}/${r.diastolic}`, unit: 'mmHg' }
    case 'imaging':
      return { value: BODY_ZONE_LABEL[r.zone], unit: '' }
    case 'scalar':
      return { value: formatNumber(r.value, DECIMALS[r.vital]), unit: VITAL_META[r.vital].unit }
  }
}

export function formatNumber(value: number, decimals = 0): string {
  return Number.isFinite(value) ? value.toFixed(decimals) : '--'
}

/** Signed delta, e.g. "+2.1" / "-0.4" / "0.0". */
export function formatDelta(value: number, decimals = 0): string {
  if (!Number.isFinite(value)) return '--'
  const fixed = Math.abs(value).toFixed(decimals)
  if (Number(fixed) === 0) return fixed
  return `${value > 0 ? '+' : '−'}${fixed}`
}

export function pad(n: number, width: number): string {
  return String(Math.floor(n)).padStart(width, '0')
}

/** Human-readable one-way delay, e.g. "0.24 s", "3.0 min", "22.3 min". */
export function formatDelay(seconds: number): string {
  if (seconds < 60) return `${seconds < 1 ? seconds.toFixed(2) : seconds.toFixed(0)} s`
  return `${(seconds / 60).toFixed(1)} min`
}
