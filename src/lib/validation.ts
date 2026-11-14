import type { RatedVitalType } from '../types'

/**
 * Accepted ENTRY ranges for logging a reading. These only catch typing
 * mistakes (e.g. 720 instead of 72); they are not clinical thresholds and
 * never affect status.
 */
export const ENTRY_LIMITS: Record<Exclude<RatedVitalType, 'bloodPressure'> | 'systolic' | 'diastolic', { min: number; max: number; integer?: boolean }> = {
  heartRate: { min: 20, max: 250, integer: true },
  systolic: { min: 50, max: 260, integer: true },
  diastolic: { min: 30, max: 160, integer: true },
  hrv: { min: 1, max: 300, integer: true },
  bloodGlucose: { min: 20, max: 600, integer: true },
  coreTemperature: { min: 30, max: 43 },
  sleepHours: { min: 0, max: 24 },
  mood: { min: 1, max: 5, integer: true },
  cognitiveReadiness: { min: 0, max: 100, integer: true },
}

export type EntryResult =
  | { ok: true; values: Record<string, number> }
  | { ok: false; errors: Record<string, string> }

function parseField(raw: string | undefined, key: keyof typeof ENTRY_LIMITS, label: string): number | string {
  const text = (raw ?? '').trim().replace(',', '.')
  if (text === '') return `Enter ${label}.`
  if (!/^-?\d+(\.\d+)?$/.test(text)) return `Enter ${label} as a number.`
  const n = Number(text)
  const { min, max, integer } = ENTRY_LIMITS[key]
  if (integer && !Number.isInteger(n)) return `Enter ${label} as a whole number.`
  if (n < min || n > max) return `Enter ${label} between ${min} and ${max}.`
  return n
}

/** Validate a log-reading form. Field keys: `value`, or `systolic` + `diastolic` for blood pressure. */
export function validateEntry(vital: RatedVitalType, fields: Record<string, string>): EntryResult {
  const errors: Record<string, string> = {}
  const values: Record<string, number> = {}
  const take = (field: string, key: keyof typeof ENTRY_LIMITS, label: string) => {
    const r = parseField(fields[field], key, label)
    if (typeof r === 'string') errors[field] = r
    else values[field] = r
  }

  if (vital === 'bloodPressure') {
    take('systolic', 'systolic', 'systolic pressure')
    take('diastolic', 'diastolic', 'diastolic pressure')
    if (!errors.systolic && !errors.diastolic && values.systolic <= values.diastolic)
      errors.systolic = 'Systolic must be higher than diastolic.'
  } else {
    take('value', vital, 'a value')
  }

  return Object.keys(errors).length ? { ok: false, errors } : { ok: true, values }
}
