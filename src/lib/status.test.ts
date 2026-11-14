import { describe, expect, it } from 'vitest'
import { SOURCES } from '../data/sources'
import { THRESHOLDS } from '../data/thresholds'
import type { ScalarReading, ScalarVitalType, Status, ThresholdValue } from '../types'
import {
  evaluateVital,
  hrvSummary,
  rateBloodPressure,
  rateCognitive,
  rateExercise,
  rateGlucose,
  rateHeartRate,
  rateHrv,
  rateMood,
  rateSleep,
  rateSpo2,
  rateTemperature,
  rateVision,
} from './status'

const day = (vital: ScalarVitalType, d: number, value: number): ScalarReading => ({
  id: `${vital}-${d}`,
  crewId: 'c',
  vital,
  kind: 'scalar',
  value,
  missionDay: d,
  timestamp: new Date(Date.UTC(2031, 2, d, 7)).toISOString(),
  simulated: true,
})
const series = (vital: ScalarVitalType, values: number[], startDay = 1) => values.map((v, i) => day(vital, startDay + i, v))
const bp = (systolic: number, diastolic: number) => rateBloodPressure({ systolic, diastolic }).status

describe('threshold config', () => {
  it('uses exactly the supplied numbers', () => {
    const t = THRESHOLDS
    expect([t.bloodPressure.nominalSystolicBelow.value, t.bloodPressure.nominalDiastolicBelow.value]).toEqual([120, 80])
    expect([t.bloodPressure.actionSystolicAtLeast.value, t.bloodPressure.actionDiastolicAtLeast.value]).toEqual([140, 90])
    expect([t.bloodPressure.crisisSystolicAtLeast.value, t.bloodPressure.crisisDiastolicAtLeast.value]).toEqual([180, 120])
    expect([t.bloodPressure.lowSystolicBelow.value, t.bloodPressure.lowDiastolicBelow.value]).toEqual([90, 60])
    expect([t.heartRate.nominalMin.value, t.heartRate.nominalMax.value, t.heartRate.actionBelow.value, t.heartRate.actionAbove.value]).toEqual([60, 100, 40, 120])
    expect([t.hrv.baselineDays.value, t.hrv.watchBelowFraction.value, t.hrv.actionBelowFraction.value]).toEqual([14, 0.85, 0.7])
    expect([t.bloodGlucose.nominalMin.value, t.bloodGlucose.nominalMax.value, t.bloodGlucose.actionBelow.value, t.bloodGlucose.actionAtLeast.value]).toEqual([70, 99, 54, 126])
    expect([t.coreTemperature.nominalMin.value, t.coreTemperature.nominalMax.value, t.coreTemperature.watchLowMin.value, t.coreTemperature.feverAtLeast.value, t.coreTemperature.hypothermiaBelow.value]).toEqual([36.1, 37.5, 35.0, 38.0, 35.0])
    expect([t.sleepHours.nominalAtLeast.value, t.sleepHours.watchAtLeast.value, t.sleepHours.actionConsecutiveNights.value]).toEqual([7, 6, 3])
    expect([t.mood.nominalAtLeast.value, t.mood.actionAtMost.value, t.mood.declineDays.value]).toEqual([4, 2, 3])
    expect([t.cognitiveReadiness.nominalAtLeast.value, t.cognitiveReadiness.watchAtLeast.value]).toEqual([80, 60])
  })

  it('cites a registered source on every value', () => {
    const labels = new Set(Object.values(SOURCES).map((s) => s.label))
    const values = Object.values(THRESHOLDS).flatMap((group) =>
      Object.values(group).filter((x): x is ThresholdValue => typeof x === 'object' && x !== null && 'source' in x),
    )
    expect(values.length).toBeGreaterThan(30)
    for (const v of values) expect(labels.has(v.source), v.source).toBe(true)
  })

  it('marks every team-rule tier with the exact team source string', () => {
    expect(THRESHOLDS.heartRate.actionBelow.source).toBe('VIGIL triage rule (team-defined, not clinically validated)')
    expect(THRESHOLDS.coreTemperature.nominalMax.source).toBe(SOURCES.team.label)
    expect(THRESHOLDS.coreTemperature.feverAtLeast.source).toBe('CDC fever definition, 100.4 F / 38.0 C')
    expect(THRESHOLDS.bloodPressure.lowSystolicBelow.source).toBe('American Heart Association, low blood pressure')
  })
})

describe('blood pressure', () => {
  it.each<[number, number, Status]>([
    [119, 79, 'nominal'],
    [120, 79, 'watch'],
    [119, 80, 'watch'],
    [139, 89, 'watch'],
    [140, 70, 'action'],
    [110, 90, 'action'],
    [179, 119, 'action'],
    [89, 70, 'watch'],
    [90, 60, 'nominal'],
    [100, 59, 'watch'],
  ])('%i/%i is %s', (s, d, status) => expect(bp(s, d)).toBe(status))

  it('flags crisis at >=180 or >=120 as top-priority action', () => {
    expect(rateBloodPressure({ systolic: 180, diastolic: 70 })).toMatchObject({ status: 'action', priority: true })
    expect(rateBloodPressure({ systolic: 120, diastolic: 120 })).toMatchObject({ status: 'action', priority: true })
    expect(rateBloodPressure({ systolic: 179, diastolic: 119 }).priority).toBeUndefined()
  })

  it('rates on the worse of systolic and diastolic', () => {
    expect(bp(118, 92)).toBe('action')
    expect(bp(125, 70)).toBe('watch')
  })
})

describe('heart rate', () => {
  it.each<[number, Status]>([
    [39, 'action'],
    [40, 'watch'],
    [59, 'watch'],
    [60, 'nominal'],
    [100, 'nominal'],
    [101, 'watch'],
    [120, 'watch'],
    [121, 'action'],
  ])('%i bpm is %s', (h, status) => expect(rateHeartRate(h).status).toBe(status))

  it('carries the trained-crew note on low watch', () => {
    expect(rateHeartRate(55).detail).toContain('compare with personal baseline')
  })
})

describe('blood glucose', () => {
  it.each<[number, Status]>([
    [53, 'action'],
    [54, 'watch'],
    [69, 'watch'],
    [70, 'nominal'],
    [99, 'nominal'],
    [99.5, 'watch'],
    [100, 'watch'],
    [125, 'watch'],
    [126, 'action'],
  ])('%s mg/dL is %s', (g, status) => expect(rateGlucose(g).status).toBe(status))
})

describe('core temperature', () => {
  it.each<[number, Status]>([
    [34.9, 'action'],
    [35.0, 'watch'],
    [35.9, 'watch'],
    [36.0, 'watch'],
    [36.1, 'nominal'],
    [37.5, 'nominal'],
    [37.6, 'watch'],
    [37.9, 'watch'],
    [38.0, 'action'],
    [38.3, 'action'],
  ])('%s °C is %s', (c, status) => expect(rateTemperature(c).status).toBe(status))
})

describe('cognitive readiness', () => {
  it.each<[number, Status]>([
    [59, 'action'],
    [60, 'watch'],
    [79, 'watch'],
    [80, 'nominal'],
  ])('%i is %s', (c, status) => expect(rateCognitive(c).status).toBe(status))
})

describe('sleep (history rule)', () => {
  const rate = (values: number[]) => rateSleep(series('sleepHours', values)).status
  it('7 h or more is nominal', () => expect(rate([7])).toBe('nominal'))
  it('6 to 6.9 h is watch', () => {
    expect(rate([6])).toBe('watch')
    expect(rate([6.9])).toBe('watch')
  })
  it('one or two short nights is watch', () => {
    expect(rate([7.5, 5.5])).toBe('watch')
    expect(rate([7.5, 5.9, 5.5])).toBe('watch')
  })
  it('under 6 h on 3 consecutive nights is action', () => expect(rate([7.5, 5.9, 5.5, 5.8])).toBe('action'))
  it('6.0 breaks the streak', () => expect(rate([5.5, 6.0, 5.5])).toBe('watch'))
  it('a missing day breaks consecutiveness', () => {
    const h = [day('sleepHours', 1, 5), day('sleepHours', 2, 5), day('sleepHours', 4, 5)]
    expect(rateSleep(h).status).toBe('watch')
  })
})

describe('mood (history rule)', () => {
  const rate = (values: number[]) => rateMood(series('mood', values)).status
  it.each<[number[], Status]>([
    [[5], 'nominal'],
    [[4], 'nominal'],
    [[3], 'watch'],
    [[2], 'action'],
    [[1], 'action'],
    [[5, 4, 3], 'action'],
    [[4, 4, 3], 'watch'],
    [[5, 5, 4], 'nominal'],
  ])('%j is %s', (values, status) => expect(rate(values)).toBe(status))
})

describe('HRV (baseline rule)', () => {
  const fourteen = Array(14).fill(50)
  it('uses the day 1-14 mean as baseline', () => {
    expect(hrvSummary(series('hrv', [...fourteen, 40, 40])).baseline).toBe(50)
  })
  it.each<[number, Status]>([
    [50, 'nominal'],
    [42.5, 'nominal'], // exactly 85%
    [42, 'watch'],
    [35, 'watch'], // exactly 70%
    [34.9, 'action'],
  ])('7-day mean %s against baseline 50 is %s', (m, status) => {
    expect(rateHrv(series('hrv', [...fourteen, ...Array(7).fill(m)])).status).toBe(status)
  })
  it('without baseline days it is nodata, not a crash', () => {
    expect(rateHrv(series('hrv', [50], 20))).toMatchObject({ status: 'nodata', reason: 'insufficient-history' })
    expect(rateHrv([]).reason).toBe('no-reading')
  })
})

describe('evaluateVital', () => {
  it('returns no-reading for empty history', () => {
    expect(evaluateVital('heartRate', []).reason).toBe('no-reading')
  })
  it('logs imaging without rating it', () => {
    const img = { ...day('heartRate', 1, 0), kind: 'imaging', vital: 'imagingLog', modality: 'bone', zone: 'bones-muscles', finding: '' } as never
    expect(evaluateVital('imagingLog', [img])).toMatchObject({ status: 'nodata', reason: 'logged' })
  })
  it('rates the latest reading by timestamp', () => {
    const later = { ...day('heartRate', 1, 130), timestamp: new Date(Date.UTC(2031, 2, 1, 9)).toISOString() }
    expect(evaluateVital('heartRate', [later, day('heartRate', 1, 70)]).status).toBe('action')
  })
})

describe('SpO2', () => {
  it.each<[number, Status]>([
    [100, 'nominal'],
    [95, 'nominal'],
    [94, 'watch'],
    [94.5, 'watch'],
    [90, 'watch'],
    [89, 'action'],
  ])('%s%% is %s', (v, status) => expect(rateSpo2(v).status).toBe(status))
  it('cites the WHO manual', () => {
    expect(THRESHOLDS.spo2.nominalAtLeast.source).toBe('WHO Pulse Oximetry Training Manual (2011)')
    expect(rateSpo2(85).detail).toContain('emergency')
  })
})

describe('vision self-check', () => {
  it('yes is watch and suggests an ocular ultrasound; no is nominal', () => {
    expect(rateVision(1)).toMatchObject({ status: 'watch' })
    expect(rateVision(1).detail).toContain('ocular ultrasound')
    expect(rateVision(0).status).toBe('nominal')
    expect(THRESHOLDS.visionCheck.changeIsWatch.source).toBe(SOURCES.team.label)
  })
})

describe('exercise adherence', () => {
  it.each<[number, Status]>([
    [7, 'nominal'],
    [6, 'nominal'],
    [5, 'watch'],
    [4, 'watch'],
    [3, 'action'],
    [0, 'action'],
  ])('%i sessions in 7 days is %s', (n, status) => expect(rateExercise(n).status).toBe(status))
  it('cites the two NASA HRP risks in its note', () => {
    expect(THRESHOLDS.exerciseAdherence.note).toContain('Spaceflight-Induced Bone Changes')
    expect(THRESHOLDS.exerciseAdherence.note).toContain('Reduced Cardiorespiratory and Musculoskeletal Fitness')
  })
})

describe('rating basis (the tier that was crossed)', () => {
  it('a fever cites the CDC definition only', () => {
    expect(rateTemperature(38.3).basis).toEqual([SOURCES.cdcFever.label])
  })
  it('hypothermia cites the hypothermia definition only', () => {
    expect(rateTemperature(34.5).basis).toEqual([SOURCES.hypothermia.label])
  })
  it('a hypertensive crisis cites the AHA categories and stays priority', () => {
    const r = rateBloodPressure({ systolic: 185, diastolic: 100 })
    expect(r.basis).toEqual([SOURCES.aha2017.label])
    expect(r.priority).toBe(true)
  })
})
