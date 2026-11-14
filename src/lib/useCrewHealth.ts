import { useMemo } from 'react'
import { CREW } from '../data/crew'
import { computeCrewHealth, type CrewHealth } from './health'
import { latestMissionDay } from './readings'
import { makeRoutineContext } from './routine'
import { useVigilStore } from './store'

export type { VitalRow } from './health'

const CREW_IDS = CREW.map((c) => c.id)

/** Health for every crew member plus the shared mission context, derived once from the store. */
export function useMissionHealth() {
  const crewId = useVigilStore((s) => s.crewId)
  const environmentId = useVigilStore((s) => s.environmentId)
  const readings = useVigilStore((s) => s.readings)
  const routineLog = useVigilStore((s) => s.routine)

  return useMemo(() => {
    const missionDay = latestMissionDay(readings)
    const routine = makeRoutineContext(readings, routineLog, CREW_IDS)
    const all: Record<string, CrewHealth> = {}
    for (const id of CREW_IDS) all[id] = computeCrewHealth(readings, id, environmentId, missionDay, routine)
    return { crewId, environmentId, missionDay, routine, all, selected: all[crewId] ?? all[CREW_IDS[0]] }
  }, [crewId, environmentId, readings, routineLog])
}

/** The selected crew member's health. Overview, Vitals and Body Map all read this, so they always agree. */
export function useCrewHealth() {
  const { selected, environmentId, missionDay } = useMissionHealth()
  return { ...selected, environmentId, missionDay }
}
