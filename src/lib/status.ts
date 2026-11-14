import { THRESHOLDS } from '../data/thresholds'
import type {
  PressureReading,
  RatedVitalType,
  Status,
  StatusResult,
  ThresholdConfig,
  VitalReading,
  VitalType,
} from '../types'
import { dailyLatest, latestReading, trendValue } from './readings'

export const SEVERITY: Record<Status, number> = { nodata: 0, nominal: 1, watch: 2, action: 3 }

/** The more severe of two results (first wins on a tie). */
export function worse(a: StatusResult, b: StatusResult): StatusResult {
  if (a.priority) return a
  if (b.priority) return b
  return SEVERITY[b.status] > SEVERITY[a.status] ? b : a
}

const rated = (status: Status, detail: string, priority = false): StatusResult =>
  priority ? { status, reason: 'rated', detail, priority } : { status, reason: 'rated', detail }

const NO_READING: StatusResult = { status: 'nodata', reason: 'no-reading', detail: 'No reading logged yet.' }

// ---------------------------------------------------------------------------
// Single-reading rules. Values between two given tiers fall into the watch tier.
// ---------------------------------------------------------------------------

export function rateBloodPressure(r: Pick<PressureReading, 'systolic' | 'diastolic'>, t = THRESHOLDS.bloodPressure): StatusResult {
  const { systolic: s, diastolic: d } = r
  if (s >= t.crisisSystolicAtLeast.value || d >= t.crisisDiastolicAtLeast.value)
    return rated('action', `Crisis range: ${t.crisisSystolicAtLeast.value}/${t.crisisDiastolicAtLeast.value} mmHg or higher. Top priority.`, true)

  const sys =
    s >= t.actionSystolicAtLeast.value
      ? rated('action', `Systolic ${s} is ${t.actionSystolicAtLeast.value} mmHg or higher`)
      : s >= t.nominalSystolicBelow.value
        ? rated('watch', `Systolic ${s} is ${t.nominalSystolicBelow.value}-${t.actionSystolicAtLeast.value - 1} mmHg`)
        : s < t.lowSystolicBelow.value
          ? rated('watch', `Low: systolic ${s} is below ${t.lowSystolicBelow.value} mmHg`)
          : rated('nominal', `Below ${t.nominalSystolicBelow.value}/${t.nominalDiastolicBelow.value} mmHg`)
  const dia =
    d >= t.actionDiastolicAtLeast.value
      ? rated('action', `Diastolic ${d} is ${t.actionDiastolicAtLeast.value} mmHg or higher`)
      : d >= t.nominalDiastolicBelow.value
        ? rated('watch', `Diastolic ${d} is ${t.nominalDiastolicBelow.value}-${t.actionDiastolicAtLeast.value - 1} mmHg`)
        : d < t.lowDiastolicBelow.value
          ? rated('watch', `Low: diastolic ${d} is below ${t.lowDiastolicBelow.value} mmHg`)
          : rated('nominal', `Below ${t.nominalSystolicBelow.value}/${t.nominalDiastolicBelow.value} mmHg`)
  return worse(sys, dia)
}

export function rateHeartRate(h: number, t = THRESHOLDS.heartRate): StatusResult {
  if (h < t.actionBelow.value) return rated('action', `Below ${t.actionBelow.value} bpm (team rule)`)
  if (h > t.actionAbove.value) return rated('action', `Above ${t.actionAbove.value} bpm (team rule)`)
  if (h < t.nominalMin.value) return rated('watch', `Below ${t.nominalMin.value} bpm. ${t.note}`)
  if (h > t.nominalMax.value) return rated('watch', `Above ${t.nominalMax.value} bpm (team rule)`)
  return rated('nominal', `${t.nominalMin.value}-${t.nominalMax.value} bpm resting`)
}

export function rateGlucose(g: number, t = THRESHOLDS.bloodGlucose): StatusResult {
  if (g < t.actionBelow.value) return rated('action', `Below ${t.actionBelow.value} mg/dL: level 2 hypoglycaemia`)
  if (g >= t.actionAtLeast.value) return rated('action', `${t.actionAtLeast.value} mg/dL or higher: confirm and consult ground`)
  if (g < t.nominalMin.value) return rated('watch', `${t.actionBelow.value}-${t.nominalMin.value - 1} mg/dL: level 1 hypoglycaemia`)
  if (g > t.nominalMax.value) return rated('watch', `${t.nominalMax.value + 1}-${t.actionAtLeast.value - 1} mg/dL fasting`)
  return rated('nominal', `${t.nominalMin.value}-${t.nominalMax.value} mg/dL fasting`)
}

export function rateTemperature(c: number, t = THRESHOLDS.coreTemperature): StatusResult {
  if (c >= t.feverAtLeast.value) return rated('action', `Fever: ${t.feverAtLeast.value.toFixed(1)} °C or higher`)
  if (c < t.hypothermiaBelow.value) return rated('action', `Hypothermia: below ${t.hypothermiaBelow.value.toFixed(1)} °C`)
  if (c >= t.nominalMin.value && c <= t.nominalMax.value)
    return rated('nominal', `${t.nominalMin.value.toFixed(1)}-${t.nominalMax.value.toFixed(1)} °C (team rule)`)
  return c > t.nominalMax.value
    ? rated('watch', `Above ${t.nominalMax.value.toFixed(1)} °C, below fever (team rule)`)
    : rated('watch', `Below ${t.nominalMin.value.toFixed(1)} °C (team rule)`)
}

export function rateCognitive(c: number, t = THRESHOLDS.cognitiveReadiness): StatusResult {
  if (c >= t.nominalAtLeast.value) return rated('nominal', `${t.nominalAtLeast.value} or higher (team rule)`)
  if (c >= t.watchAtLeast.value) return rated('watch', `${t.watchAtLeast.value}-${t.nominalAtLeast.value - 1} (team rule)`)
  return rated('action', `Below ${t.watchAtLeast.value} (team rule)`)
}

// ---------------------------------------------------------------------------
// History rules: these need more than the latest reading.
// ---------------------------------------------------------------------------

/** Daily values (latest reading per day), oldest first. */
function dailyValues(history: VitalReading[]): { day: number; value: number }[] {
  return dailyLatest(history)
    .map((r) => ({ day: r.missionDay, value: trendValue(r) }))
    .filter((p): p is { day: number; value: number } => p.value !== null)
}

/** True when the last `n` points exist, sit on consecutive days, and all satisfy `test`. */
function lastNConsecutive(points: { day: number; value: number }[], n: number, test: (v: number, i: number, all: number[]) => boolean) {
  if (points.length < n) return false
  const tail = points.slice(-n)
  const consecutive = tail.every((p, i) => i === 0 || p.day === tail[i - 1].day + 1)
  const values = tail.map((p) => p.value)
  return consecutive && values.every((v, i) => test(v, i, values))
}

export function rateSleep(history: VitalReading[], t = THRESHOLDS.sleepHours): StatusResult {
  const points = dailyValues(history)
  const latest = points.at(-1)
  if (!latest) return NO_READING
  const nights = t.actionConsecutiveNights.value
  if (lastNConsecutive(points, nights, (v) => v < t.watchAtLeast.value))
    return rated('action', `Under ${t.watchAtLeast.value} h on ${nights} consecutive nights (team rule)`)
  if (latest.value >= t.nominalAtLeast.value) return rated('nominal', `${t.nominalAtLeast.value} h or more`)
  if (latest.value >= t.watchAtLeast.value) return rated('watch', `${t.watchAtLeast.value}-${t.nominalAtLeast.value - 0.1} h`)
  return rated('watch', `Under ${t.watchAtLeast.value} h. Action if it continues for ${nights} nights.`)
}

export function rateMood(history: VitalReading[], t = THRESHOLDS.mood): StatusResult {
  const points = dailyValues(history)
  const latest = points.at(-1)
  if (!latest) return NO_READING
  if (latest.value <= t.actionAtMost.value) return rated('action', `Self-rated ${t.actionAtMost.value} or lower (team rule)`)
  const days = t.declineDays.value
  if (lastNConsecutive(points, days, (v, i, all) => i === 0 || v < all[i - 1]))
    return rated('action', `Declined ${days} days in a row (team rule)`)
  if (latest.value >= t.nominalAtLeast.value) return rated('nominal', `${t.nominalAtLeast.value}-5 (team rule)`)
  return rated('watch', `Self-rated ${latest.value} (team rule)`)
}

export interface HrvSummary {
  baseline: number | null
  windowMean: number | null
  ratio: number | null
}

/** Personal baseline (days 1..N mean) and the latest rolling mean. */
export function hrvSummary(history: VitalReading[], t = THRESHOLDS.hrv): HrvSummary {
  const points = dailyValues(history)
  const base = points.filter((p) => p.day <= t.baselineDays.value)
  const latest = points.at(-1)
  if (!latest || base.length === 0) return { baseline: null, windowMean: null, ratio: null }
  const baseline = mean(base.map((p) => p.value))
  const window = points.filter((p) => p.day > latest.day - t.windowDays.value)
  const windowMean = mean(window.map((p) => p.value))
  return { baseline, windowMean, ratio: windowMean / baseline }
}

export function rateHrv(history: VitalReading[], t = THRESHOLDS.hrv): StatusResult {
  if (history.length === 0) return NO_READING
  const { ratio } = hrvSummary(history, t)
  if (ratio === null)
    return { status: 'nodata', reason: 'insufficient-history', detail: `Needs readings from mission days 1-${t.baselineDays.value} for a baseline.` }
  const pct = Math.round(ratio * 100)
  if (ratio < t.actionBelowFraction.value)
    return rated('action', `${t.windowDays.value}-day mean is ${pct}% of baseline, below ${t.actionBelowFraction.value * 100}% (team rule)`)
  if (ratio < t.watchBelowFraction.value)
    return rated('watch', `${t.windowDays.value}-day mean is ${pct}% of baseline, below ${t.watchBelowFraction.value * 100}% (team rule)`)
  return rated('nominal', `${t.windowDays.value}-day mean is ${pct}% of baseline`)
}

const mean = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / xs.length

// ---------------------------------------------------------------------------

/**
 * Rate one vital for one crew member. `history` is every reading of that
 * vital for that crew member, in any order; the latest is the one rated.
 */
export function evaluateVital(vital: VitalType, history: VitalReading[], t: ThresholdConfig = THRESHOLDS): StatusResult {
  if (vital === 'imagingLog')
    return history.length
      ? { status: 'nodata', reason: 'logged', detail: 'Logged. Imaging is reviewed by people, not rated.' }
      : NO_READING

  const latest = latestReading(history)
  if (!latest) return NO_READING

  const v = vital as RatedVitalType
  switch (v) {
    case 'bloodPressure':
      return latest.kind === 'pressure' ? rateBloodPressure(latest, t.bloodPressure) : NO_READING
    case 'hrv':
      return rateHrv(history, t.hrv)
    case 'sleepHours':
      return rateSleep(history, t.sleepHours)
    case 'mood':
      return rateMood(history, t.mood)
  }
  if (latest.kind !== 'scalar') return NO_READING
  switch (v) {
    case 'heartRate':
      return rateHeartRate(latest.value, t.heartRate)
    case 'bloodGlucose':
      return rateGlucose(latest.value, t.bloodGlucose)
    case 'coreTemperature':
      return rateTemperature(latest.value, t.coreTemperature)
    case 'cognitiveReadiness':
      return rateCognitive(latest.value, t.cognitiveReadiness)
  }
}
