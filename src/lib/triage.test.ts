import { describe, expect, it } from 'vitest'
import { CREW } from '../data/crew'
import { PROTOCOLS, MED_KIT_LINE, PROTOCOL_DISCLAIMER } from '../data/protocols'
import { generateReadings, generateRoutine, SIM_DAYS } from '../data/simulate'
import type { StatusResult } from '../types'
import { buildAlerts, sortAlerts, type Alert } from './alerts'
import { AUTONOMOUS_LINE, escalationFor, GROUND_LINE, NOTIFY_LINE } from './escalation'
import { computeCrewHealth } from './health'
import { addMeasurement, answer, completeRun, findResumable, phaseDone, progress, redFlagRaised, runTimeline, startRun, toggleStep } from './protocolRun'
import { makeRoutineContext } from './routine'

const readings = generateReadings()
const ctx = makeRoutineContext(readings, generateRoutine(), CREW.map((c) => c.id))
const health = (id: string) => computeCrewHealth(readings, id, 'spacecraft-transit', SIM_DAYS, ctx)

const res = (status: StatusResult['status'], priority = false): StatusResult => ({ status, reason: 'rated', detail: '', ...(priority ? { priority } : {}) })
const alert = (key: string, status: StatusResult['status'], at: string, priority = false) =>
  ({ key, result: res(status, priority), at }) as Alert

describe('alerts', () => {
  it('mission specialist has a fever alert with the fever protocol and its source', () => {
    const alerts = sortAlerts(buildAlerts(health('crew-04')))
    expect(alerts[0]).toMatchObject({ indicator: 'coreTemperature', protocolId: 'fever', value: '38.3 °C' })
    expect(alerts[0].result.status).toBe('action')
    expect(alerts[0].sources).toContain('CDC fever definition, 100.4 F / 38.0 C')
    expect(alerts.find((a) => a.indicator === 'heartRate')).toMatchObject({ protocolId: 'high-heart-rate' })
  })

  it('flight engineer has a sleep-debt alert', () => {
    expect(buildAlerts(health('crew-03')).find((a) => a.indicator === 'sleepHours')).toMatchObject({ protocolId: 'sleep-debt' })
  })

  it('sorts action before watch, crisis first, then most recent', () => {
    const sorted = sortAlerts([
      alert('w-old', 'watch', '2031-03-01T00:00:00Z'),
      alert('a-old', 'action', '2031-03-01T00:00:00Z'),
      alert('w-new', 'watch', '2031-03-05T00:00:00Z'),
      alert('a-new', 'action', '2031-03-05T00:00:00Z'),
      alert('crisis', 'action', '2031-02-01T00:00:00Z', true),
    ])
    expect(sorted.map((a) => a.key)).toEqual(['crisis', 'a-new', 'a-old', 'w-new', 'w-old'])
  })

  it('adds a radiation alert for the solar particle event toggle', () => {
    const a = buildAlerts(health('crew-01'), { speWarning: true }).find((x) => x.indicator === 'spe')
    expect(a).toMatchObject({ protocolId: 'radiation', result: { status: 'action' } })
  })
})

describe('escalation rule', () => {
  it('Orbital Station is ground-guided with a round trip under 2 s', () => {
    const e = escalationFor('orbital-station')
    expect(e).toMatchObject({ mode: 'ground', modeLabel: 'Ground-guided', replyEta: 'Under 2 s', lines: [GROUND_LINE] })
  })
  it('Mars environments are crew-autonomous with 2 × one-way delay', () => {
    expect(escalationFor('surface-base')).toMatchObject({ mode: 'autonomous', replyEta: '6.1 min to 44.6 min', lines: [AUTONOMOUS_LINE] })
    expect(escalationFor('pressurized-rover').mode).toBe('autonomous')
    expect(escalationFor('spacecraft-transit').replyEta).toBe('Up to 44.6 min')
  })
  it('adds the notify line for a red flag or action status', () => {
    expect(escalationFor('surface-base', { redFlag: true }).lines).toContain(NOTIFY_LINE)
    expect(escalationFor('orbital-station', { action: true }).lines).toEqual([GROUND_LINE, NOTIFY_LINE])
    expect(escalationFor('surface-base').lines).not.toContain(NOTIFY_LINE)
  })
})

describe('protocol runs', () => {
  const def = PROTOCOLS.fever
  const t = (m: number) => new Date(Date.UTC(2031, 2, 30, 8, m)).toISOString()

  it('records a timestamp per step and can be resumed', () => {
    let run = startRun('fever', 'crew-04', 'crew-04:coreTemperature', t(0))
    run = toggleStep(run, 'act-rest', t(5))
    expect(run.steps['act-rest']).toBe(t(5))
    expect(findResumable([run], 'crew-04', 'fever')?.id).toBe(run.id)
    expect(findResumable([completeRun(run, t(9))], 'crew-04', 'fever')).toBeUndefined()
    expect(findResumable([run], 'crew-01', 'fever')).toBeUndefined()
    run = toggleStep(run, 'act-rest', null)
    expect(run.steps['act-rest']).toBeUndefined()
  })

  it('raises the red flag on any red-flag yes', () => {
    let run = startRun('fever', 'crew-04', 'k', t(0))
    run = answer(run, 'rf-confusion', false, t(1))
    expect(redFlagRaised(run, def)).toBe(false)
    run = answer(run, 'rf-stiff-neck', true, t(2))
    expect(redFlagRaised(run, def)).toBe(true)
  })

  it('tracks phases, progress and a chronological timeline', () => {
    let run = startRun('fever', 'crew-04', 'k', t(0))
    run = toggleStep(run, 'confirm-remeasure', t(3))
    run = addMeasurement(run, 'r1', 'Core temperature 37.4 °C', t(2))
    expect(phaseDone(run, def, 'confirm')).toBe(true)
    expect(phaseDone(run, def, 'act')).toBe(false)
    expect(progress(run, def)).toEqual({ done: 1, total: def.steps.length + def.symptoms.length })
    expect(runTimeline(run, def).map((x) => x.at)).toEqual([t(0), t(2), t(3)])
  })
})

describe('protocol content safety', () => {
  it('uses the medical kit line and never a medication name or dose unit', () => {
    const banned = /\b(mg|mcg|ml|tablet|pill|dose of|paracetamol|acetaminophen|ibuprofen|aspirin|insulin|glucagon|oxygen therapy)\b/i
    for (const p of Object.values(PROTOCOLS)) {
      const text = JSON.stringify(p).replace(/mg\/dL/g, '')
      expect(text, p.id).not.toMatch(banned)
    }
    expect(PROTOCOLS.fever.steps.some((s) => s.text === MED_KIT_LINE)).toBe(true)
    expect(PROTOCOL_DISCLAIMER).toBe('Concept guidance for demonstration. Not medical advice.')
  })

  it('every protocol has the 4 parts and an escalate step', () => {
    for (const p of Object.values(PROTOCOLS)) {
      expect(p.steps.some((s) => s.phase === 'confirm'), p.id).toBe(true)
      expect(p.steps.some((s) => s.phase === 'act'), p.id).toBe(true)
      expect(p.steps.some((s) => s.phase === 'escalate'), p.id).toBe(true)
    }
  })
})

describe('phase 4 protocols', () => {
  it('vision change: test each eye, red flags escalate, links SANS', () => {
    const p = PROTOCOLS['vision-change']
    expect(p.howToMeasure[0]).toContain('each eye separately')
    expect(p.symptoms.filter((s) => s.redFlag).map((s) => s.text)).toEqual(['Sudden vision loss', 'Severe headache', 'Eye pain'])
    expect(p.steps.map((s) => s.text).join(' ')).toContain('ocular ultrasound')
    expect(p.steps.map((s) => s.text).join(' ')).toContain('next Downlink brief')
    expect(p.risks).toEqual(['Spaceflight Associated Neuro-ocular Syndrome (SANS)'])
  })

  it('low exercise: make-up session prioritising resistance, links both musculoskeletal risks', () => {
    const p = PROTOCOLS['low-exercise']
    expect(p.steps.map((s) => s.text)).toContain('Schedule a make-up session today, prioritising the resistance exercise.')
    expect(p.steps.map((s) => s.text)).toContain('Flag schedule conflicts to the commander.')
    expect(p.risks).toEqual(['Spaceflight-Induced Bone Changes', 'Reduced Cardiorespiratory and Musculoskeletal Fitness'])
  })

  it('alerts route vision changes and low adherence to the new protocols', () => {
    expect(buildAlerts(health('crew-04')).find((a) => a.indicator === 'exerciseAdherence')?.protocolId).toBe('low-exercise')
    const changed = [...readings, { id: 'v', crewId: 'crew-01', vital: 'visionCheck', kind: 'scalar', value: 1, missionDay: SIM_DAYS, timestamp: '2031-03-30T12:00:00.000Z', simulated: false } as const]
    const h = computeCrewHealth(changed, 'crew-01', 'spacecraft-transit', SIM_DAYS, ctx)
    expect(buildAlerts(h).find((a) => a.indicator === 'visionCheck')).toMatchObject({ protocolId: 'vision-change', result: { status: 'watch' } })
  })
})
