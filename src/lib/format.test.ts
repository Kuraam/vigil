import { describe, expect, it } from 'vitest'
import { formatReading } from './format'
import type { ImagingReading, PressureReading, ScalarReading } from '../types'

const base = { id: 'x', crewId: 'c', missionDay: 3, timestamp: '2026-01-01T00:00:00Z', simulated: true as const }

describe('formatReading', () => {
  it('formats blood pressure as systolic/diastolic mmHg', () => {
    const r: PressureReading = { ...base, kind: 'pressure', vital: 'bloodPressure', systolic: 118, diastolic: 76 }
    expect(formatReading(r)).toEqual({ value: '118/76', unit: 'mmHg' })
  })

  it('formats core temperature to one decimal place', () => {
    const r: ScalarReading = { ...base, kind: 'scalar', vital: 'coreTemperature', value: 36.94 }
    expect(formatReading(r)).toEqual({ value: '36.9', unit: '°C' })
  })

  it('formats glucose as whole mg/dL', () => {
    const r: ScalarReading = { ...base, kind: 'scalar', vital: 'bloodGlucose', value: 92.6 }
    expect(formatReading(r)).toEqual({ value: '93', unit: 'mg/dL' })
  })

  it('formats imaging entries by scan type with no NaN', () => {
    const r: ImagingReading = { ...base, kind: 'imaging', vital: 'imagingLog', zone: 'eyes', modality: 'ocular-ultrasound', finding: 'n' }
    const out = formatReading(r)
    expect(out.value).toBe('Ocular ultrasound')
    expect(out.value + out.unit).not.toContain('NaN')
  })
})
