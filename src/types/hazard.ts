/** The five hazards of human spaceflight defined by the NASA Human Research Program (HRP). */
export type HazardId =
  | 'space-radiation'
  | 'isolation-confinement'
  | 'distance-from-earth'
  | 'gravity-fields'
  | 'hostile-closed-environments'

export interface Hazard {
  id: HazardId
  name: string
  /** One-sentence plain-language summary for a non-physician crew member. */
  summary: string
  /** Body systems / vitals this hazard most plausibly affects (used from Phase 2). */
  watchFor: string[]
  source: string
}
