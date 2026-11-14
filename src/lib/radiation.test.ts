import { describe, expect, it } from 'vitest'
import { DOSE_RATES, RADIATION_LIMITS } from '../data/radiation'
import { daysRemaining, doseSummary, missionDose, rateDose } from './radiation'

describe('radiation', () => {
  it('uses the supplied dose rates and limits', () => {
    expect(DOSE_RATES['spacecraft-transit'].rate.value).toBe(1.84)
    expect(DOSE_RATES['surface-base'].rate.value).toBe(0.64)
    expect(DOSE_RATES['pressurized-rover'].rate.value).toBe(0.64)
    expect(DOSE_RATES['orbital-station'].rate.value).toBe(0.35)
    expect(DOSE_RATES['orbital-station'].range).toEqual([0.2, 0.5])
    expect(RADIATION_LIMITS.career.value).toBe(600)
    expect(RADIATION_LIMITS.solarParticleEvent.value).toBe(250)
    expect(RADIATION_LIMITS.career.source).toBe('NASA-STD-3001 Vol 1 [V1 4030]')
  })

  it('computes 30 transit days as 55.2 mSv', () => {
    expect(missionDose(30)).toBeCloseTo(55.2)
  })

  it('adds prior career dose to mission dose', () => {
    const s = doseSummary(100, 30, 'spacecraft-transit')
    expect(s.cumulative).toBeCloseTo(155.2)
    expect(s.fraction).toBeCloseTo(155.2 / 600)
  })

  it('days remaining depends on the selected environment', () => {
    const transit = doseSummary(100, 30, 'spacecraft-transit')
    const surface = doseSummary(100, 30, 'surface-base')
    const station = doseSummary(100, 30, 'orbital-station')
    expect(transit.daysRemaining).toBeCloseTo((600 - 155.2) / 1.84)
    expect(surface.daysRemaining).toBeCloseTo((600 - 155.2) / 0.64)
    expect(station.daysRemaining).toBeCloseTo((600 - 155.2) / 0.35)
    expect(surface.daysRemaining).toBeGreaterThan(transit.daysRemaining)
    // Environment changes today's rate, not dose already received.
    expect(surface.cumulative).toBe(transit.cumulative)
  })

  it('never reports negative days remaining', () => {
    expect(daysRemaining(700, 1.84)).toBe(0)
  })

  it.each([
    [299.9, 'nominal'],
    [300, 'watch'],
    [480, 'watch'],
    [480.1, 'action'],
  ])('%s mSv is %s', (dose, status) => {
    expect(rateDose(dose).status).toBe(status)
  })
})
