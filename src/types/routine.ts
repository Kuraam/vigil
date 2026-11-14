import type { HazardId } from './hazard'

export type RoutineTaskId = 'vitals' | 'exercise' | 'nutrition' | 'sleep' | 'checkin' | 'vision' | 'connection'

export interface RoutineTask {
  id: RoutineTaskId
  label: string
  detail: string
  points: number
  /** Core tasks count toward streaks; the others are a bonus. */
  core: boolean
  /** The hazard this task mainly addresses; drives "priority today". */
  hazard: HazardId
  /** Derived tasks are done by logging data, not by ticking a box. */
  derived: boolean
}

/** Completion timestamps (ISO) per task for one crew member on one day. */
export type RoutineDay = Partial<Record<RoutineTaskId, string>>

/** crewId -> mission day -> completions. */
export type RoutineLog = Record<string, Record<number, RoutineDay>>
