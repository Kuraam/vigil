import { describe, expect, it } from 'vitest'
import { generateReadings, SIM_DAYS } from '../data/simulate'
import { latestByVital, latestMissionDay, trailingMean } from './readings'
import type { ScalarReading } from '../types'

const readings = generateReadings()

describe('readings helpers', () => {
  it('picks the last mission day for each vital', () => {
    const latest = latestByVital(readings, 'crew-01')
    expect(latest.heartRate?.missionDay).toBe(SIM_DAYS)
    expect(latest.bloodPressure?.kind).toBe('pressure')
  })

  it('returns nothing for an unknown crew member', () => {
    expect(latestByVital(readings, 'ghost')).toEqual({})
  })

  it('averages the 7 readings before the latest', () => {
    const latest = latestByVital(readings, 'crew-02').heartRate as ScalarReading
    const prior = readings.filter(
      (r): r is ScalarReading =>
        r.kind === 'scalar' && r.crewId === 'crew-02' && r.vital === 'heartRate' && r.missionDay >= SIM_DAYS - 7 && r.missionDay < SIM_DAYS,
    )
    expect(prior).toHaveLength(7)
    expect(trailingMean(readings, latest)).toBeCloseTo(prior.reduce((a, r) => a + r.value, 0) / 7)
  })

  it('returns null mean when there is no history', () => {
    const first = readings.find((r) => r.missionDay === 1)!
    expect(trailingMean(readings, first)).toBeNull()
  })

  it('reports the latest mission day', () => {
    expect(latestMissionDay(readings)).toBe(SIM_DAYS)
    expect(latestMissionDay([])).toBe(0)
  })
})
