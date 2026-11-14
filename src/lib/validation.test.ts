import { describe, expect, it } from 'vitest'
import { ENTRY_LIMITS, validateEntry } from './validation'

describe('validateEntry', () => {
  it('accepts a valid heart rate', () => {
    expect(validateEntry('heartRate', { value: '72' })).toEqual({ ok: true, values: { value: 72 } })
  })

  it('rejects empty, non-numeric and out-of-range input with a field error', () => {
    expect(validateEntry('heartRate', { value: '' })).toMatchObject({ ok: false, errors: { value: expect.stringContaining('Enter') } })
    expect(validateEntry('heartRate', { value: 'abc' })).toMatchObject({ ok: false, errors: { value: expect.stringContaining('number') } })
    expect(validateEntry('heartRate', { value: '400' })).toMatchObject({ ok: false, errors: { value: expect.stringContaining('20') } })
  })

  it('accepts decimals with a comma or dot for temperature', () => {
    expect(validateEntry('coreTemperature', { value: '37,2' })).toEqual({ ok: true, values: { value: 37.2 } })
    expect(validateEntry('coreTemperature', { value: '37.2' })).toEqual({ ok: true, values: { value: 37.2 } })
  })

  it('requires whole numbers for mood and cognitive readiness', () => {
    expect(validateEntry('mood', { value: '3.5' })).toMatchObject({ ok: false })
    expect(validateEntry('mood', { value: '6' })).toMatchObject({ ok: false })
    expect(validateEntry('mood', { value: '3' })).toEqual({ ok: true, values: { value: 3 } })
    expect(validateEntry('cognitiveReadiness', { value: '101' })).toMatchObject({ ok: false })
  })

  it('validates both blood pressure fields and that systolic is above diastolic', () => {
    expect(validateEntry('bloodPressure', { systolic: '118', diastolic: '76' })).toEqual({
      ok: true,
      values: { systolic: 118, diastolic: 76 },
    })
    expect(validateEntry('bloodPressure', { systolic: '', diastolic: '76' })).toMatchObject({ ok: false, errors: { systolic: expect.any(String) } })
    expect(validateEntry('bloodPressure', { systolic: '70', diastolic: '80' })).toMatchObject({
      ok: false,
      errors: { systolic: expect.stringContaining('higher than diastolic') },
    })
  })

  it('accepts the entry-range edges and rejects just outside', () => {
    const { min, max } = ENTRY_LIMITS.sleepHours
    expect(validateEntry('sleepHours', { value: String(min) }).ok).toBe(true)
    expect(validateEntry('sleepHours', { value: String(max) }).ok).toBe(true)
    expect(validateEntry('sleepHours', { value: String(max + 0.1) }).ok).toBe(false)
  })
})
