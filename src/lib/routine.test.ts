import { describe, expect, it } from 'vitest'
import { CREW } from '../data/crew'
import { generateReadings, generateRoutine, SIM_DAYS } from '../data/simulate'
import type { RoutineLog, VitalReading } from '../types'
import {
  adherence7,
  bestStreak,
  crewStreak,
  dueTasks,
  exerciseSessions,
  isDone,
  makeRoutineContext,
  milestones,
  personalStreak,
  tasksByPriority,
  totalPoints,
} from './routine'

const allCore = (ts = '2031-03-01T10:00:00.000Z') => ({ exercise: ts, nutrition: ts, sleep: ts, checkin: ts })

/** Context where derived tasks (vitals, vision) are done every day 1..n for crew "c". */
function ctxWith(log: RoutineLog, days = 10) {
  const readings: VitalReading[] = []
  for (let d = 1; d <= days; d++) {
    for (const vital of ['heartRate', 'hrv', 'coreTemperature', 'bloodGlucose', 'sleepHours', 'mood', 'cognitiveReadiness', 'spo2', 'visionCheck'] as const)
      readings.push({ id: `${vital}-${d}`, crewId: 'c', vital, kind: 'scalar', value: 1, missionDay: d, timestamp: '', simulated: true })
    readings.push({ id: `bp-${d}`, crewId: 'c', vital: 'bloodPressure', kind: 'pressure', systolic: 110, diastolic: 70, missionDay: d, timestamp: '', simulated: true })
  }
  return makeRoutineContext(readings, log, ['c'])
}

describe('routine maths', () => {
  it('derives "Log morning vitals" and "Vision self-check" from readings', () => {
    const ctx = ctxWith({ c: {} }, 2)
    expect(isDone('vitals', 'c', 1, ctx)).toBe(true)
    expect(isDone('vision', 'c', 2, ctx)).toBe(true)
    expect(isDone('vitals', 'c', 3, ctx)).toBe(false)
    expect(isDone('exercise', 'c', 1, ctx)).toBe(false)
  })

  it('counts a personal streak back from today, or from yesterday while today is still open', () => {
    const log: RoutineLog = { c: { 6: allCore(), 7: allCore(), 8: allCore(), 9: allCore() } }
    const ctx = ctxWith(log)
    expect(personalStreak('c', 9, ctx)).toBe(4) // today complete
    expect(personalStreak('c', 10, ctx)).toBe(4) // today open: count from yesterday
    log.c[8] = { exercise: 'x' }
    expect(personalStreak('c', 10, ctxWith(log))).toBe(1)
    expect(bestStreak('c', 10, ctxWith({ c: { 1: allCore(), 2: allCore(), 3: allCore(), 5: allCore() } }))).toBe(3)
  })

  it('crew streak needs every crew member complete', () => {
    const ctx = ctxWith({ c: { 8: allCore(), 9: allCore() } })
    expect(crewStreak(9, ctx)).toBe(2)
    const two = makeRoutineContext(ctx.readings, { c: { 8: allCore(), 9: allCore() }, d: { 9: allCore() } }, ['c', 'd'])
    expect(crewStreak(9, two)).toBe(0) // d has no vitals logged, so never complete
  })

  it('7-day adherence is the share of core tasks done per day', () => {
    const ctx = ctxWith({ c: { 10: { exercise: 'x', nutrition: 'x' } } })
    const bar = adherence7('c', 10, ctx)
    expect(bar).toHaveLength(7)
    expect(bar[6]).toEqual({ day: 10, done: 4, total: 6 }) // vitals + vision derived, plus 2 ticked
    expect(bar[0].day).toBe(4)
  })

  it('exercise sessions count the last 7 days including today', () => {
    const log: RoutineLog = { c: {} }
    for (let d = 1; d <= 10; d++) log.c[d] = { exercise: 'x' }
    delete log.c[9]
    expect(exerciseSessions('c', 10, ctxWith(log))).toBe(6) // days 4..10 minus day 9
  })

  it('points sum completed tasks; milestones unlock on streaks and logged days', () => {
    const log: RoutineLog = { c: {} }
    for (let d = 1; d <= 8; d++) log.c[d] = { ...allCore(), connection: 'x' }
    const ctx = ctxWith(log, 8)
    expect(totalPoints('c', 8, ctx)).toBe(8 * (10 + 15 + 5 + 10 + 5 + 5 + 5))
    const m = Object.fromEntries(milestones('c', 8, ctx).map((x) => [x.id, x.achieved]))
    expect(m['streak-7']).toBe(true)
    expect(m['streak-14']).toBe(false)
    expect(m['logged-30']).toBe(false)
  })

  it('lists tasks still due today', () => {
    const ctx = ctxWith({ c: { 5: { exercise: 'x' } } }, 5)
    expect(dueTasks('c', 5, ctx).map((t) => t.id)).toEqual(['nutrition', 'sleep', 'checkin', 'connection'])
  })

  it('orders tasks by the top-ranked hazard of the environment', () => {
    expect(tasksByPriority('orbital-station')[0].hazard).toBe('gravity-fields')
    expect(tasksByPriority('pressurized-rover')[0].hazard).toBe('hostile-closed-environments')
    expect(tasksByPriority('spacecraft-transit')[0].hazard).toBe('distance-from-earth') // radiation has no daily task
  })
})

describe('seeded routine history', () => {
  const readings = generateReadings()
  const ctx = makeRoutineContext(readings, generateRoutine(), CREW.map((c) => c.id))

  it('flight engineer misses sleep and check-in from day 22', () => {
    for (let d = 22; d < SIM_DAYS; d++) {
      expect(isDone('sleep', 'crew-03', d, ctx)).toBe(false)
      expect(isDone('checkin', 'crew-03', d, ctx)).toBe(false)
    }
  })

  it('mission specialist skips exercise on day 29, so adherence drops to watch range', () => {
    expect(isDone('exercise', 'crew-04', 29, ctx)).toBe(false)
    expect(exerciseSessions('crew-04', SIM_DAYS, ctx)).toBeLessThanOrEqual(5)
  })

  it('others are mostly consistent', () => {
    for (const id of ['crew-01', 'crew-02']) {
      const done = adherence7(id, SIM_DAYS - 1, ctx).reduce((a, d) => a + d.done / d.total, 0) / 7
      expect(done).toBeGreaterThan(0.8)
    }
  })
})
