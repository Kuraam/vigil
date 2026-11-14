import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import { DEFAULT_CREW_ID } from '../data/crew'
import { DEFAULT_ENVIRONMENT_ID } from '../data/environments'
import { generateReadings, generateRoutine, SIM_SEED, SIM_VERSION } from '../data/simulate'
import type { EnvironmentId, ProtocolRun, RoutineTaskId, VitalReading } from '../types'
import { sanitizePersisted, type PersistedSlice } from './persistence'

interface VigilState extends PersistedSlice {
  setCrew: (crewId: string) => void
  setEnvironment: (environmentId: EnvironmentId) => void
  /** Add a reading a person logged in the app. It is saved and shown everywhere at once. */
  addReading: (reading: VitalReading) => void
  /** Tick or untick a routine task for a crew member on a mission day. */
  setTask: (crewId: string, day: number, task: RoutineTaskId, at: string | null) => void
  /** Insert or replace a protocol run (runs are immutable values built in lib/protocolRun). */
  saveRun: (run: ProtocolRun) => void
  setSpeWarning: (on: boolean) => void
  setBriefQuestions: (text: string) => void
  /** Restore the seeded demo state: regenerated data, default crew and environment, nothing logged. */
  resetSimulation: () => void
}

export const STORE_KEY = 'vigil-store'
const STORE_VERSION = 3

const fresh = () => ({
  simSeed: SIM_SEED,
  simVersion: SIM_VERSION,
  readings: generateReadings(SIM_SEED),
  routine: generateRoutine(SIM_SEED),
  runs: [] as ProtocolRun[],
})

export const useVigilStore = create<VigilState>()(
  persist(
    (set) => ({
      crewId: DEFAULT_CREW_ID,
      environmentId: DEFAULT_ENVIRONMENT_ID,
      speWarning: false,
      briefQuestions: '',
      ...fresh(),
      setCrew: (crewId) => set({ crewId }),
      setEnvironment: (environmentId) => set({ environmentId }),
      addReading: (reading) => set((s) => ({ readings: [...s.readings, reading] })),
      setTask: (crewId, day, task, at) =>
        set((s) => {
          const days = { ...(s.routine[crewId] ?? {}) }
          const entry = { ...(days[day] ?? {}) }
          if (at) entry[task] = at
          else delete entry[task]
          days[day] = entry
          return { routine: { ...s.routine, [crewId]: days } }
        }),
      saveRun: (run) => set((s) => ({ runs: [...s.runs.filter((r) => r.id !== run.id), run] })),
      setSpeWarning: (speWarning) => set({ speWarning }),
      setBriefQuestions: (briefQuestions) => set({ briefQuestions }),
      resetSimulation: () =>
        set({ ...fresh(), crewId: DEFAULT_CREW_ID, environmentId: DEFAULT_ENVIRONMENT_ID, speWarning: false, briefQuestions: '' }),
    }),
    {
      name: STORE_KEY,
      version: STORE_VERSION,
      storage: createJSONStorage(() => localStorage),
      partialize: ({ crewId, environmentId, simSeed, simVersion, readings, routine, runs, speWarning, briefQuestions }) => ({
        crewId,
        environmentId,
        simSeed,
        simVersion,
        readings,
        routine,
        runs,
        speWarning,
        briefQuestions,
      }),
      // Older or foreign shapes are discarded; sanitizePersisted keeps only what is still valid.
      migrate: (persisted) => sanitizePersisted(persisted) as PersistedSlice,
      merge: (persisted, current) => ({ ...current, ...sanitizePersisted(persisted) }),
    },
  ),
)
