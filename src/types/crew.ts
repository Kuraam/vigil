/** A fictional crew member. All crew in this build are simulated. */
export interface CrewMember {
  id: string
  /** Call sign shown in the UI. */
  callSign: string
  name: string
  role: string
  /** Age in years; drives the simulated baseline only. */
  age: number
  simulated: true
}
