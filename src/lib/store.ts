import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import { DEFAULT_CREW_ID } from '../data/crew'
import { DEFAULT_ENVIRONMENT_ID } from '../data/environments'
import { generateReadings, SIM_SEED } from '../data/simulate'
import type { EnvironmentId } from '../types'
import { sanitizePersisted, type PersistedSlice } from './persistence'

interface VigilState extends PersistedSlice {
  setCrew: (crewId: string) => void
  /** Changes global state only in Phase 1; environment-aware logic arrives later. */
  setEnvironment: (environmentId: EnvironmentId) => void
  /** Regenerate the simulated dataset from the fixed seed. */
  resetSimulation: () => void
}

export const STORE_KEY = 'vigil-store'
const STORE_VERSION = 1

export const useVigilStore = create<VigilState>()(
  persist(
    (set) => ({
      crewId: DEFAULT_CREW_ID,
      environmentId: DEFAULT_ENVIRONMENT_ID,
      simSeed: SIM_SEED,
      readings: generateReadings(SIM_SEED),
      setCrew: (crewId) => set({ crewId }),
      setEnvironment: (environmentId) => set({ environmentId }),
      resetSimulation: () => set({ simSeed: SIM_SEED, readings: generateReadings(SIM_SEED) }),
    }),
    {
      name: STORE_KEY,
      version: STORE_VERSION,
      storage: createJSONStorage(() => localStorage),
      partialize: ({ crewId, environmentId, simSeed, readings }) => ({ crewId, environmentId, simSeed, readings }),
      // Older or foreign shapes are discarded; sanitizePersisted keeps only what is still valid.
      migrate: (persisted) => sanitizePersisted(persisted) as PersistedSlice,
      merge: (persisted, current) => ({ ...current, ...sanitizePersisted(persisted) }),
    },
  ),
)
