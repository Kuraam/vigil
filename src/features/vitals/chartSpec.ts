import { THRESHOLDS } from '../../data/thresholds'
import { hrvSummary } from '../../lib/status'
import type { RatedVitalType, VitalReading } from '../../types'

export interface Band {
  from: number
  to: number
  label: string
}

export interface Rule {
  y: number
  label: string
  /** Status colour of the tier that starts at this line. */
  tone: 'watch' | 'action'
}

export interface ChartSpec {
  domain: [number, number]
  bands: Band[]
  rules: Rule[]
  /** Personal baseline (mean of mission days 1-14), where the rules or notes rely on it. */
  baseline?: { y: number; label: string }
  decimals: number
}

const BASELINE_DAYS = THRESHOLDS.hrv.baselineDays.value

/** Mean of days 1-14 for a scalar series; null without data. */
function personalBaseline(history: VitalReading[]): number | null {
  const vals = history.filter((r) => r.kind === 'scalar' && r.missionDay <= BASELINE_DAYS).map((r) => (r.kind === 'scalar' ? r.value : 0))
  return vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : null
}

/**
 * Bands and threshold lines for one vital, derived from THRESHOLDS so the
 * charts can never disagree with the status rules.
 */
export function chartSpec(vital: RatedVitalType, history: VitalReading[]): ChartSpec {
  const t = THRESHOLDS
  switch (vital) {
    case 'heartRate': {
      const b = personalBaseline(history)
      return {
        domain: [30, 130],
        bands: [{ from: t.heartRate.nominalMin.value, to: t.heartRate.nominalMax.value, label: 'Nominal' }],
        rules: [
          { y: t.heartRate.actionAbove.value, label: `Action above ${t.heartRate.actionAbove.value}`, tone: 'action' },
          { y: t.heartRate.actionBelow.value, label: `Action below ${t.heartRate.actionBelow.value}`, tone: 'action' },
        ],
        baseline: b === null ? undefined : { y: b, label: 'Personal baseline' },
        decimals: 0,
      }
    }
    case 'bloodPressure': {
      const bp = t.bloodPressure
      return {
        domain: [40, 200],
        bands: [
          { from: bp.lowSystolicBelow.value, to: bp.nominalSystolicBelow.value, label: 'Systolic nominal' },
          { from: bp.lowDiastolicBelow.value, to: bp.nominalDiastolicBelow.value, label: 'Diastolic nominal' },
        ],
        rules: [
          { y: bp.actionSystolicAtLeast.value, label: `Systolic action ${bp.actionSystolicAtLeast.value}`, tone: 'action' },
          { y: bp.actionDiastolicAtLeast.value, label: `Diastolic action ${bp.actionDiastolicAtLeast.value}`, tone: 'action' },
        ],
        decimals: 0,
      }
    }
    case 'hrv': {
      const { baseline } = hrvSummary(history)
      const top = Math.max(100, ...history.map((r) => (r.kind === 'scalar' ? r.value * 1.15 : 0)))
      if (baseline === null) return { domain: [0, top], bands: [], rules: [], decimals: 0 }
      const watch = baseline * t.hrv.watchBelowFraction.value
      const action = baseline * t.hrv.actionBelowFraction.value
      return {
        domain: [0, Math.ceil(top / 10) * 10],
        bands: [{ from: watch, to: Math.ceil(top / 10) * 10, label: 'Nominal (7-day mean)' }],
        rules: [
          { y: watch, label: '85% of baseline', tone: 'watch' },
          { y: action, label: '70% of baseline', tone: 'action' },
        ],
        baseline: { y: baseline, label: 'Baseline, days 1-14' },
        decimals: 0,
      }
    }
    case 'bloodGlucose':
      return {
        domain: [40, 160],
        bands: [{ from: t.bloodGlucose.nominalMin.value, to: t.bloodGlucose.nominalMax.value, label: 'Nominal' }],
        rules: [
          { y: t.bloodGlucose.actionAtLeast.value, label: `Action ${t.bloodGlucose.actionAtLeast.value}+`, tone: 'action' },
          { y: t.bloodGlucose.actionBelow.value, label: `Action below ${t.bloodGlucose.actionBelow.value}`, tone: 'action' },
        ],
        decimals: 0,
      }
    case 'coreTemperature': {
      const b = personalBaseline(history)
      return {
        domain: [34.5, 39],
        bands: [{ from: t.coreTemperature.nominalMin.value, to: t.coreTemperature.nominalMax.value, label: 'Nominal' }],
        rules: [
          { y: t.coreTemperature.feverAtLeast.value, label: `Fever ${t.coreTemperature.feverAtLeast.value.toFixed(1)}`, tone: 'action' },
          { y: t.coreTemperature.hypothermiaBelow.value, label: `Hypothermia below ${t.coreTemperature.hypothermiaBelow.value.toFixed(1)}`, tone: 'action' },
        ],
        baseline: b === null ? undefined : { y: b, label: 'In-flight baseline' },
        decimals: 1,
      }
    }
    case 'sleepHours':
      return {
        domain: [3, 10],
        bands: [{ from: t.sleepHours.nominalAtLeast.value, to: 10, label: 'Nominal' }],
        rules: [{ y: t.sleepHours.watchAtLeast.value, label: `Under ${t.sleepHours.watchAtLeast.value} h for 3 nights = action`, tone: 'action' }],
        decimals: 1,
      }
    case 'mood':
      return {
        domain: [1, 5],
        bands: [{ from: t.mood.nominalAtLeast.value, to: 5, label: 'Nominal' }],
        rules: [{ y: t.mood.actionAtMost.value, label: `Action at ${t.mood.actionAtMost.value} or lower`, tone: 'action' }],
        decimals: 0,
      }
    case 'cognitiveReadiness':
      return {
        domain: [0, 100],
        bands: [{ from: t.cognitiveReadiness.nominalAtLeast.value, to: 100, label: 'Nominal' }],
        rules: [{ y: t.cognitiveReadiness.watchAtLeast.value, label: `Action below ${t.cognitiveReadiness.watchAtLeast.value}`, tone: 'action' }],
        decimals: 0,
      }
  }
}
