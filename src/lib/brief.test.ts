import { describe, expect, it } from 'vitest'
import { CREW } from '../data/crew'
import { generateReadings, generateRoutine, SIM_DAYS } from '../data/simulate'
import { buildAlerts } from './alerts'
import { briefContents, briefSizeKb, buildBrief, trend7 } from './brief'
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

describe('brief preview', () => {
  it('counts match what the built brief contains', () => {
    const alerts = buildAlerts(ms)
    const c = briefContents([ms], alerts, [run], SIM_DAYS)
    expect(c.action).toBe(alerts.filter((a) => a.result.status === 'action').length)
    expect(c.watch).toBe(alerts.filter((a) => a.result.status === 'watch').length)
    expect(c.runs).toBe(1)
    expect(brief).toContain(`ACTIVE ALERTS (${c.action + c.watch})`)
    const trendBlock = brief.split('7-DAY TRENDS (min / mean / max)\n')[1].split('\n\n')[0]
    expect(trendBlock.split('\n').length).toBe(c.trends)
  })

  it('only counts runs and alerts for the crew in scope', () => {
    const c = briefContents([ms], buildAlerts(ms), [{ ...run, crewId: 'crew-01' }], SIM_DAYS)
    expect(c.runs).toBe(0)
  })

  it('the fever alert line cites the CDC definition, not hypothermia', () => {
    const lines = brief.split('\n')
    const i = lines.findIndex((l) => l.includes('[ACTION] Core temperature 38.3'))
    expect(i).toBeGreaterThan(-1)
    const src = lines[i + 1]
    expect(src).toContain('CDC fever definition')
    expect(src).not.toContain('hypothermia')
  })
})
