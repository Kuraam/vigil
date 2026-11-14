import type { EnvironmentId, ThresholdValue } from '../types'
import { SOURCES } from './sources'

const v = (value: number, unit: string, source: { label: string }): ThresholdValue => ({ value, unit, source: source.label })

export interface DoseRate {
  /** Rate used for calculations. */
  rate: ThresholdValue
  /** Published range, when the source gives one (Orbital Station). */
  range?: [number, number]
}

/** Daily dose rate by environment, in mSv/day. Values supplied by the team with sources. */
export const DOSE_RATES: Record<EnvironmentId, DoseRate> = {
  'spacecraft-transit': { rate: v(1.84, 'mSv/day', SOURCES.radCruise) },
  'pressurized-rover': { rate: v(0.64, 'mSv/day', SOURCES.radGale) },
  'surface-base': { rate: v(0.64, 'mSv/day', SOURCES.radGale) },
  'orbital-station': { rate: v(0.35, 'mSv/day', SOURCES.issDosimetry), range: [0.2, 0.5] },
}

export const RADIATION_LIMITS = {
  career: v(600, 'mSv', SOURCES.nasaStd3001Career),
  solarParticleEvent: v(250, 'mSv per event', SOURCES.nasaStd3001Spe),
  /** Status as a share of the career limit (team rule). */
  watchAtFraction: v(0.5, 'of career limit', SOURCES.team),
  actionAboveFraction: v(0.8, 'of career limit', SOURCES.team),
}

/** Simulated mission days 1-30 were all spent in transit. */
export const SIMULATED_MISSION_ENVIRONMENT: EnvironmentId = 'spacecraft-transit'

/** Prior career dose is seeded per crew member in this range (simulated). */
export const PRIOR_DOSE_RANGE: [number, number] = [40, 200]

export const NEUTRON_NOTE = {
  text: 'Neutrons make up about 30% of total radiation on the ISS. The CSA is developing CANS, an autonomous neutron spectrometer, to monitor this exposure.',
  source: SOURCES.csaRadiation,
}
