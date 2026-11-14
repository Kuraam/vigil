export type EnvironmentId =
  | 'spacecraft-transit'
  | 'orbital-station'
  | 'pressurized-rover'
  | 'surface-base'

/** One-way Earth signal delay, as a range because orbital geometry changes it. */
export interface CommDelay {
  /** Minimum one-way delay in seconds. */
  minSeconds: number
  /** Maximum one-way delay in seconds. */
  maxSeconds: number
  /** Display text, e.g. "Under 1 s" or "3.0 to 22.3 min". */
  label: string
  /** Where the figure comes from (physics or published reference). */
  source: string
}

export interface Environment {
  id: EnvironmentId
  name: string
  /** Short context line, e.g. "Earth–Mars cruise". */
  context: string
  commDelay: CommDelay
}
