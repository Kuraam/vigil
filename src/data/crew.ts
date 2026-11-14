import type { CrewMember } from '../types'

/**
 * SIMULATED CREW. These people are fictional and exist only to drive the
 * concept demonstration. Any resemblance to real astronauts is unintended.
 */
export const CREW: CrewMember[] = [
  { id: 'crew-01', callSign: 'CDR', name: 'Ines Varga', role: 'Commander', age: 44, simulated: true },
  { id: 'crew-02', callSign: 'PLT', name: 'Kofi Adeyemi', role: 'Pilot', age: 38, simulated: true },
  { id: 'crew-03', callSign: 'FE', name: 'Mei Tanaka-Ross', role: 'Flight Engineer', age: 35, simulated: true },
  { id: 'crew-04', callSign: 'CMO', name: 'Arjun Sethi', role: 'Crew Medical Officer', age: 41, simulated: true },
]

export const DEFAULT_CREW_ID = CREW[0].id

export function getCrew(id: string): CrewMember | undefined {
  return CREW.find((c) => c.id === id)
}

export function isCrewId(id: unknown): id is string {
  return CREW.some((c) => c.id === id)
}
