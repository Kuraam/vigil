import { describe, expect, it } from 'vitest'
import { BODY_ZONES } from '../data/bodyZones'
import type { StatusResult } from '../types'
import { rollUpZone } from './zones'

const r = (status: StatusResult['status'], priority = false): StatusResult =>
  status === 'nodata' ? { status, reason: 'no-reading', detail: '' } : { status, reason: 'rated', detail: status, ...(priority ? { priority } : {}) }

describe('rollUpZone', () => {
  it('takes the worst status of the linked indicators', () => {
    expect(rollUpZone([r('nominal'), r('watch'), r('nominal')]).status).toBe('watch')
    expect(rollUpZone([r('watch'), r('action'), r('nominal')]).status).toBe('action')
    expect(rollUpZone([r('nominal'), r('nominal')]).status).toBe('nominal')
  })

  it('ignores indicators without data when others are rated', () => {
    expect(rollUpZone([r('nodata'), r('nominal')]).status).toBe('nominal')
  })

  it('is nodata when nothing is linked or nothing is rated', () => {
    expect(rollUpZone([])).toMatchObject({ status: 'nodata' })
    expect(rollUpZone([r('nodata')]).status).toBe('nodata')
  })

  it('reads Logged when only imaging entries exist, and ratings still win over imaging', () => {
    expect(rollUpZone([], true)).toMatchObject({ status: 'nodata', reason: 'logged' })
    expect(rollUpZone([r('watch')], true).status).toBe('watch')
  })

  it('keeps the priority flag of a crisis', () => {
    expect(rollUpZone([r('action'), r('action', true)]).priority).toBe(true)
  })
})

describe('zone data', () => {
  it('has the eight zones with the exact names', () => {
    expect(BODY_ZONES.map((z) => z.name)).toEqual([
      'Brain and behaviour',
      'Eyes',
      'Heart and circulation',
      'Lungs',
      'Gut and nutrition',
      'Bones and muscles',
      'Immune system and blood',
      'Skin and temperature regulation',
    ])
  })

  it('links every zone to at least one named NASA HRP risk on the Risks page', () => {
    for (const z of BODY_ZONES) {
      expect(z.risks.length, z.id).toBeGreaterThan(0)
      for (const k of z.risks) expect(k.url).toBe('https://www.nasa.gov/hrp/risks/')
    }
    expect(BODY_ZONES.find((z) => z.id === 'eyes')!.risks[0].name).toBe('Spaceflight Associated Neuro-ocular Syndrome (SANS)')
  })

  it('gives every zone without a rating an explanation', () => {
    for (const z of BODY_ZONES) if (z.indicators.length === 0) expect(z.untrackedNote, z.id).toBeTruthy()
  })
})
