import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import { DEFAULT_CREW_ID } from '../data/crew'
import { DEFAULT_ENVIRONMENT_ID } from '../data/environments'
import { generateReadings, SIM_SEED, SIM_VERSION } from '../data/simulate'
import type { EnvironmentId, VitalReading } from '../types'
import { sanitizePersisted, type PersistedSlice } from './persistence'

interface VigilState extends PersistedSlice {
  setCrew: (crewId: string) => void
  setEnvironment: (environmentId: EnvironmentId) => void
  /** Add a reading a person logged in the app. It is saved and shown everywhere at once. */
  addReading: (reading: VitalReading) => void
  /** Regenerate the simulated dataset from the fixed seed and drop logged readings. */
  resetSimulation: () => void
}

export const STORE_KEY = 'vigil-store'
const STORE_VERSION = 2

const fresh = () => ({ simSeed: SIM_SEED, simVersion: SIM_VERSION, readings: generateReadings(SIM_SEED) })

export const useVigilStore = create<VigilState>()(
  persist(
    (set) => ({
      crewId: DEFAULT_CREW_ID,
      environmentId: DEFAULT_ENVIRONMENT_ID,
      ...fresh(),
      setCrew: (crewId) => set({ crewId }),
      setEnvironment: (environmentId) => set({ environmentId }),
      addReading: (reading) => set((s) => ({ readings: [...s.readings, reading] })),
      resetSimulation: () => set(fresh()),
    }),
    {
      name: STORE_KEY,
      version: STORE_VERSION,
      storage: createJSONStorage(() => localStorage),
      partialize: ({ crewId, environmentId, simSeed, simVersion, readings }) => ({
        crewId,
        environmentId,
        simSeed,
        simVersion,
        readings,
      }),
      // Older or foreign shapes are discarded; sanitizePersisted keeps only what is still valid.
      migrate: (persisted) => sanitizePersisted(persisted) as PersistedSlice,
      merge: (persisted, current) => ({ ...current, ...sanitizePersisted(persisted) }),
    },
  ),
)
