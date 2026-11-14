import { describe, expect, it } from 'vitest'
import { DEFAULT_CREW_ID } from '../data/crew'
import { DEFAULT_ENVIRONMENT_ID } from '../data/environments'
import { generateReadings, generateRoutine } from '../data/simulate'
import { useVigilStore } from './store'

describe('reset demo data', () => {
  it('restores the seeded state after changes', () => {
    const s = useVigilStore.getState()
    s.setCrew('crew-04')
    s.setEnvironment('surface-base')
    s.addReading({ id: 'x', crewId: 'crew-04', vital: 'heartRate', kind: 'scalar', value: 150, missionDay: 30, timestamp: '2031-03-30T12:00:00.000Z', simulated: false })
    s.setTask('crew-04', 30, 'exercise', '2031-03-30T12:00:00.000Z')
    s.saveRun({ id: 'r', protocolId: 'fever', crewId: 'crew-04', alertKey: 'k', startedAt: '', steps: {}, answers: {}, measurements: [] })
    s.setSpeWarning(true)
    s.setBriefQuestions('q')

    useVigilStore.getState().resetSimulation()
    const after = useVigilStore.getState()
    expect(after.crewId).toBe(DEFAULT_CREW_ID)
    expect(after.environmentId).toBe(DEFAULT_ENVIRONMENT_ID)
    expect(after.readings).toEqual(generateReadings())
    expect(after.routine).toEqual(generateRoutine())
    expect(after.runs).toEqual([])
    expect(after.speWarning).toBe(false)
    expect(after.briefQuestions).toBe('')
  })
})

describe('default crew member', () => {
  it('opens on Arjun Sethi (the fever case) on first visit and after reset', () => {
    expect(DEFAULT_CREW_ID).toBe('crew-04')
    useVigilStore.getState().setCrew('crew-02')
    useVigilStore.getState().resetSimulation()
    expect(useVigilStore.getState().crewId).toBe('crew-04')
  })
})
