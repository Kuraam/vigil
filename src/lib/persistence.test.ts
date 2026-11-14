import { describe, expect, it } from 'vitest'
import { DEFAULT_CREW_ID } from '../data/crew'
import { DEFAULT_ENVIRONMENT_ID } from '../data/environments'
import { SIM_SEED, SIM_VERSION } from '../data/simulate'
import { sanitizePersisted } from './persistence'

describe('sanitizePersisted', () => {
  it('returns an empty patch for garbage input', () => {
    expect(sanitizePersisted(null)).toEqual({})
    expect(sanitizePersisted('nope')).toEqual({})
    expect(sanitizePersisted(42)).toEqual({})
  })

  it('keeps valid selections', () => {
    expect(sanitizePersisted({ crewId: 'crew-03', environmentId: 'surface-base' })).toEqual({
      crewId: 'crew-03',
      environmentId: 'surface-base',
    })
  })

  it('drops an unknown crew id or environment id', () => {
    const patch = sanitizePersisted({ crewId: 'ghost', environmentId: 'moon-hotel' })
    expect(patch.crewId).toBeUndefined()
    expect(patch.environmentId).toBeUndefined()
    expect({ crewId: DEFAULT_CREW_ID, environmentId: DEFAULT_ENVIRONMENT_ID, ...patch }).toEqual({
      crewId: DEFAULT_CREW_ID,
      environmentId: DEFAULT_ENVIRONMENT_ID,
    })
  })

  it('keeps readings only when they came from the current seed and generator version', () => {
    const readings = [{ id: 'x' }]
    const ok = { simSeed: SIM_SEED, simVersion: SIM_VERSION }
    expect(sanitizePersisted({ ...ok, readings }).readings).toBe(readings)
    expect(sanitizePersisted({ ...ok, simSeed: SIM_SEED - 1, readings }).readings).toBeUndefined()
    expect(sanitizePersisted({ ...ok, readings: 'bad' }).readings).toBeUndefined()
  })

  it('discards Phase 1 saved data (no generator version)', () => {
    expect(sanitizePersisted({ simSeed: SIM_SEED, readings: [{ id: 'x' }] }).readings).toBeUndefined()
  })
})

describe('sanitizePersisted (phase 3 fields)', () => {
  const ok = { simSeed: SIM_SEED, simVersion: SIM_VERSION, readings: [] }
  it('keeps routine and runs only with current data', () => {
    expect(sanitizePersisted({ ...ok, routine: { a: {} }, runs: [] })).toMatchObject({ routine: { a: {} }, runs: [] })
    expect(sanitizePersisted({ ...ok, simVersion: 2, routine: { a: {} }, runs: [] }).routine).toBeUndefined()
    expect(sanitizePersisted({ ...ok, routine: [], runs: 'x' })).not.toHaveProperty('runs')
  })
  it('keeps the SPE toggle and brief questions when well-typed', () => {
    expect(sanitizePersisted({ speWarning: true, briefQuestions: 'q' })).toEqual({ speWarning: true, briefQuestions: 'q' })
    expect(sanitizePersisted({ speWarning: 'yes' })).toEqual({})
  })
})
