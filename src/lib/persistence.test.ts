import { describe, expect, it } from 'vitest'
import { DEFAULT_CREW_ID } from '../data/crew'
import { DEFAULT_ENVIRONMENT_ID } from '../data/environments'
import { SIM_SEED } from '../data/simulate'
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

  it('keeps readings only when they came from the current seed', () => {
    const readings = [{ id: 'x' }]
    expect(sanitizePersisted({ simSeed: SIM_SEED, readings }).readings).toBe(readings)
    expect(sanitizePersisted({ simSeed: SIM_SEED - 1, readings }).readings).toBeUndefined()
    expect(sanitizePersisted({ simSeed: SIM_SEED, readings: 'bad' }).readings).toBeUndefined()
  })
})
