import { THRESHOLDS } from '../data/thresholds'
import { RADIATION_LIMITS } from '../data/radiation'
import { VITAL_META } from '../data/vitals'
import type { ProtocolId, RatedVitalType, StatusResult, ThresholdValue } from '../types'
import { formatReading } from './format'
import type { CrewHealth } from './health'
import { SEVERITY } from './status'

export type AlertIndicator = RatedVitalType | 'radiation' | 'exerciseAdherence' | 'spe'

export interface Alert {
  /** Stable id: "<crewId>:<indicator>". */
  key: string
  crewId: string
  crewName: string
  indicator: AlertIndicator
  label: string
  result: StatusResult
  /** The reading as shown, e.g. "38.3 °C". */
  value: string
  /** Sources of the thresholds behind this rating. */
  sources: string[]
  /** When the reading was taken (ISO). */
  at: string
  protocolId?: ProtocolId
}

/** Unique source strings of a vital's thresholds. */
function sourcesOf(group: object): string[] {
  const vals = Object.values(group).filter((v): v is ThresholdValue => typeof v === 'object' && v !== null && 'source' in v)
  return [...new Set(vals.map((v) => v.source))]
}

/** Which protocol fits a rated reading (direction matters: a low temperature is not a fever). */
function protocolFor(indicator: AlertIndicator, h: CrewHealth): ProtocolId | undefined {
  const latest = indicator in h.byVital ? h.byVital[indicator as RatedVitalType].latest : undefined
  const v = latest?.kind === 'scalar' ? latest.value : undefined
  switch (indicator) {
    case 'coreTemperature':
      return v !== undefined && v > THRESHOLDS.coreTemperature.nominalMax.value ? 'fever' : undefined
    case 'heartRate':
      return v !== undefined && v > THRESHOLDS.heartRate.nominalMax.value ? 'high-heart-rate' : undefined
    case 'bloodPressure':
      return latest?.kind === 'pressure' &&
        (latest.systolic >= THRESHOLDS.bloodPressure.nominalSystolicBelow.value || latest.diastolic >= THRESHOLDS.bloodPressure.nominalDiastolicBelow.value)
        ? 'high-blood-pressure'
        : undefined
    case 'bloodGlucose':
      return v !== undefined && v < THRESHOLDS.bloodGlucose.nominalMin.value ? 'low-blood-sugar' : undefined
    case 'spo2':
      return 'low-spo2'
    case 'sleepHours':
      return 'sleep-debt'
    case 'mood':
    case 'cognitiveReadiness':
      return 'low-mood'
    case 'radiation':
    case 'spe':
      return 'radiation'
    default:
      return undefined
  }
}

/** Every watch or action indicator for one crew member, as alerts. */
export function buildAlerts(h: CrewHealth, opts: { speWarning?: boolean; now?: string } = {}): Alert[] {
  const crewName = h.crew?.name ?? h.crewId
  const out: Alert[] = []
  const push = (a: Omit<Alert, 'key' | 'crewId' | 'crewName' | 'protocolId'>) =>
    out.push({ ...a, key: `${h.crewId}:${a.indicator}`, crewId: h.crewId, crewName, protocolId: protocolFor(a.indicator, h) })

  for (const row of h.rows) {
    if (row.meta.type === 'imagingLog' || !row.latest) continue
    if (row.result.status !== 'watch' && row.result.status !== 'action') continue
    const vital = row.meta.type as RatedVitalType
    const shown = formatReading(row.latest)
    push({
      indicator: vital,
      label: VITAL_META[vital].label,
      result: row.result,
      value: `${shown.value} ${shown.unit}`.trim(),
      sources: sourcesOf(THRESHOLDS[vital]),
      at: row.latest.timestamp,
    })
  }
  if (h.dose.status.status === 'watch' || h.dose.status.status === 'action')
    push({
      indicator: 'radiation',
      label: 'Radiation dose',
      result: h.dose.status,
      value: `${h.dose.cumulative.toFixed(1)} mSv`,
      sources: [RADIATION_LIMITS.career.source, RADIATION_LIMITS.watchAtFraction.source],
      at: opts.now ?? new Date(0).toISOString(),
    })
  if (h.exercise.result.status === 'watch' || h.exercise.result.status === 'action')
    push({
      indicator: 'exerciseAdherence',
      label: 'Exercise adherence',
      result: h.exercise.result,
      value: `${h.exercise.sessions} of 7 days`,
      sources: sourcesOf(THRESHOLDS.exerciseAdherence),
      at: opts.now ?? new Date(0).toISOString(),
    })
  if (opts.speWarning)
    push({
      indicator: 'spe',
      label: 'Solar particle event warning',
      result: { status: 'action', reason: 'rated', detail: `Event warning active. Limit ${RADIATION_LIMITS.solarParticleEvent.value} mSv per event.` },
      value: 'Warning active',
      sources: [RADIATION_LIMITS.solarParticleEvent.source],
      at: opts.now ?? new Date(0).toISOString(),
    })
  return out
}

/** Action first, then watch; a priority crisis leads its tier; then most recent first. */
export function sortAlerts(alerts: Alert[]): Alert[] {
  return [...alerts].sort(
    (a, b) =>
      SEVERITY[b.result.status] - SEVERITY[a.result.status] ||
      Number(Boolean(b.result.priority)) - Number(Boolean(a.result.priority)) ||
      Date.parse(b.at) - Date.parse(a.at),
  )
}
