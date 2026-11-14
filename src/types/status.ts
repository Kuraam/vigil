/**
 * Status vocabulary shared by every assessment in VIGIL.
 * `nodata` covers "no reading", "not enough history to rate" and imaging
 * entries, which are logged but never rated.
 */
export type Status = 'nominal' | 'watch' | 'action' | 'nodata'

export type StatusReason = 'no-reading' | 'logged' | 'insufficient-history' | 'rated'

export interface StatusResult {
  status: Status
  reason: StatusReason
  /** Plain-English reason for the rating, e.g. "Below 60 bpm (team rule)". */
  detail: string
  /** Sources of the threshold value(s) that decided this tier, e.g. the CDC fever definition for a fever. */
  basis?: string[]
  /** True for a top-priority action, e.g. hypertensive crisis. */
  priority?: boolean
}
