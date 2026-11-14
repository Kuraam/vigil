import { describe, expect, it } from 'vitest'
import { CREW } from './crew'
import { SIM_DAYS, SIM_SEED, generateReadings } from './simulate'
import type { VitalType } from '../types'

const DAILY_VITALS: VitalType[] = [
  'bloodPressure',
  'heartRate',
  'hrv',
  'bloodGlucose',
  'coreTemperature',
  'sleepHours',
  'mood',
  'cognitiveReadiness',
]

describe('generateReadings', () => {
  it('is deterministic for a fixed seed', () => {
    expect(generateReadings(SIM_SEED)).toEqual(generateReadings(SIM_SEED))
  })

  it('differs for a different seed', () => {
    expect(generateReadings(SIM_SEED + 1)).not.toEqual(generateReadings(SIM_SEED))
  })

  it('has 4 crew members', () => {
    expect(CREW).toHaveLength(4)
  })

  it('produces one reading per day for every daily vital and crew member', () => {
    const readings = generateReadings()
    for (const crew of CREW) {
      for (const vital of DAILY_VITALS) {
        const days = readings
          .filter((r) => r.crewId === crew.id && r.vital === vital)
          .map((r) => r.missionDay)
        expect(days, `${crew.id} ${vital}`).toEqual(Array.from({ length: SIM_DAYS }, (_, i) => i + 1))
      }
    }
  })

  it('produces at least one imaging log entry per crew member', () => {
    const readings = generateReadings()
    for (const crew of CREW) {
      expect(readings.some((r) => r.crewId === crew.id && r.kind === 'imaging')).toBe(true)
    }
  })

  it('marks every reading as simulated and keeps numbers finite', () => {
    for (const r of generateReadings()) {
      expect(r.simulated).toBe(true)
      if (r.kind === 'scalar') expect(Number.isFinite(r.value)).toBe(true)
      if (r.kind === 'pressure') {
        expect(Number.isFinite(r.systolic)).toBe(true)
        expect(r.systolic).toBeGreaterThan(r.diastolic)
      }
    }
  })

  it('keeps ids unique', () => {
    const readings = generateReadings()
    expect(new Set(readings.map((r) => r.id)).size).toBe(readings.length)
  })
})
