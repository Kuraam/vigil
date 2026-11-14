import { isCrewId } from '../data/crew'
import { isEnvironmentId } from '../data/environments'
import { SIM_SEED, SIM_VERSION } from '../data/simulate'
import type { EnvironmentId, ProtocolRun, RoutineLog, VitalReading } from '../types'

export interface PersistedSlice {
  crewId: string
  environmentId: EnvironmentId
  simSeed: number
  /** Generator version the readings came from; stale versions are regenerated. */
  simVersion: number
  readings: VitalReading[]
  routine: RoutineLog
  runs: ProtocolRun[]
  /** Demo toggle: a solar particle event warning is active. */
  speWarning: boolean
  /** Free-text questions for the flight surgeon, included in the Downlink brief. */
  briefQuestions: string
}

/**
 * Validate whatever came out of localStorage before it touches app state.
 * Anything unknown or stale is dropped so the store falls back to defaults:
 * an old crew id, a removed environment, or readings from a different seed
 * or generator version (e.g. Phase 1 data without the demo storylines).
 */
export function sanitizePersisted(raw: unknown): Partial<PersistedSlice> {
  if (typeof raw !== 'object' || raw === null) return {}
  const p = raw as Record<string, unknown>
  const patch: Partial<PersistedSlice> = {}

  if (isCrewId(p.crewId)) patch.crewId = p.crewId
  if (isEnvironmentId(p.environmentId)) patch.environmentId = p.environmentId
  if (p.simSeed === SIM_SEED && p.simVersion === SIM_VERSION && Array.isArray(p.readings)) {
    patch.simSeed = SIM_SEED
    patch.simVersion = SIM_VERSION
    patch.readings = p.readings as VitalReading[]
    // Routine and protocol runs belong to the same generated dataset.
    if (typeof p.routine === 'object' && p.routine !== null && !Array.isArray(p.routine)) patch.routine = p.routine as RoutineLog
    if (Array.isArray(p.runs)) patch.runs = p.runs as ProtocolRun[]
  }
  if (typeof p.speWarning === 'boolean') patch.speWarning = p.speWarning
  if (typeof p.briefQuestions === 'string') patch.briefQuestions = p.briefQuestions
  return patch
}
