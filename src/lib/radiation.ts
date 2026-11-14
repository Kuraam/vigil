import { DOSE_RATES, RADIATION_LIMITS, SIMULATED_MISSION_ENVIRONMENT } from '../data/radiation'
import type { EnvironmentId, StatusResult } from '../types'

export interface DoseSummary {
  priorDose: number
  missionDose: number
  cumulative: number
  /** Share of the career limit used, 0..1+. */
  fraction: number
  /** Today's rate for the selected environment, mSv/day. */
  rateToday: number
  /** Days until the career limit at today's rate; 0 once reached. */
  daysRemaining: number
  status: StatusResult
}

/** Mission dose for `days` mission days in one environment. */
export function missionDose(days: number, environment: EnvironmentId = SIMULATED_MISSION_ENVIRONMENT): number {
  return Math.max(0, days) * DOSE_RATES[environment].rate.value
}

export function daysRemaining(cumulative: number, rate: number, limit = RADIATION_LIMITS.career.value): number {
  if (rate <= 0) return Infinity
  return Math.max(0, (limit - cumulative) / rate)
}

/** Team rule: nominal below 50% of the career limit, watch 50-80%, action above 80%. */
export function rateDose(cumulative: number, limits = RADIATION_LIMITS): StatusResult {
  const limit = limits.career.value
  const pct = Math.round((cumulative / limit) * 100)
  const fraction = cumulative / limit
  if (fraction > limits.actionAboveFraction.value)
    return { status: 'action', reason: 'rated', detail: `${pct}% of the ${limit} mSv career limit, above 80% (team rule)` }
  if (fraction >= limits.watchAtFraction.value)
    return { status: 'watch', reason: 'rated', detail: `${pct}% of the ${limit} mSv career limit, 50-80% (team rule)` }
  return { status: 'nominal', reason: 'rated', detail: `${pct}% of the ${limit} mSv career limit` }
}

/** Everything the radiation panel shows for one crew member. */
export function doseSummary(priorDose: number, missionDays: number, environment: EnvironmentId): DoseSummary {
  const mission = missionDose(missionDays)
  const cumulative = priorDose + mission
  const rateToday = DOSE_RATES[environment].rate.value
  return {
    priorDose,
    missionDose: mission,
    cumulative,
    fraction: cumulative / RADIATION_LIMITS.career.value,
    rateToday,
    daysRemaining: daysRemaining(cumulative, rateToday),
    status: rateDose(cumulative),
  }
}
