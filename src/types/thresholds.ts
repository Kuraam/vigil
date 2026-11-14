import type { VitalType } from './vitals'

/**
 * One bound of a threshold range. `value` is `null` until a sourced figure
 * is entered; `source` must cite where the number comes from.
 */
export interface ThresholdBound {
  value: number | null
  unit: string
  source: string
}

/**
 * A closed range [min, max]. `null` means "not yet sourced" (TODO).
 * Once sourced, an intentionally open side should use -Infinity / Infinity.
 */
export interface ThresholdRange {
  min: ThresholdBound
  max: ThresholdBound
}

/**
 * Status bands for one measured quantity. A reading is `nominal` inside
 * `nominal`, `watch` inside `watch` but outside `nominal`, otherwise `action`.
 */
export interface VitalThreshold {
  nominal: ThresholdRange
  watch: ThresholdRange
}

/** Measured quantities that can be compared to thresholds. Blood pressure has two. */
export type ThresholdKey = Exclude<VitalType, 'bloodPressure' | 'imagingLog'> | 'systolic' | 'diastolic'

export type ThresholdConfig = Record<ThresholdKey, VitalThreshold>
