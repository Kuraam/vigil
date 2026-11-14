import { describe, expect, it } from 'vitest'
import { THRESHOLDS } from '../data/thresholds'
import { evaluateStatus } from './status'
import type { ScalarReading, ThresholdBound, ThresholdConfig, VitalThreshold } from '../types'

const hr = (value: number): ScalarReading => ({
  id: 'r1',
  crewId: 'c1',
  vital: 'heartRate',
  kind: 'scalar',
  value,
  missionDay: 1,
  timestamp: '2026-01-01T00:00:00Z',
  simulated: true,
})

const b = (value: number): ThresholdBound => ({ value, unit: 'bpm', source: 'TEST FIXTURE, not clinical' })
const band = (nMin: number, nMax: number, wMin: number, wMax: number): VitalThreshold => ({
  nominal: { min: b(nMin), max: b(nMax) },
  watch: { min: b(wMin), max: b(wMax) },
})

// Arbitrary fixture numbers used only to exercise the comparison logic.
const fixture: ThresholdConfig = { ...THRESHOLDS, heartRate: band(10, 20, 5, 30) }

describe('evaluateStatus', () => {
  it('returns nodata/no-reading when there is no reading', () => {
    expect(evaluateStatus(undefined, THRESHOLDS)).toEqual({ status: 'nodata', reason: 'no-reading' })
  })

  it('never claims a status while shipped thresholds are TODO placeholders', () => {
    expect(evaluateStatus(hr(60), THRESHOLDS)).toEqual({ status: 'nodata', reason: 'threshold-pending' })
  })

  it('returns threshold-pending for imaging entries (no numeric comparison)', () => {
    expect(
      evaluateStatus(
        { ...hr(0), kind: 'imaging', vital: 'imagingLog', zone: 'neck', modality: 'ultrasound', note: '' } as never,
        fixture,
      ).reason,
    ).toBe('threshold-pending')
  })

  it('classifies nominal, watch and action bands once thresholds exist', () => {
    expect(evaluateStatus(hr(15), fixture)).toEqual({ status: 'nominal', reason: 'in-range' })
    expect(evaluateStatus(hr(25), fixture)).toEqual({ status: 'watch', reason: 'watch-range' })
    expect(evaluateStatus(hr(7), fixture)).toEqual({ status: 'watch', reason: 'watch-range' })
    expect(evaluateStatus(hr(40), fixture)).toEqual({ status: 'action', reason: 'action-range' })
  })

  it('takes the worse of systolic and diastolic for blood pressure', () => {
    const bp = { ...fixture, systolic: band(10, 20, 5, 30), diastolic: band(10, 20, 5, 30) }
    const reading = { ...hr(0), kind: 'pressure', vital: 'bloodPressure', systolic: 15, diastolic: 40 } as never
    expect(evaluateStatus(reading, bp).status).toBe('action')
  })
})
