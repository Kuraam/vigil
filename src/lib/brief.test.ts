import { describe, expect, it } from 'vitest'
import { CREW } from '../data/crew'
import { generateReadings, generateRoutine, SIM_DAYS } from '../data/simulate'
import { buildAlerts } from './alerts'
import { briefSizeKb, buildBrief, trend7 } from './brief'
import { computeCrewHealth } from './health'
import { answer, startRun, toggleStep } from './protocolRun'
import { makeRoutineContext } from './routine'

const readings = generateReadings()
const routine = makeRoutineContext(readings, generateRoutine(), CREW.map((c) => c.id))
const ms = computeCrewHealth(readings, 'crew-04', 'surface-base', SIM_DAYS, routine)
const at = (m: number) => new Date(Date.UTC(2031, 2, 30, 8, m, 5)).toISOString()

let run = startRun('fever', 'crew-04', 'crew-04:coreTemperature', at(0))
run = toggleStep(run, 'act-rest', at(4))
run = answer(run, 'rf-stiff-neck', false, at(2))

const brief = buildBrief({
  healths: [ms],
  alerts: buildAlerts(ms),
  runs: [run],
  environmentId: 'surface-base',
  missionDay: SIM_DAYS,
  routine,
  questions: 'Should we start the onboard kit?',
  generatedAt: at(10),
})

describe('downlink brief', () => {
  it('is labelled as simulated and states mission day, environment and delay', () => {
    expect(brief).toContain('Simulated data. Concept demonstration.')
    expect(brief).toContain('Mission day 30')
    expect(brief).toContain('Environment: Surface Base')
    expect(brief).toContain('One-way delay: 3.0 to 22.3 min')
    expect(brief).toContain('Escalation: Crew-autonomous')
  })

  it('lists current statuses and active alerts with threshold and source', () => {
    expect(brief).toMatch(/ACTION\s+Core temperature 38\.3 °C/)
    expect(brief).toContain('CDC fever definition, 100.4 F / 38.0 C')
  })

  it('includes protocol steps with mission timestamps, in order', () => {
    expect(brief).toContain('Fever / high core temperature')
    const started = brief.indexOf('Day 30, 08:00:05  Started')
    const answered = brief.indexOf('Day 30, 08:02:05  Red flag "Stiff neck": no')
    const rested = brief.indexOf('Day 30, 08:04:05  Rest.')
    expect(started).toBeGreaterThan(-1)
    expect(answered).toBeGreaterThan(started)
    expect(rested).toBeGreaterThan(answered)
  })

  it('has 7-day trends, radiation, routine and the flight surgeon questions', () => {
    expect(brief).toMatch(/Core temperature \(°C\): [\d.]+ \/ [\d.]+ \/ 38\.3/)
    expect(brief).toMatch(/[\d.]+ mSv of 600 mSv career limit/)
    expect(brief).toMatch(/Exercise: \d\/7 days/)
    expect(brief).toContain('Should we start the onboard kit?')
  })

  it('computes min / mean / max over the last 7 days', () => {
    const t = trend7(ms.byVital.coreTemperature.history, SIM_DAYS)
    expect(t?.max).toBe(38.3)
    expect(t?.n).toBe(7)
  })

  it('stays compact plain text and reports its size', () => {
    expect(brief).not.toMatch(/<[a-z]/i)
    expect(briefSizeKb(brief)).toBeGreaterThan(0)
    expect(briefSizeKb(brief)).toBeLessThan(10)
  })
})
