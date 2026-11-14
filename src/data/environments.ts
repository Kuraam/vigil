import type { Environment, EnvironmentId } from '../types'
import { SOURCES } from './sources'

/*
 * Mission profile: a Mars mission. Orbital Station is the ISS-class reference.
 * One-way signal delay = light travel time.
 *   Earth-Mars: ~3 to ~22 min (NASA Mars Relay Network); 182-1338 s.
 *   Low Earth orbit: under 1 s (light time via geostationary relay is about 0.24 s).
 */
export const ENVIRONMENTS: Environment[] = [
  {
    id: 'spacecraft-transit',
    name: 'Spacecraft Transit',
    context: 'Earth–Mars transit',
    commDelay: { minSeconds: 0, maxSeconds: 1338, label: 'Up to 22.3 min', source: SOURCES.marsRelay.label },
  },
  {
    id: 'orbital-station',
    name: 'Orbital Station',
    context: 'Low Earth orbit, ISS-class',
    commDelay: { minSeconds: 0.24, maxSeconds: 0.24, label: 'Under 1 s', source: SOURCES.lightTime.label },
  },
  {
    id: 'pressurized-rover',
    name: 'Pressurized Rover',
    context: 'Mars surface',
    commDelay: { minSeconds: 182, maxSeconds: 1338, label: '3.0 to 22.3 min', source: SOURCES.marsRelay.label },
  },
  {
    id: 'surface-base',
    name: 'Surface Base',
    context: 'Mars surface',
    commDelay: { minSeconds: 182, maxSeconds: 1338, label: '3.0 to 22.3 min', source: SOURCES.marsRelay.label },
  },
]

export const DEFAULT_ENVIRONMENT_ID: EnvironmentId = 'spacecraft-transit'

export function getEnvironment(id: EnvironmentId): Environment {
  return ENVIRONMENTS.find((e) => e.id === id) ?? ENVIRONMENTS[0]
}

export function isEnvironmentId(id: unknown): id is EnvironmentId {
  return ENVIRONMENTS.some((e) => e.id === id)
}
