import type { EnvironmentId, HazardId } from '../types'

export interface HazardPriority {
  hazard: HazardId
  /** One-line reason, worded from the NASA 5 Hazards page and VIGIL's cited figures. */
  reason: string
}

/** Shown with the ranking. The ranking is a VIGIL team decision, not a NASA ranking. */
export const PRIORITY_LABEL = 'Team-defined ranking, informed by the NASA HRP 5 Hazards of Human Spaceflight page.'

const R = {
  radiationTransit: { hazard: 'space-radiation', reason: 'Invisible, and highest in transit at 1.84 mSv per day.' },
  radiationSurface: { hazard: 'space-radiation', reason: 'Still present on Mars at 0.64 mSv per day.' },
  radiationRover: { hazard: 'space-radiation', reason: 'Invisible; 0.64 mSv per day on the Mars surface.' },
  radiationStation: { hazard: 'space-radiation', reason: 'Lower in low Earth orbit, about 0.2 to 0.5 mSv per day.' },
  distanceMars: { hazard: 'distance-from-earth', reason: 'Up to 22.3 min each way: planning and self-sufficiency are key.' },
  distanceStation: { hazard: 'distance-from-earth', reason: 'Earth is under a second away, so ground help is close.' },
  isolation: { hazard: 'isolation-confinement', reason: 'Small crew in close quarters for long periods.' },
  gravityWeightless: { hazard: 'gravity-fields', reason: 'Weightless: muscles, bones, inner ear and organs must adapt.' },
  gravityMars: { hazard: 'gravity-fields', reason: 'Mars gravity is three-eighths of Earth’s; the body adapts again.' },
  gravityTransitLater: { hazard: 'gravity-fields', reason: 'Weightless now, and the body must adapt again on arrival.' },
  closedStation: { hazard: 'hostile-closed-environments', reason: 'The station is home and machine: air, noise, microbes all matter.' },
  closedRover: { hazard: 'hostile-closed-environments', reason: 'A small vehicle is home and machine: temperature, pressure, air.' },
  closedOther: { hazard: 'hostile-closed-environments', reason: 'Home and machine: temperature, pressure, lighting, noise, microbes.' },
} satisfies Record<string, HazardPriority>

/** Hazard ranking per environment (1 first), exactly as supplied by the team. */
export const HAZARD_PRIORITY: Record<EnvironmentId, HazardPriority[]> = {
  'orbital-station': [R.gravityWeightless, R.closedStation, R.isolation, R.radiationStation, R.distanceStation],
  'spacecraft-transit': [R.radiationTransit, R.distanceMars, R.isolation, R.gravityTransitLater, R.closedOther],
  'pressurized-rover': [R.closedRover, R.isolation, R.distanceMars, R.radiationRover, R.gravityMars],
  'surface-base': [R.gravityMars, R.radiationSurface, R.distanceMars, R.isolation, R.closedOther],
}
