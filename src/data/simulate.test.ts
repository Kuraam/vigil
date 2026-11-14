import { describe, expect, it } from 'vitest'
import { CREW } from './crew'
import { SIM_DAYS, SIM_SEED, generatePriorDoses, generateReadings } from './simulate'
import { evaluateVital } from '../lib/status'
import { historyFor } from '../lib/readings'
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

describe('demo storylines', () => {
  const readings = generateReadings()
  const statusOn = (crewId: string, vital: VitalType, day: number) =>
    evaluateVital(vital, historyFor(readings, crewId, vital).filter((r) => r.missionDay <= day)).status

  it('flight engineer sleep debt: nominal before day 22, watch from day 22, action from day 27', () => {
    expect(statusOn('crew-03', 'sleepHours', 21)).not.toBe('action')
    for (const d of [22, 23, 24, 25, 26]) expect(statusOn('crew-03', 'sleepHours', d), `day ${d}`).toBe('watch')
    for (const d of [27, 28, 29, 30]) expect(statusOn('crew-03', 'sleepHours', d), `day ${d}`).toBe('action')
  })

  it('mission specialist runs 38.3 °C and 108 bpm on days 29-30', () => {
    for (const d of [29, 30]) {
      const day = readings.filter((r) => r.crewId === 'crew-04' && r.missionDay === d)
      expect(day.find((r) => r.vital === 'coreTemperature')).toMatchObject({ value: 38.3 })
      expect(day.find((r) => r.vital === 'heartRate')).toMatchObject({ value: 108 })
    }
    expect(statusOn('crew-04', 'coreTemperature', 30)).toBe('action')
    expect(statusOn('crew-04', 'heartRate', 30)).toBe('watch')
    expect(statusOn('crew-04', 'coreTemperature', 28)).not.toBe('action')
  })

  it('everyone else is mostly nominal, with a few realistic watch readings and no action today', () => {
    const rated: VitalType[] = ['bloodPressure', 'heartRate', 'hrv', 'bloodGlucose', 'coreTemperature', 'sleepHours', 'mood', 'cognitiveReadiness']
    let watch = 0
    let total = 0
    for (const crewId of ['crew-01', 'crew-02']) {
      for (const vital of rated) {
        expect(statusOn(crewId, vital, SIM_DAYS), `${crewId} ${vital}`).not.toBe('action')
        for (let d = 15; d <= SIM_DAYS; d++) {
          total++
          if (statusOn(crewId, vital, d) === 'watch') watch++
        }
      }
    }
    expect(watch).toBeGreaterThan(0)
    expect(watch / total).toBeLessThan(0.2)
  })

  it('seeds a prior career dose of 40-200 mSv for each crew member', () => {
    const doses = generatePriorDoses()
    expect(Object.keys(doses)).toHaveLength(4)
    for (const d of Object.values(doses)) {
      expect(d).toBeGreaterThanOrEqual(40)
      expect(d).toBeLessThanOrEqual(200)
    }
    expect(generatePriorDoses()).toEqual(doses)
  })
})
