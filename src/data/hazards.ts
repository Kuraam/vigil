import type { Hazard } from '../types'
import { SOURCES } from './sources'

/**
 * The five NASA HRP hazards. One plain-English line each, taken from the
 * official challenge resource (NASA HRP, 5 Hazards of Human Spaceflight).
 */
export const HAZARDS: Hazard[] = [
  {
    id: 'space-radiation',
    name: 'Space Radiation',
    summary: 'Invisible, and considered one of the most hazardous aspects of spaceflight.',
    source: SOURCES.hrpHazards.label,
  },
  {
    id: 'isolation-confinement',
    name: 'Isolation and Confinement',
    summary:
      'Small crews in close quarters for long periods can show behavioural changes; crews must be carefully chosen, trained and supported.',
    source: SOURCES.hrpHazards.label,
  },
  {
    id: 'distance-from-earth',
    name: 'Distance from Earth',
    summary:
      'Mars is about 140 million miles away on average; a Mars mission lasts roughly three years versus a three-day lunar trip; planning and self-sufficiency are key.',
    source: SOURCES.hrpHazards.label,
  },
  {
    id: 'gravity-fields',
    name: 'Gravity Fields',
    summary:
      'Mars gravity is three-eighths of Earth’s; muscles, bones, inner ear and organs must adapt, including on return to Earth.',
    source: SOURCES.hrpHazards.label,
  },
  {
    id: 'hostile-closed-environments',
    name: 'Hostile/Closed Environments',
    summary: 'The spacecraft is both home and machine; temperature, pressure, lighting, noise and microbes all matter.',
    source: SOURCES.hrpHazards.label,
  },
]

export const HAZARD_FOOTNOTE = 'The hazards can feed off one another and worsen effects on the body.'

export function getHazard(id: Hazard['id']): Hazard {
  return HAZARDS.find((h) => h.id === id)!
}
