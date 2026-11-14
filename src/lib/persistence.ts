import { isCrewId } from '../data/crew'
import { isEnvironmentId } from '../data/environments'
import { SIM_SEED } from '../data/simulate'
import type { EnvironmentId, VitalReading } from '../types'

export interface PersistedSlice {
  crewId: string
  environmentId: EnvironmentId
  simSeed: number
  readings: VitalReading[]
}

/**
 * Validate whatever came out of localStorage before it touches app state.
 * Anything unknown or stale is dropped so the store falls back to defaults:
 * an old crew id, a removed environment, or readings from a different seed.
 */
export function sanitizePersisted(raw: unknown): Partial<PersistedSlice> {
  if (typeof raw !== 'object' || raw === null) return {}
  const p = raw as Record<string, unknown>
  const patch: Partial<PersistedSlice> = {}

  if (isCrewId(p.crewId)) patch.crewId = p.crewId
  if (isEnvironmentId(p.environmentId)) patch.environmentId = p.environmentId
  if (p.simSeed === SIM_SEED && Array.isArray(p.readings)) {
    patch.simSeed = SIM_SEED
    patch.readings = p.readings as VitalReading[]
  }
  return patch
}
