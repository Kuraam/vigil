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
