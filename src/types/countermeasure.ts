import type { HazardId } from './hazard'

export type CountermeasureKind = 'exercise' | 'sleep' | 'nutrition' | 'radiation' | 'behavioral' | 'medical'

/** A scheduled countermeasure (exercise block, sleep shift, etc.). Used by Routine in Phase 3. */
export interface CountermeasureTask {
  id: string
  crewId: string
  title: string
  kind: CountermeasureKind
  /** The HRP hazard this task mitigates. */
  hazard: HazardId
  missionDay: number
  durationMinutes: number
  completed: boolean
}
