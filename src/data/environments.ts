import type { Environment, EnvironmentId } from '../types'

/*
 * One-way signal delay to Earth = light travel time over the current distance.
 * Speed of light: 299,792 km/s.
 *   Earth-Mars closest approach  ~54.6 million km -> ~182 s  (~3.0 min)
 *   Earth-Mars superior conjunction ~401 million km -> ~1338 s (~22.3 min)
 *   Low Earth orbit via geostationary relay ~2 x 35,786 km -> ~0.24 s (light time only)
 * Pressurized Rover and Surface Base are assumed to be on Mars for this concept.
 * These are physics figures, not medical thresholds.
 */
const MARS_SOURCE = 'Light travel time over Earth–Mars distance of 54.6–401 million km (NASA Mars Fact Sheet)'

export const ENVIRONMENTS: Environment[] = [
  {
    id: 'spacecraft-transit',
    name: 'Spacecraft Transit',
    context: 'Earth–Mars cruise',
    commDelay: { minSeconds: 0, maxSeconds: 1338, source: `${MARS_SOURCE}. Grows from near zero at departure.` },
  },
  {
    id: 'orbital-station',
    name: 'Orbital Station',
    context: 'Low Earth orbit',
    commDelay: {
      minSeconds: 0.24,
      maxSeconds: 0.24,
      source: 'Light travel time via geostationary relay (about 2 × 35,786 km). Excludes ground processing.',
    },
  },
  {
    id: 'pressurized-rover',
    name: 'Pressurized Rover',
    context: 'Mars surface traverse',
    commDelay: { minSeconds: 182, maxSeconds: 1338, source: MARS_SOURCE },
  },
  {
    id: 'surface-base',
    name: 'Surface Base',
    context: 'Mars surface habitat',
    commDelay: { minSeconds: 182, maxSeconds: 1338, source: MARS_SOURCE },
  },
]

export const DEFAULT_ENVIRONMENT_ID: EnvironmentId = 'spacecraft-transit'

export function getEnvironment(id: EnvironmentId): Environment {
  return ENVIRONMENTS.find((e) => e.id === id) ?? ENVIRONMENTS[0]
}

export function isEnvironmentId(id: unknown): id is EnvironmentId {
  return ENVIRONMENTS.some((e) => e.id === id)
}
