import { HAZARD_PRIORITY } from '../data/priorities'
import { MORNING_VITALS, ROUTINE_TASKS } from '../data/routineTasks'
import { THRESHOLDS } from '../data/thresholds'
import type { EnvironmentId, RoutineLog, RoutineTask, RoutineTaskId, VitalReading } from '../types'

export interface RoutineContext {
  readings: VitalReading[]
  log: RoutineLog
  crewIds: string[]
  /** crewId -> days on which every morning vital was logged. */
  vitalsDays: Map<string, Set<number>>
  /** crewId -> days with a vision self-check answer. */
  visionDays: Map<string, Set<number>>
}

const CORE = ROUTINE_TASKS.filter((t) => t.core)

export function makeRoutineContext(readings: VitalReading[], log: RoutineLog, crewIds: string[]): RoutineContext {
  const seen = new Map<string, Map<number, Set<string>>>()
  for (const r of readings) {
    const byDay = seen.get(r.crewId) ?? new Map<number, Set<string>>()
    const set = byDay.get(r.missionDay) ?? new Set<string>()
    set.add(r.vital)
    byDay.set(r.missionDay, set)
    seen.set(r.crewId, byDay)
  }
  const vitalsDays = new Map<string, Set<number>>()
  const visionDays = new Map<string, Set<number>>()
  for (const [crewId, byDay] of seen) {
    const v = new Set<number>()
    const e = new Set<number>()
    for (const [day, set] of byDay) {
      if (MORNING_VITALS.every((m) => set.has(m))) v.add(day)
      if (set.has('visionCheck')) e.add(day)
    }
    vitalsDays.set(crewId, v)
    visionDays.set(crewId, e)
  }
  return { readings, log, crewIds, vitalsDays, visionDays }
}

export function isDone(task: RoutineTaskId, crewId: string, day: number, ctx: RoutineContext): boolean {
  if (task === 'vitals') return ctx.vitalsDays.get(crewId)?.has(day) ?? false
  if (task === 'vision') return ctx.visionDays.get(crewId)?.has(day) ?? false
  return Boolean(ctx.log[crewId]?.[day]?.[task])
}

export function coreComplete(crewId: string, day: number, ctx: RoutineContext): boolean {
  return CORE.every((t) => isDone(t.id, crewId, day, ctx))
}

/** Consecutive complete days, counted back from `today` (or from yesterday while today is still open). */
function streakFrom(today: number, complete: (day: number) => boolean): number {
  let day = complete(today) ? today : today - 1
  let n = 0
  while (day >= 1 && complete(day)) {
    n++
    day--
  }
  return n
}

export const personalStreak = (crewId: string, today: number, ctx: RoutineContext) =>
  streakFrom(today, (d) => coreComplete(crewId, d, ctx))

export const crewStreak = (today: number, ctx: RoutineContext) =>
  streakFrom(today, (d) => ctx.crewIds.every((id) => coreComplete(id, d, ctx)))

export function bestStreak(crewId: string, today: number, ctx: RoutineContext): number {
  let best = 0
  let run = 0
  for (let d = 1; d <= today; d++) {
    run = coreComplete(crewId, d, ctx) ? run + 1 : 0
    best = Math.max(best, run)
  }
  return best
}

/** Core tasks done per day for the 7 days ending today. */
export function adherence7(crewId: string, today: number, ctx: RoutineContext) {
  return Array.from({ length: 7 }, (_, i) => {
    const day = today - 6 + i
    return { day, done: day < 1 ? 0 : CORE.filter((t) => isDone(t.id, crewId, day, ctx)).length, total: CORE.length }
  })
}

/** Exercise sessions in the adherence window (today − 6 … today). */
export function exerciseSessions(crewId: string, today: number, ctx: RoutineContext): number {
  const w = THRESHOLDS.exerciseAdherence.windowDays.value
  let n = 0
  for (let d = today - w + 1; d <= today; d++) if (d >= 1 && isDone('exercise', crewId, d, ctx)) n++
  return n
}

export function totalPoints(crewId: string, today: number, ctx: RoutineContext): number {
  let pts = 0
  for (let d = 1; d <= today; d++) for (const t of ROUTINE_TASKS) if (isDone(t.id, crewId, d, ctx)) pts += t.points
  return pts
}

export interface Milestone {
  id: string
  label: string
  achieved: boolean
}

export function milestones(crewId: string, today: number, ctx: RoutineContext): Milestone[] {
  const best = bestStreak(crewId, today, ctx)
  const logged = ctx.vitalsDays.get(crewId)?.size ?? 0
  return [
    { id: 'streak-7', label: '7-day streak', achieved: best >= 7 },
    { id: 'streak-14', label: '14-day streak', achieved: best >= 14 },
    { id: 'logged-30', label: '30 days of vitals logged', achieved: logged >= 30 },
    { id: 'points-1000', label: '1,000 points', achieved: totalPoints(crewId, today, ctx) >= 1000 },
  ]
}

/** Tasks not yet done today, in checklist order. */
export function dueTasks(crewId: string, today: number, ctx: RoutineContext): RoutineTask[] {
  return ROUTINE_TASKS.filter((t) => !isDone(t.id, crewId, today, ctx))
}

/** Checklist ordered by the environment's hazard ranking (stable within a hazard). */
export function tasksByPriority(env: EnvironmentId): RoutineTask[] {
  const rank = new Map(HAZARD_PRIORITY[env].map((p, i) => [p.hazard, i]))
  return [...ROUTINE_TASKS].sort((a, b) => (rank.get(a.hazard) ?? 9) - (rank.get(b.hazard) ?? 9))
}
